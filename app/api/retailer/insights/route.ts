import { NextResponse } from "next/server";
import { getRetailerIntelligence } from "@/lib/services/retailer-ai";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = getRetailerIntelligence();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load retailer intelligence" },
      { status: 500 }
    );
  }
}
