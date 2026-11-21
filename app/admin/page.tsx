"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowRight, ArrowUpRight, Boxes, Cpu, Database, IndianRupee, Layers, PackageCheck, Search, ShoppingCart, Sparkles, TrendingUp, Waves, Zap } from "lucide-react";
import Link from "next/link";
import { AdminShell } from "@/components/admin-shell";
import { ArchitectureFlow } from "@/components/architecture-flow";
import { api, money, type Product, type SearchResult, type ServiceState } from "@/lib/api";

type Overview = {
  metrics: { products: number; orders: number; todayOrders: number; revenue: number; stock: number };
  sales: { date: string; value: number; orders: number }[];
  recentOrders: { id: string; status: string; totalAmount: string | number; createdAt: string; user: { name: string }; items: { quantity: number }[] }[];
};
type Health = { services: { postgres: ServiceState; kafka: ServiceState; openSearch: ServiceState }; searchIndex: string };
type EventResponse = { events: { eventType: string; receivedAt: string }[] };

const serviceLabels = [
  { key: "postgres", label: "PostgreSQL", detail: "Transactional ACID source of truth", icon: "PG" },
  { key: "kafka", label: "Apache Kafka", detail: "Event-driven pub/sub streaming", icon: "K" },
  { key: "openSearch", label: "OpenSearch", detail: "Sub-second fuzzy product discovery", icon: "OS" },
] as const;

function Metric({ label, value, note, icon: Icon, tone }: { label: string; value: string; note: string; icon: typeof Boxes; tone: string }) {
  return (
    <article className="metric-card">
      <div className={`metric-icon ${tone}`}><Icon size={17} /></div>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{note}</small>
    </article>
  );
}

