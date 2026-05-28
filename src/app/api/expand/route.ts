import { NextResponse } from "next/server";
import { callGemini, parseGeminiJson, sanitizeTopic, checkRateLimit, getClientIP } from "@/lib/ai/client";
import { buildExpandedPrompt, SYSTEM_PROMPT} from "@/lib/ai/prompts";
import type { ExpandRequest, ErrorResponse, RawExpandResponse } from "@/types/graph";
import build from "next/dist/build";

export async function POST(request: Request){
    const ip = getClientIP(request);
    const rateLimit = checkRateLimit(ip, "expand");

    //Rate limit
    if(!rateLimit.allowed){
        return NextResponse.json({
            success: false,
            error: "Rate limit exceeded. Try again in ${Math.ceil(rateLimit.resetInMs/1000)} seconds.",
            code: "RATE_LIMITED",            
        } satisfies ErrorResponse, {
            status: 429,
            headers:{
                "X-RateLimit-Remaining": "0",
                "X-RateLimit-Reset": String(rateLimit.resetInMs),
            },
        });
    }

    //Parse request body
    let body: ExpandRequest;

    try{
        body = await request.json() as ExpandRequest;
    } catch{
        return NextResponse.json({
            success: false,
            error: "Invalid JSON in request body",
            code: "INVALID_TOPIC",
        } satisfies ErrorResponse, {status: 400});
    }

    //Validate required fields
    if(!body.nodeId || !body.nodeLabel || !body.nodeCategory || !body.nodeDescription || !Array.isArray(body.existingLabels) || !body.categoryCounts){
        return NextResponse.json({
            success: false,
            error: "Missing required fields. nodeId, nodeLabel, nodeCategory, nodeDescription, existingLabels, categoryCounts",
            code: "EXPAND_FAILED",
        } satisfies ErrorResponse, {status: 400});
    }

    //Guards against ovesized payload
    if(body.existingLabels.length > 100){
        return NextResponse.json({
            success: false,
            error: "Graph has too many nodes to expand further. RIP",
            code: "EXPAND_FAILED",
        } satisfies ErrorResponse, {status: 400});
    }

    //Sanitize node label
    const { safe: safeLabel, rejected, reason} = sanitizeTopic(body.nodeLabel);

    if(rejected){
        return NextResponse.json({
            success: false,
            error: reason ?? "Invalid node label",
            code: "INVALID_TOPIC",
        } satisfies ErrorResponse, {status: 400});
    }

    //Call Gemini
    let rawText: string;

    try{
        const response = await callGemini(SYSTEM_PROMPT, buildExpandedPrompt(safeLabel, body.nodeCategory, body.nodeDescription, body.existingLabels, body.categoryCounts));
        rawText = response.text;
    } catch{
        return NextResponse.json({
            success: false,
            error: "Failed to reach AI service. Please try again",
            code: "AI_UNAVAILABLE" as ErrorResponse["code"],
        } satisfies ErrorResponse, {status: 503});
    }

    //Parse Gemini JSON response
    const {data: raw, error: parseError} = parseGeminiJson<RawExpandResponse>(rawText);

    if(parseError || !raw){
        return NextResponse.json({
            success: false,
            error: "AI returned malformed data. Please try again.",
            code: "AI_PARSE_FAILED",
        } satisfies ErrorResponse, {status: 422});
    }

    //Validate raw response shape
    if(!Array.isArray(raw.nodes) || !Array.isArray(raw.edges) || !Array.isArray(raw.crossEdges) || raw.nodes.length === 0){
        return NextResponse.json({
            success: false,
            error: "AI returned incomplete expansion data. Please try again.",
            code: "AI_PARSE_FAILED",    
        } satisfies ErrorResponse, {status: 422});
    }

    //Return raw response
    return NextResponse.json({
        success: true,
        nodes: raw.nodes,
        edges: raw.edges,
        crossEdges: raw.crossEdges,
    }, {status: 200, headers:{
        "X-RateLimit-Remaining": String(rateLimit.remaining - 1),
        "X-RateLimit-Reset": String(rateLimit.resetInMs),
    }});
}