"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Check, Circle, Database, Search, ShoppingBag, Waves } from "lucide-react";
import { api, money } from "@/lib/api";

type Order = { id: string; status: string; totalAmount: string | number; items: { productId: string; quantity: number }[] };
type Workflow = { connected: boolean; status: string; orderCreated: boolean; inventoryUpdated: boolean; searchSynced: boolean };

export function OrderSuccess({ orderId }: { orderId: string }) {
  const order = useQuery({ queryKey: ["order", orderId], queryFn: () => api<Order>(`/orders/${orderId}`), enabled: Boolean(orderId), refetchInterval: 1800 });
  const workflow = useQuery({ queryKey: ["order-workflow", orderId], queryFn: () => api<Workflow>(`/orders/${orderId}/workflow`), enabled: Boolean(orderId), refetchInterval: 1800 });
  const current = order.data;
  const isCreated = workflow.data?.orderCreated ?? false;
  const isInventory = workflow.data?.inventoryUpdated ?? false;
  const isSearch = workflow.data?.searchSynced ?? false;
  const steps = [
    { title: "Order recorded", detail: "Transactional record saved", icon: Database, complete: Boolean(current) },
    { title: "ORDER_CREATED", detail: "Published to Aiven Kafka", icon: Waves, complete: isCreated },
    { title: "Inventory updated", detail: "Stock adjusted in PostgreSQL", icon: ShoppingBag, complete: isInventory },
    { title: "SEARCH_SYNCED", detail: "Product index refreshed", icon: Search, complete: isSearch },
  ];

  return (
    <main className="page-width success-page">
      <div className="success-head"><span className="success-check"><Check size={23} /></span><div><div className="eyebrow"><span className="eyebrow-line" /> ORDER {current?.status === "CONFIRMED" ? "CONFIRMED" : "RECEIVED"}</div><h1>That’s a good choice.</h1><p>Your order is making its way through the RetailX network.</p></div></div>
      <section className="workflow-panel"><div className="workflow-top"><div><span className="filter-label">LIVE ORDER WORKFLOW</span><strong>From checkout to searchable stock</strong></div><span className={`workflow-state${workflow.data?.connected ? " is-live" : ""}`}><i /> {workflow.data?.connected ? "LIVE" : "WAITING FOR KAFKA"}</span></div><div className="workflow-steps">{steps.map(({ title, detail, icon: Icon, complete }, index) => <div className={`workflow-step${complete ? " complete" : ""}`} key={title}><div className="workflow-icon"><Icon size={17} />{complete && <span><Check size={10} /></span>}</div><div className="workflow-step-copy"><strong>{title}</strong><span>{detail}</span></div>{index < steps.length - 1 && <div className="workflow-connector"><i className={complete ? "filled" : ""} /></div>}</div>)}</div><div className="workflow-caption"><span><i className={current?.status === "CONFIRMED" ? "status-dot green" : "status-dot amber"} /> {current?.status === "CONFIRMED" ? "Inventory is confirmed" : current?.status === "CANCELLED" ? "Order cancelled: stock changed before confirmation" : "Waiting for the event pipeline to finish"}</span><span>{current ? `Order ${current.id.slice(-8).toUpperCase()}` : "Loading order…"}</span></div></section>
      {current && <div className="success-total"><span>Order total</span><strong>{money(Number(current.totalAmount))}</strong></div>}
      {!workflow.data?.connected && <div className="service-warning"><Circle size={14} /> Kafka is not connected yet. Configure Aiven service credentials to watch the live event flow.</div>}
      <div className="success-actions"><Link href="/products" className="button button-primary">Keep discovering <ArrowRight size={15} /></Link><Link href="/admin" className="text-link">View operations dashboard <ArrowRight size={14} /></Link></div>
    </main>
  );
}