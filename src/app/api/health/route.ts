import { NextResponse } from "next/server";

//Checks the overall health of route.ts to make sure there are no errors.
export async function GET(){
    const geminiKey = process.env.GEMINI_API_KEY;
 
    const checks = {
        geminiKey: !!geminiKey && geminiKey.startsWith("AI") && geminiKey.length >= 20,
        environment: process.env.NODE_ENV ?? "unknown",
        timestamp: new Date().toISOString,
        status: "ok" as const,
    };

    //Checks if API key length >=20 and starts with AI to confirm it exists
    if(!checks.geminiKey){
        return NextResponse.json({
            status: "error",
            error: "API key is missing or malformed",
            environment: checks.environment,
            timestamp: checks.timestamp,
        }, {status: 500});
    }

    return NextResponse.json(checks, {status: 200});
}