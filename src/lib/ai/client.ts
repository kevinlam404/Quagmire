import {
  GoogleGenerativeAI,
  GenerativeModel,
  GenerationConfig,
} from "@google/generative-ai";
import type { ErrorCode } from "@/types/graph";
import { error } from "console";

//Types
export interface GeminiResponse {
  text: string;
  promptTokens: number;
  totalTokens: number;
}

export interface ClientError {
  code: ErrorCode;
  message: string;
  retry: boolean;
}

export type RateLimitType = "generate" | "expand";

interface RateLimitEntry {
  generateCount: number;
  expandCount: number;
  windowStart: number;
}

//Constants
const MODEL_NAME = "gemini-2.5-flash-lite";
const MAX_TOKENS = 4096;
const TEMPERATURE = 0.85;
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_GENERATE = 10;
const RATE_LIMIT_MAX_EXPAND = 30;

const MIN_TOPIC_LENGTH = 2;
const MAX_TOPIC_LENGTH = 120;

const BLOCKED_PATTERNS = [
  /ignore (previous|all|above) instructions/i,
  /you are now/i,
  /disregard your/i,
  /act as/i,
  /jailbreak/i,
  /system prompt/i,
  /\[INST\]/i,
  /<\|.*?\|>/i,
  /```[\s\S]*?```/,
] as const;

//API key validation
function getApiKey(): string {
  const key = process.env.GEMINI_API_KEY;

  if (!key) {
    throw new Error("GEMINI_API_KEY was not set.");
  }
  return key;
}

//Model factory
function buildModel(): GenerativeModel {
  const genAI = new GoogleGenerativeAI(getApiKey());

  const config: GenerationConfig = {
    temperature: TEMPERATURE,
    maxOutputTokens: MAX_TOKENS,
    responseMimeType: "application/json",
  };

  return genAI.getGenerativeModel({
    model: MODEL_NAME,
    generationConfig: config,
  });
}

//Rate Limiter
const rateLimitStore = new Map<string, RateLimitEntry>();

//Purge stale entries to prevent memory leaks on long running instances
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of rateLimitStore.entries()) {
      if (now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
        rateLimitStore.delete(ip);
      }
    }
  }, 5 * 60_000);
}

export function checkRateLimit(
  ip: string,
  type: RateLimitType,
): { allowed: boolean; remaining: number; resetInMs: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(ip);
  const limit =
    type === "generate" ? RATE_LIMIT_MAX_GENERATE : RATE_LIMIT_MAX_EXPAND;

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitStore.set(ip, {
      generateCount: type === "generate" ? 1 : 0,
      expandCount: type === "expand" ? 1 : 0,
      windowStart: now,
    });
    return {
      allowed: true,
      remaining: limit - 1,
      resetInMs: RATE_LIMIT_WINDOW_MS,
    };
  }
  const count = type === "generate" ? entry.generateCount : entry.expandCount;
  const resetInMs = RATE_LIMIT_WINDOW_MS - (now - entry.windowStart);

  if (count >= limit) {
    return { allowed: false, remaining: 0, resetInMs };
  }
  // Increment the right counter
  rateLimitStore.set(ip, {
    ...entry,
    generateCount:
      type === "generate" ? entry.generateCount + 1 : entry.generateCount,
    expandCount: type === "expand" ? entry.expandCount + 1 : entry.expandCount,
  });

  return{
    allowed: true,
    remaining: limit - count - 1,
    resetInMs
  };
}

//Input sanitization
export function sanitizeTopic(raw: string): {
    safe: string;
    rejected: boolean;
    reason?: string;
} {
  const trimmed = raw.trim();

  if (trimmed.length < MIN_TOPIC_LENGTH) {
    return { safe: "", rejected: true, reason: "Topic too short" };
  }

  if (trimmed.length > MAX_TOPIC_LENGTH) {
    return { safe: "", rejected: true, reason: "Topic too long" };
  }

  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(trimmed)) {
      return { safe: "", rejected: true, reason: "Invalid topic" };
    }
  }

  // Strip HTML tags
  const stripped = trimmed.replace(/<[^>]*>/g, "").trim();

  if (stripped.length < MIN_TOPIC_LENGTH) {
    return { safe: "", rejected: true, reason: "Topic too short after sanitization" };
  }

  return { safe: stripped, rejected: false };
}

//Retry helpers
function isRetryableError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  const msg = error.message.toLowerCase();

  return (
    msg.includes("503")           ||
    msg.includes("429")           ||
    msg.includes("timeout")       ||
    msg.includes("network")       ||
    msg.includes("econnreset")    ||
    msg.includes("socket hang up")
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

//Core Gemini call
export async function callGemini(
    systemPrompt: string,
    userPrompt: string,
): Promise<GeminiResponse> {
    const model = buildModel();
    let lastError: unknown;

    for(let attempt=0; attempt<=MAX_RETRIES; attempt++){
        try{
            if(attempt>0){
                await sleep(RETRY_DELAY_MS * attempt);
            }
            const result = await model.generateContent(
                `${systemPrompt}\n\n${userPrompt}`
            );

            const response = result.response;
            const text = response.text();
            const usage = response.usageMetadata;

            if(!text || text.trim() === ""){
                throw new Error("Gemini returned an empty response");
            }

            return {
                text,
                promptTokens: usage?.promptTokenCount ?? 0,
                totalTokens: usage?.totalTokenCount ?? 0,
            };
        } catch (error){
            lastError = error;
            if(!isRetryableError(error)) break;
        }
    }
    const isRetryable = isRetryableError(lastError);
    const clientError = {
        code: isRetryable ? "AI_UNAVAILABLE": "AI_PARSE_FAILED",
        message: lastError instanceof Error ? lastError.message : "Uknown Gemini Error", retry: isRetryable,
    };
    throw clientError;
}

//JSON parser
export function parseGeminiJson<T>(
    raw: string
): { data: T; error: null } | { data: null; error: ClientError} {
    try{
        const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/,           "").trim();
        const parsed = JSON.parse(cleaned) as T;

        return{ data: parsed, error: null};
    } catch{
        return {
            data: null,
            error: {code: "AI_PARSE_FAILED", message: "Failed to parse Gemini response as JSON", retry: true,},
        };
    }
}

//IP extraction (used by api routes to get caller ip for rate limting)
export function getClientIP(request: Request): string{
    const forwarded = request.headers.get("x-forwarded-for");
    const realIp = request.headers.get("x-real-ip");

    if(forwarded){
        return forwarded.split(",")[0].trim();
    }

    if(realIp){
        return realIp.trim();
    }

    //Fallback for local development
    return "127.0.0.1";
}