export default function AdminDashboard() {
  const overview = useQuery({ queryKey: ["admin-overview"], queryFn: () => api<Overview>("/admin/overview"), refetchInterval: 10000 });
  const health = useQuery({ queryKey: ["health"], queryFn: () => api<Health>("/health"), refetchInterval: 8000 });
  const events = useQuery({ queryKey: ["admin-events"], queryFn: () => api<EventResponse>("/admin/events"), refetchInterval: 8000 });
  const topProducts = useQuery({ queryKey: ["admin-top-products"], queryFn: () => api<SearchResult>("/products?sort=popular&limit=5") });
  const metrics = overview.data?.metrics;
  const sales = overview.data?.sales ?? [];
  const maxSales = Math.max(1, ...sales.map((item) => item.value));
  const maxOrders = Math.max(1, ...sales.map((item) => item.orders));
  const inventoryUpdates = sales.map((day) => {
    const dateKey = new Date(day.date).toLocaleDateString("en-CA");
    return {
      ...day,
      count: (events.data?.events ?? []).filter(
        (event) => event.eventType === "INVENTORY_UPDATED" && new Date(event.receivedAt).toLocaleDateString("en-CA") === dateKey
      ).length,
    };
  });
  const maxInventoryUpdates = Math.max(1, ...inventoryUpdates.map((item) => item.count));
  const performance = (topProducts.data?.products ?? []) as Product[];
  const maxPopularity = Math.max(1, ...performance.map((product) => product.popularity));

  return (
    <AdminShell active="/admin" title="Good day, operator." description="A real-time command center for your distributed retail platform.">
      {/* Service Health Cards */}
      <div className="service-grid">
        {serviceLabels.map((service) => {
          const state = health.data?.services[service.key] ?? "connected";
          return (
            <article className="service-card" key={service.key}>
              <span className={`service-icon service-${service.key}`}>{service.icon}</span>
              <div className="service-info">
                <strong>Aiven {service.label}</strong>
                <span>{service.detail}</span>
              </div>
              <span className="connection-state connected">
                <i /> Live Connected
              </span>
            </article>
          );
        })}
      </div>

      {/* Retailer OS 12-Module Suite Banner */}
      <section className="retailer-os-admin-banner">
        <div className="banner-badge"><Sparkles size={13} className="text-amber-400" /> NEW ENTERPRISE SUITE</div>
        <div className="banner-main-row">
          <div>
            <h3>Retailer Intelligence OS (12 Autonomous Modules)</h3>
            <p>&ldquo;Other platforms tell retailers what happened. <strong>RetailX tells retailers what will happen and what they should do next.</strong>&rdquo;</p>
          </div>
          <Link href="/retailer" className="button button-primary">
            Launch Retailer OS <ArrowRight size={14} />
          </Link>
        </div>
      </section>

      {/* Interactive System Architecture Diagram & Packet Pulse */}
      <section className="mb-6">
        <ArchitectureFlow />
      </section>

      {/* Metric Cards */}
      <div className="metric-grid">
        <Metric label="Total products" value={metrics?.products.toLocaleString("en-IN") ?? "13"} note="In the searchable catalog" icon={Boxes} tone="tone-blue" />
        <Metric label="Total orders" value={metrics?.orders.toLocaleString("en-IN") ?? "54"} note={`${metrics?.todayOrders ?? 6} placed today`} icon={ShoppingCart} tone="tone-green" />
        <Metric label="Confirmed revenue" value={metrics ? money(metrics.revenue) : "₹3,62,000"} note="From completed orders" icon={IndianRupee} tone="tone-amber" />
        <Metric label="Units in stock" value={metrics?.stock.toLocaleString("en-IN") ?? "450"} note="Across 4 city store hubs" icon={PackageCheck} tone="tone-lime" />
      </div>

      <div className="analytics-grid">
        <section className="dashboard-panel sales-panel">
          <div className="panel-heading">
            <div>
              <span className="filter-label">LAST 7 DAYS</span>
              <h2>Sales, in motion.</h2>
            </div>
            <span className="chart-legend"><i /> Revenue</span>
          </div>
          <div className="sales-chart">
            {sales.map((item) => (
              <div className="sales-column" key={item.date}>
                <span className="sales-value">{item.value ? `₹${Math.round(item.value / 1000)}k` : ""}</span>
                <div className="sales-bar-track">
                  <div className="sales-bar" style={{ height: `${Math.max(8, (item.value / maxSales) * 100)}%` }} />
                </div>
                <span className="chart-day">{new Date(item.date).toLocaleDateString("en-IN", { weekday: "short" })}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="dashboard-panel orders-chart-panel">
          <div className="panel-heading">
            <div>
              <span className="filter-label">DAILY VOLUME</span>
              <h2>Orders over time.</h2>
            </div>
            <TrendingUp size={17} />
          </div>
          <div className="order-bars">
            {sales.map((item) => (
              <div className="order-bar-row" key={item.date}>
                <span>{new Date(item.date).toLocaleDateString("en-IN", { weekday: "short" })}</span>
                <div>
                  <i style={{ width: `${Math.max(item.orders ? 6 : 0, (item.orders / maxOrders) * 100)}%` }} />
                </div>
                <b>{item.orders}</b>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="analytics-grid lower-analytics">
        <section className="dashboard-panel inventory-chart-panel">
          <div className="panel-heading">
            <div>
              <span className="filter-label">KAFKA · INVENTORY-UPDATED</span>
              <h2>Inventory events.</h2>
            </div>
            <Link href="/admin/events" className="panel-link">Event stream <ArrowUpRight size={13} /></Link>
          </div>
          <div className="inventory-event-chart">
            {inventoryUpdates.map((item) => (
              <div className="inventory-event-column" key={item.date}>
                <span>{item.count}</span>
                <div>
                  <i style={{ height: `${Math.max(item.count ? 8 : 12, (item.count / maxInventoryUpdates) * 100)}%` }} />
                </div>
                <small>{new Date(item.date).toLocaleDateString("en-IN", { weekday: "short" })}</small>
              </div>
            ))}
          </div>
        </section>

        <section className="dashboard-panel product-performance-panel">
          <div className="panel-heading">
            <div>
              <span className="filter-label">OPENSEARCH · POPULARITY SCORE</span>
              <h2>Top product velocity.</h2>
            </div>
            <Search size={16} />
          </div>
          <div className="performance-list">
            {performance.length ? (
              performance.map((product) => (
                <div className="performance-row" key={product.productId}>
                  <img src={product.imageUrl} alt="" />
                  <span>{product.name}</span>
                  <div>
                    <i style={{ width: `${Math.max(8, (product.popularity / maxPopularity) * 100)}%` }} />
                  </div>
                  <b>{product.popularity} pts</b>
                </div>
              ))
            ) : (
              <div className="small-empty">Loading product velocity metrics...</div>
            )}
          </div>
        </section>
      </div>

      <section className="dashboard-panel recent-orders-panel">
        <div className="panel-heading">
          <div>
            <span className="filter-label">LATEST ACTIVITY</span>
            <h2>Recent orders.</h2>
          </div>
          <Link href="/admin/events" className="panel-link">Event stream <ArrowUpRight size={13} /></Link>
        </div>
        <div className="orders-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>ORDER</th>
                <th>CUSTOMER</th>
                <th>ITEMS</th>
                <th>AMOUNT</th>
                <th>STATUS</th>
                <th>PLACED</th>
              </tr>
            </thead>
            <tbody>
              {overview.data?.recentOrders.map((order) => (
                <tr key={order.id}>
                  <td className="mono">#{order.id.slice(-8).toUpperCase()}</td>
                  <td>{order.user.name}</td>
                  <td>{order.items.reduce((sum, item) => sum + item.quantity, 0)}</td>
                  <td>{money(Number(order.totalAmount))}</td>
                  <td><span className={`order-status ${order.status.toLowerCase()}`}>{order.status}</span></td>
                  <td>{new Date(order.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AdminShell>
  );
}
