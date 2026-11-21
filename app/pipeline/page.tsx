"use client";

import { ArchitectureFlow } from "@/components/architecture-flow";
import { RaceTestView } from "@/components/race-test-view";
import { Layers, ShieldCheck, Waves } from "lucide-react";

export default function PipelinePage() {
  return (
    <main className="page-width pipeline-page">
      <div className="pipeline-hero">
        <div className="eyebrow">
          <span className="eyebrow-line" /> DISTRIBUTED SYSTEMS DEMO
        </div>
        <h1>Event Pipeline & Concurrency Referee</h1>
        <p>
          Real-time observability into Aiven PostgreSQL transactional locks, Apache Kafka pub/sub messaging, and OpenSearch live index synchronization.
        </p>
      </div>

      {/* Feature 1: Architecture Flow Map */}
      <section className="pipeline-section">
        <div className="section-title-wrap">
          <Layers size={18} className="text-amber-500" />
          <h2>Topology & Live Packet Stream</h2>
        </div>
        <ArchitectureFlow />
      </section>

      {/* Feature 4: Race Test — Last Item Fairness Proof */}
      <section className="pipeline-section">
        <div className="section-title-wrap">
          <ShieldCheck size={18} className="text-emerald-500" />
          <h2>Race Test: Last Item Fairness Proof</h2>
        </div>
        <RaceTestView />
      </section>
    </main>
  );
}
