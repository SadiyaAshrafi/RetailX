import { NextRequest, NextResponse } from "next/server";
import { startRaceTest, getRateLimitStatus, DEMO_RACE_SKU } from "@/lib/services/race-test";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));

    // Allowlist check: If user passes a custom product ID that is not the demo SKU, return 400
    if (body.productId && body.productId !== DEMO_RACE_SKU) {
      return NextResponse.json(
        { error: `Invalid SKU. Race test is strictly restricted to '${DEMO_RACE_SKU}'.` },
        { status: 400 }
      );
    }

    // Rate limit check: 1 run per 30s
    const rateLimit = getRateLimitStatus();
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded. A race test was recently executed.",
          retry_after: rateLimit.retryAfter,
        },
        {
          status: 429,
          headers: { "Retry-After": String(rateLimit.retryAfter) },
        }
      );
    }

    const n = Math.min(50, Math.max(2, Number(body.n) || 10));
    const run = await startRaceTest(n);

    return NextResponse.json({
      run_id: run.id,
      n: run.n,
      started_at: run.startedAt,
      attempts: run.attempts.map((a) => ({
        i: a.i,
        order_id: a.orderId,
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Race test execution failed.";
    if (message.includes("Rate limit")) {
      const rateLimit = getRateLimitStatus();
      return NextResponse.json(
        { error: message, retry_after: rateLimit.retryAfter },
        { status: 429 }
      );
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
