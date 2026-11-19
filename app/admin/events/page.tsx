"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDownToLine, Play, Radio, RefreshCw, Sparkles, Waves, Zap } from "lucide-react";
import { useState } from "react";
import { AdminShell } from "@/components/admin-shell";
import { api } from "@/lib/api";

type EventItem = {
  id: string;
  eventType: string;
  entityId: string;
  topic: string;
  status: string;
  occurredAt: string;
  receivedAt: string;
  payload: Record<string, unknown>;
};
type EventResponse = { events: EventItem[]; connected: boolean };

const eventColors: Record<string, string> = {
  ORDER_CREATED: "event-blue",
  INVENTORY_UPDATED: "event-green",
  SEARCH_SYNCED: "event-amber",
};

export default function EventMonitorPage() {
  const queryClient = useQueryClient();
  const [simulating, setSimulating] = useState(false);
  const result = useQuery({
    queryKey: ["admin-events"],
    queryFn: () => api<EventResponse>("/admin/events"),
    refetchInterval: 1800,
  });
  const events = result.data?.events ?? [];

  async function triggerEvent(type: "ORDER_CREATED" | "INVENTORY_UPDATED" | "SEARCH_SYNCED") {
    setSimulating(true);
    try {
      await api("/admin/simulate-event", {
        method: "POST",
        body: JSON.stringify({ type }),
      });
      await queryClient.invalidateQueries({ queryKey: ["admin-events"] });
    } catch {
      alert("Could not simulate event");
    } finally {
      setSimulating(false);
    }
  }

  return (
    <AdminShell
      active="/admin/events"
      title="Events, as they happen."
      description="Follow each order from the first commit to a freshly synced search result."
    >
      {/* Event Simulation Toolbar for Judges / Demos */}
      <div className="event-demo-toolbar">
        <div className="toolbar-info">
          <Zap size={16} className="text-amber-500" />
          <span><b>Live Demo Controls:</b> Trigger synthetic events across Kafka topics to demonstrate pipeline latency.</span>
        </div>
        <div className="toolbar-buttons">
          <button
            onClick={() => triggerEvent("ORDER_CREATED")}
            disabled={simulating}
            className="sim-btn sim-order"
          >
            <Play size={12} /> Emit ORDER_CREATED
          </button>
          <button
            onClick={() => triggerEvent("INVENTORY_UPDATED")}
            disabled={simulating}
            className="sim-btn sim-stock"
          >
            <Play size={12} /> Emit INVENTORY_UPDATED
          </button>
          <button
            onClick={() => triggerEvent("SEARCH_SYNCED")}
            disabled={simulating}
            className="sim-btn sim-search"
          >
            <Play size={12} /> Emit SEARCH_SYNCED
          </button>
        </div>
      </div>

      <div className="event-status-strip">
        <span className={`event-stream-state${result.data?.connected ? " live" : ""}`}>
          <i /> {result.data?.connected ? "KAFKA CONSUMER RUNNING" : "CONSUMER OFFLINE"}
        </span>
        <span className="event-topic-list">
          TOPICS <b>order-created</b><b>inventory-updated</b><b>search-sync</b><b>admin-events</b>
        </span>
        <span className="event-auto-refresh">
          <RefreshCw size={12} className={result.data?.connected ? "refresh-spin" : ""} /> Auto-refresh · 1.8s
        </span>
      </div>

      <section className="dashboard-panel event-panel">
        <div className="panel-heading">
          <div>
            <span className="filter-label">APACHE KAFKA · DISTRIBUTED LOG</span>
            <h2>Recent event stream.</h2>
          </div>
          <span className="event-count">{events.length} EVENTS RECORDED</span>
        </div>

        {events.length ? (
          <div className="event-list">
            {events.map((event) => (
              <article className="event-row" key={event.id}>
                <span className={`event-type-mark ${eventColors[event.eventType] ?? "event-neutral"}`}>
                  <Waves size={15} />
                </span>
                <div className="event-row-main">
                  <div className="event-row-title">
                    <strong>{event.eventType}</strong>
                    <span className="event-topic-tag">{event.topic}</span>
                  </div>
                  <div className="event-row-meta">
                    <span>Entity <b>{event.entityId.slice(-12)}</b></span>
                    <span>Event ID <b>{event.id.slice(-10)}</b></span>
                  </div>
                  <details className="event-payload">
                    <summary><ArrowDownToLine size={12} /> View JSON Payload</summary>
                    <pre>{JSON.stringify(event.payload, null, 2)}</pre>
                  </details>
                </div>
                <time>
                  {new Date(event.receivedAt).toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </time>
                <span className="event-processed"><i /> Processed</span>
              </article>
            ))}
          </div>
        ) : (
          <div className="events-empty">
            <span><Radio size={20} /></span>
            <strong>Listening for the first event.</strong>
            <p>Order, inventory, and search synchronization events will appear here in real-time.</p>
          </div>
        )}
      </section>
    </AdminShell>
  );
}
