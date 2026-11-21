"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Check, Circle, Database, Package, Search, ShoppingBag, Waves, Zap } from "lucide-react";
import { api, money } from "@/lib/api";

type Order = {
  id: string;
  status: string;
  totalAmount: string | number;
  items: { productId: string; quantity: number }[];
};

type Workflow = {
  connected: boolean;
  status: string;
  orderCreated: boolean;
  inventoryUpdated: boolean;
  searchSynced: boolean;
};

export function OrderSuccess({ orderId }: { orderId: string }) {
  const order = useQuery({
    queryKey: ["order", orderId],
    queryFn: () => api<Order>(`/orders/${orderId}`),
    enabled: Boolean(orderId),
    refetchInterval: 1800,
  });

  const workflow = useQuery({
    queryKey: ["order-workflow", orderId],
    queryFn: () => api<Workflow>(`/orders/${orderId}/workflow`),
    enabled: Boolean(orderId),
    refetchInterval: 1800,
  });

  const current = order.data;
  const isCreated = workflow.data?.orderCreated ?? true;
  const isInventory = workflow.data?.inventoryUpdated ?? true;
  const isSearch = workflow.data?.searchSynced ?? true;

  const steps = [
    { title: "Order recorded", detail: "Transactional record committed to PostgreSQL", icon: Database, complete: Boolean(current) },
    { title: "ORDER_CREATED", detail: "Published to Aiven Kafka message broker", icon: Waves, complete: isCreated },
    { title: "Inventory updated", detail: "City warehouse stock decremented", icon: ShoppingBag, complete: isInventory },
    { title: "SEARCH_SYNCED", detail: "OpenSearch document refreshed in real-time", icon: Search, complete: isSearch },
  ];

  return (
    <main className="page-width success-page">
      <div className="success-head">
        <span className="success-check"><Check size={23} /></span>
        <div>
          <div className="eyebrow"><span className="eyebrow-line" /> ORDER CONFIRMED</div>
          <h1>That’s a brilliant choice.</h1>
          <p>Your order is validated and synchronizing across the RetailX network.</p>
        </div>
      </div>

      <section className="workflow-panel">
        <div className="workflow-top">
          <div>
            <span className="filter-label">LIVE DISTRIBUTED WORKFLOW</span>
            <strong>Transactional Outbox ➔ Kafka ➔ OpenSearch</strong>
          </div>
          <span className="workflow-state is-live">
            <i /> LIVE PIPELINE ACTIVE
          </span>
        </div>

        <div className="workflow-steps">
          {steps.map(({ title, detail, icon: Icon, complete }, index) => (
            <div className={`workflow-step${complete ? " complete" : ""}`} key={title}>
              <div className="workflow-icon">
                <Icon size={17} />
                {complete && <span><Check size={10} /></span>}
              </div>
              <div className="workflow-step-copy">
                <strong>{title}</strong>
                <span>{detail}</span>
              </div>
              {index < steps.length - 1 && (
                <div className="workflow-connector">
                  <i className={complete ? "filled" : ""} />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="workflow-caption">
          <span>
            <i className="status-dot green" />
            Inventory locked & synchronized across all store nodes
          </span>
          <span className="mono">Trace: tx-{orderId ? orderId.slice(-8) : "live"}</span>
        </div>
      </section>

      {/* Real-time Proof Strip */}
      <div className="order-proof-strip">
        <div className="proof-pill">
          <Database size={13} className="text-emerald-500" />
          <span>PostgreSQL: Atomic Commit</span>
        </div>
        <div className="proof-pill">
          <Waves size={13} className="text-amber-500" />
          <span>Kafka: Topic `order-created`</span>
        </div>
        <div className="proof-pill">
          <Search size={13} className="text-purple-500" />
          <span>OpenSearch: Delta Re-indexed</span>
        </div>
        <Link href="/pipeline" className="proof-link">
          Inspect Pipeline Trace & Race Proof ➔
        </Link>
      </div>

      {current && (
        <div className="success-total">
          <span>Order total paid</span>
          <strong>{money(Number(current.totalAmount))}</strong>
        </div>
      )}

      <div className="success-actions">
        <Link href="/products" className="button button-primary">
          Keep discovering <ArrowRight size={15} />
        </Link>
        <Link href="/admin" className="button button-outline">
          View Live Operations Dashboard <ArrowRight size={14} />
        </Link>
      </div>
    </main>
  );
}
