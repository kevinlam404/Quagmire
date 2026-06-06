import { NextResponse } from "next/server";
import {
  callGemini,
  parseGeminiJson,
  sanitizeTopic,
  checkRateLimit,
  getClientIP,
} from "@/lib/ai/client";
import { buildGeneratePrompt, SYSTEM_PROMPT } from "@/lib/ai/prompts";
import type {
  GenerateRequest,
  ErrorResponse,
  RawGenerateResponse,
} from "@/types/graph";

export async function POST(request: Request) {
  //Rate limit
  const ip = getClientIP(request);
  const rateLimit = checkRateLimit(ip, "generate");

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: `Rate limit exceeded. Try again in ${Math.ceil(rateLimit.resetInMs / 1000)} seconds.`,
        code: "RATE_LIMITED",
      } satisfies ErrorResponse,
      {
        status: 429,
        headers: {
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(rateLimit.resetInMs),
        },
      },
    );
  }

  //Parse and validate request body
  let body: GenerateRequest;

  try {
    body = (await request.json()) as GenerateRequest;
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "Invalid JSON in request body",
        code: "INVALID_TOPIC",
      } satisfies ErrorResponse,
      { status: 400 },
    );
  }

  //Validate topic exists and is a string
  if (!body.topic || typeof body.topic !== "string") {
    return NextResponse.json(
      {
        success: false,
        error: "Topic is required and must be a string",
        code: "INVALID_TOPIC",
      } satisfies ErrorResponse,
      { status: 400 },
    );
  }

  //Sanitize topic
  const { safe, rejected, reason } = sanitizeTopic(body.topic);

  if (rejected) {
    return NextResponse.json(
      {
        success: false,
        error: reason ?? "Invalid topic",
        code: "INVALID_TOPIC",
      } satisfies ErrorResponse,
      { status: 400 },
    );
  }

  //Call Gemini

  let rawText: string;

  try {
    const response = await callGemini(SYSTEM_PROMPT, buildGeneratePrompt(safe));
    rawText = response.text;
  } catch (err) {
    console.error("Error calling Gemini:", err);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to reach AI service. Please try again.",
        code: "AI_UNAVAILABLE" as ErrorResponse["code"],
      } satisfies ErrorResponse,
      { status: 503 },
    );
  }

  //Parse Gemini JSON response
  const { data: raw, error: parseError } =
    parseGeminiJson<RawGenerateResponse>(rawText);

  if (parseError || !raw) {
    return NextResponse.json(
      {
        success: false,
        error: "AI returned malformed data. Please try again.",
        code: "AI_PARSE_FAILED",
      } satisfies ErrorResponse,
      { status: 422 },
    );
  }

  //Validate raw response shape
  if (
    !raw.rootLabel ||
    !Array.isArray(raw.nodes) ||
    !Array.isArray(raw.edges) ||
    raw.nodes.length === 0
  ) {
    return NextResponse.json(
      {
        success: false,
        error: "AI returned incomplete graph data. Please try again.",
        code: "AI_PARSE_FAILED",
      } satisfies ErrorResponse,
      { status: 422 },
    );
  }

  //Return raw response
  return NextResponse.json(
    {
      success: true,
      rootLabel: raw.rootLabel,
      nodes: raw.nodes,
      edges: raw.edges,
    },
    {
      status: 200,
      headers: {
        "X-RateLimit-Remaining": String(rateLimit.remaining),
        "X-RateLimit-Reset": String(rateLimit.resetInMs),
      },
    },
  );
}
