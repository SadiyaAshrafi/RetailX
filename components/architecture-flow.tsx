"use client";

import { useState } from "react";
import { Cpu, Database, Waves, Search, Zap, CheckCircle2, ArrowRight, Play, RefreshCw } from "lucide-react";
import { api } from "@/lib/api";

type NodeKey = "client" | "postgres" | "kafka" | "opensearch";

const ARCH_NODES = [
  {
    key: "client" as NodeKey,
    title: "Next.js 15 App Router",
    vendor: "Vercel Serverless / Edge",
    role: "User actions, UI state & API route handlers",
    metric: "<20ms Edge dispatch",
    icon: Cpu,
    color: "#3b82f6",
    badge: "Edge",
  },
  {
    key: "postgres" as NodeKey,
    title: "Aiven PostgreSQL",
    vendor: "pg-10219e0d",
    role: "ACID transactional consistency & Outbox table",
    metric: "Row-level lock safety",
    icon: Database,
    color: "#10b981",
    badge: "ACID",
  },
  {
    key: "kafka" as NodeKey,
    title: "Aiven Apache Kafka",
    vendor: "kafka-1cbf9a15",
    role: "Pub/Sub message broker on 3 event topics",
    metric: "order-created / inventory",
    icon: Waves,
    color: "#f59e0b",
    badge: "Event Bus",
  },
  {
    key: "opensearch" as NodeKey,
    title: "Aiven OpenSearch",
    vendor: "os-3a531f7c",
    role: "Fuzzy vector & multi-field search engine",
    metric: "12ms search latency",
    icon: Search,
    color: "#8b5cf6",
    badge: "Search Index",
  },
];

export function ArchitectureFlow() {
  const [activeStep, setActiveStep] = useState<number>(-1);
  const [simulating, setSimulating] = useState(false);
  const [lastEvent, setLastEvent] = useState<string | null>(null);

  async function triggerLivePulse() {
    if (simulating) return;
    setSimulating(true);

    // Step-by-step packet animation across nodes
    for (let step = 0; step < 4; step++) {
      setActiveStep(step);
      await new Promise((r) => setTimeout(r, 650));
    }

    try {
      // Trigger actual event simulation on the backend
      const res = await api<{ event: { eventType: string; id: string } }>("/admin/simulate-event", {
        method: "POST",
        body: JSON.stringify({ type: "ORDER_CREATED" }),
      });
      setLastEvent(`${res.event?.eventType || "ORDER_CREATED"} #${res.event?.id?.slice(0, 8)}`);
    } catch {
      setLastEvent("Simulated Packet Confirmed");
    } finally {
      setTimeout(() => {
        setActiveStep(-1);
        setSimulating(false);
      }, 1200);
    }
  }

  return (
    <div className="architecture-flow-wrapper">
      <div className="arch-flow-top">
        <div>
          <span className="filter-label">LIVE DISTRIBUTED ARCHITECTURE</span>
          <h3>Event-Driven Commerce Topology</h3>
        </div>
        <button
          onClick={triggerLivePulse}
          disabled={simulating}
          className="button button-primary button-sm arch-trigger-btn"
          title="Emit a live event packet through the pipeline"
        >
          {simulating ? (
            <>
              <RefreshCw size={14} className="animate-spin" /> Emitting Packet...
            </>
          ) : (
            <>
              <Play size={13} fill="currentColor" /> Emit Live Event Packet
            </>
          )}
        </button>
      </div>

      {lastEvent && (
        <div className="arch-live-banner">
          <Zap size={13} className="text-amber-400" />
          <span>Last Emitted Packet: <b>{lastEvent}</b></span>
          <span className="arch-badge-live">LIVE PROCESSED</span>
        </div>
      )}

      {/* Nodes and Flow Connectors */}
      <div className="arch-nodes-container">
        {ARCH_NODES.map((node, index) => {
          const Icon = node.icon;
          const isActive = activeStep === index;
          const isPassed = activeStep > index;

          return (
            <div key={node.key} className="arch-node-wrapper">
              <div className={`arch-node-box ${isActive ? "active-glow" : ""} ${isPassed ? "passed" : ""}`}>
                <div className="arch-node-badge" style={{ borderColor: node.color, color: node.color }}>
                  {node.badge}
                </div>
                <div className="arch-node-icon" style={{ backgroundColor: `${node.color}15`, color: node.color }}>
                  <Icon size={20} />
                </div>
                <strong>{node.title}</strong>
                <span className="arch-node-vendor">{node.vendor}</span>
                <p>{node.role}</p>
                <div className="arch-node-metric">
                  <CheckCircle2 size={12} className="text-emerald-500 inline mr-1" />
                  {node.metric}
                </div>
              </div>

              {index < ARCH_NODES.length - 1 && (
                <div className={`arch-connector-line ${activeStep === index ? "pulsing" : ""}`}>
                  <span className="connector-dot" />
                  <ArrowRight size={14} className="connector-arrow" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
