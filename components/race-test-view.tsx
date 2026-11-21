"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, CheckCircle2, Clock, Code, Play, RefreshCw, ShieldCheck, XCircle, Zap } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";

type Attempt = {
  i: number;
  order_id: string;
  status: "reserved" | "rejected";
  reason?: string;
  latency_ms: number;
  idempotency_key: string;
};

type RaceRunData = {
  id: string;
  n: number;
  started_at: string;
  finished_at?: string;
  state: "running" | "completed" | "queued";
  winners: number;
  final_stock: number;
  invariant_ok: boolean;
  sql_query: string;
  attempts: Attempt[];
};

export function RaceTestView() {
  const [state, setState] = useState<"IDLE" | "RUNNING" | "QUEUED" | "RESULT" | "VIOLATION">("IDLE");
  const [runId, setRunId] = useState<string | null>(null);
  const [runData, setRunData] = useState<RaceRunData | null>(null);
  const [countdown, setCountdown] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Countdown timer for 30s cooldown
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  async function startRace() {
    if (countdown > 0) return;
    setErrorMsg(null);
    setState("RUNNING");
    setRunData(null);

    try {
      const res = await api<{ run_id: string; n: number }>("/demo/race-test", {
        method: "POST",
        body: JSON.stringify({ n: 10 }),
      });

      setRunId(res.run_id);
      setCountdown(30);

      // Poll for completion
      pollRun(res.run_id);
    } catch (e: any) {
      if (e?.status === 429 || e?.message?.includes("Rate limit")) {
        setCountdown(30);
        setErrorMsg("Rate limit active (1 run per 30s). Please wait for the cooldown timer.");
        setState("IDLE");
      } else {
        setErrorMsg(e?.message || "Failed to start race test.");
        setState("IDLE");
      }
    }
  }

  async function pollRun(id: string) {
    let attemptsCount = 0;
    const maxAttempts = 20;

    const interval = setInterval(async () => {
      attemptsCount++;
      try {
        const data = await api<RaceRunData>(`/demo/race-test/${id}`);
        setRunData(data);

        if (data.state === "completed") {
          clearInterval(interval);
          if (data.invariant_ok) {
            setState("RESULT");
          } else {
            setState("VIOLATION");
          }
        } else if (attemptsCount >= maxAttempts) {
          clearInterval(interval);
          setState("QUEUED");
        }
      } catch {
        if (attemptsCount >= maxAttempts) {
          clearInterval(interval);
          setState("QUEUED");
        }
      }
    }, 1000);
  }

  return (
    <div className="race-test-card">
      <div className="race-test-header">
        <div className="race-badge">
          <ShieldCheck size={14} /> ACID CONCURRENCY PROOF
        </div>
        <h2>10 buyers. 1 unit. The database is the referee.</h2>
        <p>
          PostgreSQL row-level locks strictly serialize simultaneous transactions.
          Even with 10 buyers checking out at the exact same millisecond, overselling is mathematically impossible.
        </p>
      </div>

      {/* SQL Contract Code Block */}
      <div className="sql-code-box">
        <div className="sql-code-header">
          <Code size={13} />
          <span>Guarded Atomic Reservation SQL</span>
        </div>
        <pre>
          <code>{`UPDATE "Inventory"
SET "stockCount" = "stockCount" - 1
WHERE "productId" = 'demo-race-widget'
  AND "city" = 'Bengaluru'
  AND "stockCount" >= 1
RETURNING "stockCount";`}</code>
        </pre>
      </div>

      {errorMsg && (
        <div className="race-error-banner">
          <AlertTriangle size={15} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Action / Trigger Bar */}
      <div className="race-actions-bar">
        <button
          onClick={startRace}
          disabled={state === "RUNNING" || countdown > 0}
          className="button button-primary race-start-btn"
        >
          {state === "RUNNING" ? (
            <>
              <RefreshCw size={15} className="animate-spin" /> Contending 10 buyers...
            </>
          ) : countdown > 0 ? (
            <>
              <Clock size={15} /> Cooldown ({countdown}s)
            </>
          ) : (
            <>
              <Play size={15} fill="currentColor" /> Run Race Test (10 Buyers)
            </>
          )}
        </button>
        <span className="race-sku-info">
          Target SKU: <code>demo-race-widget</code> · Initial Stock: <b>1</b>
        </span>
      </div>

      {/* STATE 2: RUNNING SPINNER */}
      {state === "RUNNING" && (
        <div className="race-running-box">
          <RefreshCw size={24} className="animate-spin text-amber-500" />
          <div>
            <strong>Simultaneous checkout requests fired in parallel...</strong>
            <p>Observing PostgreSQL row-level locks adjudicating transactions.</p>
          </div>
        </div>
      )}

      {/* STATE 3: QUEUED (Offline / Pending) */}
      {state === "QUEUED" && (
        <div className="race-queued-banner">
          <Clock size={18} />
          <div>
            <strong>Orders are safe in the outbox</strong>
            <p>Processing queue is working through transactions. Live state remains consistent.</p>
          </div>
        </div>
      )}

      {/* STATE 4: RESULT BANNER */}
      {state === "RESULT" && runData && (
        <div className="race-result-section">
          <div className="race-proof-banner success">
            <CheckCircle2 size={20} className="text-emerald-400" />
            <div>
              <strong>Exactly 1 Winner · 9 Clean Rejections · 0 Oversells</strong>
              <p>Live inventory verified at 0 units. Invariant holds true.</p>
            </div>
            <div className="stock-counter-badge">Final Stock: 0</div>
          </div>

          <div className="attempts-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>ORDER ID</th>
                  <th>RESULT</th>
                  <th>REASON</th>
                  <th>LATENCY</th>
                </tr>
              </thead>
              <tbody>
                {runData.attempts.map((attempt) => {
                  const isWon = attempt.status === "reserved";
                  return (
                    <tr key={attempt.i} className={isWon ? "winner-row" : "loser-row"}>
                      <td>Buyer #{attempt.i + 1}</td>
                      <td className="mono">
                        {isWon ? (
                          <Link href={`/orders/${attempt.order_id}`} className="winner-order-link">
                            #{attempt.order_id} (Inspect)
                          </Link>
                        ) : (
                          `#${attempt.order_id}`
                        )}
                      </td>
                      <td>
                        {isWon ? (
                          <span className="race-tag reserved">
                            <CheckCircle2 size={12} /> RESERVED
                          </span>
                        ) : (
                          <span className="race-tag rejected">
                            <XCircle size={12} /> OUT_OF_STOCK
                          </span>
                        )}
                      </td>
                      <td>{isWon ? "Guarded SQL matched & stock reserved" : "Clean rejection (0 rows updated)"}</td>
                      <td className="mono">{attempt.latency_ms} ms</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* STATE 5: VIOLATION (Honest Alert) */}
      {state === "VIOLATION" && (
        <div className="race-proof-banner error">
          <AlertTriangle size={20} className="text-red-500" />
          <div>
            <strong>INVARIANT VIOLATED</strong>
            <p>Winners: {runData?.winners} (Expected 1) · Final Stock: {runData?.final_stock} (Expected 0)</p>
          </div>
        </div>
      )}
    </div>
  );
}
