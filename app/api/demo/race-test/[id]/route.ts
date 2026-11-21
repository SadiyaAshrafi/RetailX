import { NextRequest, NextResponse } from "next/server";
import { raceRuns, getLiveDemoStock } from "@/lib/services/race-test";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const run = raceRuns.get(id);

    if (!run) {
      return NextResponse.json({ error: "Race test run not found." }, { status: 404 });
    }

    // Refresh final stock live from DB
    const finalStock = await getLiveDemoStock();
    const winners = run.attempts.filter((a) => a.status === "reserved").length;
    const invariantOk = winners === 1 && finalStock === 0;

    return NextResponse.json({
      id: run.id,
      n: run.n,
      started_at: run.startedAt,
      finished_at: run.finishedAt,
      state: run.state,
      winners,
      final_stock: finalStock,
      invariant_ok: invariantOk,
      sql_query: run.sqlQuery,
      attempts: run.attempts.map((a) => ({
        i: a.i,
        order_id: a.orderId,
        status: a.status,
        reason: a.reason,
        latency_ms: a.latencyMs,
        idempotency_key: a.idempotencyKey,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to retrieve race test run." },
      { status: 500 }
    );
  }
}
