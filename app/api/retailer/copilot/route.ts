import { NextRequest, NextResponse } from "next/server";
import { handleCopilotQuery } from "@/lib/services/retailer-ai";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const query = body.query || "";
    const language = body.language || "en";

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    const response = handleCopilotQuery(query, language);
    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Copilot failed" },
      { status: 500 }
    );
  }
}
