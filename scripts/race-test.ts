/**
 * Verification Script for PRD ADDENDUM A2: Race Test — "Last Item Fairness Proof"
 * Usage: npx tsx scripts/race-test.ts
 */

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const N = Number(process.env.RACE_TEST_N) || 10;

type AttemptResult = {
  i: number;
  order_id: string;
  status: "reserved" | "rejected";
  reason?: string;
  latency_ms: number;
};

type RunStatus = {
  id: string;
  n: number;
  state: string;
  winners: number;
  final_stock: number;
  invariant_ok: boolean;
  sql_query: string;
  attempts: AttemptResult[];
};

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runVerification() {
  console.log(`\n======================================================`);
  console.log(`  RETAILX RACE TEST: "Last Item Fairness Proof"`);
  console.log(`  Target: ${BASE_URL}`);
  console.log(`  Concurrent Buyers (N): ${N}`);
  console.log(`======================================================\n`);

  let allPassed = true;
  const assertions: Array<{ name: string; expected: string; actual: string; pass: boolean }> = [];

  // TEST 1: Launch Race Test (10 concurrent buyers, 1 unit)
  console.log(`[1/3] Triggering race test with ${N} concurrent buyers...`);
  const postRes = await fetch(`${BASE_URL}/api/demo/race-test`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ n: N }),
  });

  if (!postRes.ok) {
    const errText = await postRes.text();
    console.error(`❌ POST /api/demo/race-test failed with status ${postRes.status}: ${errText}`);
    process.exit(1);
  }

  const postData = await postRes.json();
  const runId = postData.run_id;
  console.log(`   ➔ Run ID generated: ${runId}`);

  // Poll for result (up to 20s)
  let runData: RunStatus | null = null;
  const startTime = Date.now();
  while (Date.now() - startTime < 20000) {
    const getRes = await fetch(`${BASE_URL}/api/demo/race-test/${runId}`);
    if (getRes.ok) {
      runData = await getRes.json();
      if (runData && runData.state === "completed") break;
    }
    await sleep(800);
  }

  if (!runData) {
    console.error("❌ Timed out waiting for race test completion.");
    process.exit(1);
  }

  // Assertions for Test 1
  const winnersCount = runData.winners;
  const rejectionsCount = runData.attempts.filter((a) => a.status === "rejected").length;
  const finalStock = runData.final_stock;
  const invariantOk = runData.invariant_ok;

  assertions.push({
    name: "Exactly 1 Winner (Stock Reserved)",
    expected: "1",
    actual: String(winnersCount),
    pass: winnersCount === 1,
  });

  assertions.push({
    name: `Clean Rejections (Out of Stock)`,
    expected: String(N - 1),
    actual: String(rejectionsCount),
    pass: rejectionsCount === N - 1,
  });

  assertions.push({
    name: "Final Stock Equals 0",
    expected: "0",
    actual: String(finalStock),
    pass: finalStock === 0,
  });

  assertions.push({
    name: "Invariant OK (winners==1 && stock==0)",
    expected: "true",
    actual: String(invariantOk),
    pass: invariantOk === true,
  });

  // TEST 2: Rate Limit (Immediate second POST should return 429)
  console.log(`\n[2/3] Testing global 30s rate-limit constraint...`);
  const rateLimitRes = await fetch(`${BASE_URL}/api/demo/race-test`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ n: N }),
  });

  assertions.push({
    name: "Immediate Second Run Rate-Limited (429)",
    expected: "429",
    actual: String(rateLimitRes.status),
    pass: rateLimitRes.status === 429,
  });

  // TEST 3: Real product override protection (Should return 400)
  console.log(`\n[3/3] Testing real-product override protection (security allowlist)...`);
  const overrideRes = await fetch(`${BASE_URL}/api/demo/race-test`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productId: "rx-bluetooth-earphones" }),
  });

  assertions.push({
    name: "Real SKU Override Blocked (400)",
    expected: "400",
    actual: String(overrideRes.status),
    pass: overrideRes.status === 400,
  });

  // Print Summary Table
  console.log(`\n======================================================`);
  console.log(`                 VERIFICATION RESULTS`);
  console.log(`======================================================`);
  for (const a of assertions) {
    const icon = a.pass ? "✅ PASS" : "❌ FAIL";
    console.log(`${icon} | ${a.name.padEnd(42)} | Expected: ${a.expected} | Got: ${a.actual}`);
    if (!a.pass) allPassed = false;
  }
  console.log(`======================================================\n`);

  if (allPassed) {
    console.log(`🎉 ALL ASSERTIONS PASSED! PostgreSQL atomic serialization proven.\n`);
    process.exit(0);
  } else {
    console.error(`💥 ONE OR MORE ASSERTIONS FAILED.\n`);
    process.exit(1);
  }
}

runVerification().catch((err) => {
  console.error("Unhandled verification error:", err);
  process.exit(1);
});
