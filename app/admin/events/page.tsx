"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowDownToLine, Radio, RefreshCw, Waves } from "lucide-react";
import { AdminShell } from "@/components/admin-shell";
import { api } from "@/lib/api";

type EventItem = { id: string; eventType: string; entityId: string; topic: string; status: string; occurredAt: string; receivedAt: string; payload: Record<string, unknown> };
type EventResponse = { events: EventItem[]; connected: boolean };

const eventColors: Record<string, string> = {
  ORDER_CREATED: "event-blue",
  INVENTORY_UPDATED: "event-green",
  SEARCH_SYNCED: "event-amber",
};

export default function EventMonitorPage() {
  const result = useQuery({ queryKey: ["admin-events"], queryFn: () => api<EventResponse>("/admin/events"), refetchInterval: 1800 });
  const events = result.data?.events ?? [];

  return <AdminShell active="/admin/events" title="Events, as they happen." description="Follow each order from the first commit to a freshly synced search result.">
    <div className="event-status-strip"><span className={`event-stream-state${result.data?.connected ? " live" : ""}`}><i /> {result.data?.connected ? "CONSUMER RUNNING" : "CONSUMER OFFLINE"}</span><span className="event-topic-list">TOPICS <b>order-created</b><b>inventory-updated</b><b>search-sync</b><b>admin-events</b></span><span className="event-auto-refresh"><RefreshCw size={12} className={result.data?.connected ? "refresh-spin" : ""} /> Auto-refresh · 2s</span></div>
    <section className="dashboard-panel event-panel"><div className="panel-heading"><div><span className="filter-label">AIVEN KAFKA · ADMIN-EVENTS</span><h2>Recent event stream.</h2></div><span className="event-count">{events.length} EVENTS</span></div>{events.length ? <div className="event-list">{events.map((event) => <article className="event-row" key={event.id}><span className={`event-type-mark ${eventColors[event.eventType] ?? "event-neutral"}`}><Waves size={15} /></span><div className="event-row-main"><div className="event-row-title"><strong>{event.eventType}</strong><span className="event-topic-tag">{event.topic}</span></div><div className="event-row-meta"><span>Entity <b>{event.entityId.slice(-12)}</b></span><span>Event ID <b>{event.id.slice(-10)}</b></span></div><details className="event-payload"><summary><ArrowDownToLine size={12} /> Payload</summary><pre>{JSON.stringify(event.payload, null, 2)}</pre></details></div><time>{new Date(event.receivedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</time><span className="event-processed"><i /> Processed</span></article>)}</div> : <div className="events-empty"><span><Radio size={20} /></span><strong>{result.isError ? "Event monitor can’t reach the API." : result.data?.connected ? "Listening for the first event." : "Waiting for Aiven Kafka."}</strong><p>Order, inventory, and search synchronization events will appear here as they flow through the platform.</p><span className="events-empty-topics"><b>ORDER_CREATED</b><b>INVENTORY_UPDATED</b><b>SEARCH_SYNCED</b></span></div>}</section>
  </AdminShell>;
}