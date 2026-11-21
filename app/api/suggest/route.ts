import { NextRequest, NextResponse } from "next/server";
import { suggestProducts } from "@/lib/services/search";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") || "";
    const suggestions = q.length >= 1 ? await suggestProducts(q) : [];
    return NextResponse.json({
      suggestions,
      source: "Aiven OpenSearch",
    });
  } catch (error) {
    return NextResponse.json({
      suggestions: [],
      error: error instanceof Error ? error.message : "Suggestion error",
    });
  }
}
