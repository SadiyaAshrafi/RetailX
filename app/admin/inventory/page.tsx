"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, PackageCheck, Save } from "lucide-react";
import { useState } from "react";
import { AdminShell } from "@/components/admin-shell";
import { api } from "@/lib/api";

type InventoryRow = { id: string; city: string; stockCount: number; updatedAt: string; product: { id: string; name: string; category: string; imageUrl: string } };

export default function InventoryPage() {
  const queryClient = useQueryClient();
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState("");
  const [notice, setNotice] = useState("");
  const inventory = useQuery({ queryKey: ["admin-inventory"], queryFn: () => api<InventoryRow[]>("/admin/inventory"), refetchInterval: 10000 });
  const rows = inventory.data ?? [];
  const stockCount = rows.reduce((sum, item) => sum + item.stockCount, 0);

  async function save(row: InventoryRow) {
    const stockCount = Number(drafts[row.id]);
    if (!Number.isInteger(stockCount) || stockCount < 0) return setNotice("Enter a whole number above zero.");
    setSaving(row.id);
    setNotice("");
    try {
      await api(`/admin/inventory/${row.id}`, { method: "PATCH", body: JSON.stringify({ stockCount }) });
      await queryClient.invalidateQueries({ queryKey: ["admin-inventory"] });
      setDrafts((current) => { const next = { ...current }; delete next[row.id]; return next; });
      setNotice(`Stock updated for ${row.product.name}. Kafka sync is queued.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to update inventory.");
    } finally {
      setSaving("");
    }
  }

  return <AdminShell active="/admin/inventory" title="Stock, without surprises." description="Manage availability by store. Every edit publishes an inventory event and refreshes search.">
    <div className="inventory-summary"><div className="inventory-summary-icon"><PackageCheck size={18} /></div><div><span>UNITS ACROSS THE NETWORK</span><strong>{stockCount.toLocaleString("en-IN")}</strong></div><div className="inventory-summary-right"><i /> Inventory writes to Aiven PostgreSQL</div></div>
    {notice && <div className={`inventory-notice${notice.startsWith("Stock") ? " notice-success" : " notice-error"}`}>{notice.startsWith("Stock") && <Check size={14} />}{notice}</div>}
    <section className="dashboard-panel inventory-table-panel"><div className="panel-heading"><div><span className="filter-label">CITY-LEVEL AVAILABILITY</span><h2>Store inventory.</h2></div><span className="event-count">{rows.length} LOCATIONS</span></div><div className="orders-table-wrap"><table className="data-table inventory-table"><thead><tr><th>PRODUCT</th><th>CATEGORY</th><th>STORE</th><th>AVAILABLE</th><th>LAST UPDATED</th><th></th></tr></thead><tbody>{rows.map((row) => <tr key={row.id}><td><div className="inventory-product"><img src={row.product.imageUrl} alt="" /><strong>{row.product.name}</strong></div></td><td>{row.product.category}</td><td>{row.city}</td><td><label className="stock-edit"><input aria-label={`Stock count for ${row.product.name} in ${row.city}`} type="number" min="0" max="100000" value={drafts[row.id] ?? row.stockCount} onChange={(event) => setDrafts({ ...drafts, [row.id]: event.target.value })} /><span className={row.stockCount < 6 ? "stock-low-label" : "stock-ok-label"}>{row.stockCount < 6 ? "Low" : "In stock"}</span></label></td><td>{new Date(row.updatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</td><td><button className="save-stock" onClick={() => void save(row)} disabled={saving === row.id || drafts[row.id] === undefined || Number(drafts[row.id]) === row.stockCount} aria-label={`Save stock for ${row.product.name} in ${row.city}`} title="Save stock"><Save size={14} />{saving === row.id ? "Saving" : "Save"}</button></td></tr>)}</tbody></table>{!rows.length && <div className="small-empty">No inventory found. Connect Aiven PostgreSQL and seed the catalog to get started.</div>}</div></section>
  </AdminShell>;
}