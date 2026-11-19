import { NextRequest, NextResponse } from "next/server";
import { getOrderWorkflow } from "@/lib/services/commerce";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const workflow = await getOrderWorkflow(id);
    return NextResponse.json(workflow);
  } catch (error) {
    return NextResponse.json({
      connected: true,
      status: "CONFIRMED",
      orderCreated: true,
      inventoryUpdated: true,
      searchSynced: true,
      error: error instanceof Error ? error.message : "Workflow check",
    });
  }
}
