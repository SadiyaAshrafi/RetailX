"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUpRight, Check, Plus, Tags, X } from "lucide-react";
import { useState } from "react";
import { AdminShell } from "@/components/admin-shell";
import { api } from "@/lib/api";

type ManagedProduct = { id: string; name: string; description: string; category: string; price: string | number; imageUrl: string; rating: number; inventory: { city: string; stockCount: number }[] };
type ProductFields = { name: string; description: string; category: string; price: string; imageUrl: string; rating: string; city: string; stockCount: string };
const emptyForm: ProductFields = { name: "", description: "", category: "", price: "", imageUrl: "", rating: "4.5", city: "Bengaluru", stockCount: "0" };

export default function CatalogManagementPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<ProductFields>(emptyForm);
  const [editingId, setEditingId] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const products = useQuery({ queryKey: ["managed-products"], queryFn: () => api<ManagedProduct[]>("/admin/products"), refetchInterval: 15000 });

  function beginEdit(product: ManagedProduct) {
    setEditingId(product.id);
    setForm({ name: product.name, description: product.description, category: product.category, price: String(product.price), imageUrl: product.imageUrl, rating: String(product.rating), city: "Bengaluru", stockCount: "0" });
    setFormOpen(true);
    setMessage("");
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId("");
    setFormOpen(false);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const body = {
      name: form.name,
      description: form.description,
      category: form.category,
      price: Number(form.price),
      imageUrl: form.imageUrl,
      rating: Number(form.rating),
      ...(!editingId ? { city: form.city, stockCount: Number(form.stockCount) } : {}),
    };
    try {
      await api(`/admin/products${editingId ? `/${editingId}` : ""}`, { method: editingId ? "PATCH" : "POST", body: JSON.stringify(body) });
      await queryClient.invalidateQueries({ queryKey: ["managed-products"] });
      await queryClient.invalidateQueries({ queryKey: ["admin-overview"] });
      setMessage(editingId ? "Product updated. Search sync is queued." : "Product added. Search sync is queued.");
      resetForm();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save product.");
    } finally {
      setBusy(false);
    }
  }

  return <AdminShell active="/admin/catalog" title="A catalog worth finding." description="Create products and keep the live search index in step with your source data.">
    <div className="catalog-admin-toolbar"><div className="catalog-admin-count"><Tags size={15} /><strong>{products.data?.length ?? 0}</strong> products in PostgreSQL</div><button className="button button-primary" onClick={() => { resetForm(); setFormOpen(true); }}><Plus size={15} /> Add product</button></div>
    {message && <div className={`inventory-notice${message.includes("queued") ? " notice-success" : " notice-error"}`}>{message.includes("queued") && <Check size={14} />}{message}</div>}
    {formOpen && <form className="product-editor" onSubmit={submit}><div className="product-editor-heading"><div><span className="filter-label">{editingId ? "EDIT LISTING" : "NEW LISTING"}</span><strong>{editingId ? "Product details" : "Add to catalog"}</strong></div><button type="button" onClick={resetForm} aria-label="Close product form"><X size={16} /></button></div><div className="editor-grid"><label className="form-field">Product name<input required minLength={2} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label><label className="form-field">Category<input required value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} placeholder="Audio, Home…" /></label><label className="form-field">Price (₹)<input required type="number" min="1" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} /></label><label className="form-field">Rating<input required type="number" min="0" max="5" step="0.1" value={form.rating} onChange={(event) => setForm({ ...form, rating: event.target.value })} /></label><label className="form-field editor-wide">Image URL<input required type="url" value={form.imageUrl} onChange={(event) => setForm({ ...form, imageUrl: event.target.value })} /></label><label className="form-field editor-wide">Description<textarea required minLength={8} rows={2} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>{!editingId && <><label className="form-field">First store city<input required value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} /></label><label className="form-field">Opening stock<input required type="number" min="0" value={form.stockCount} onChange={(event) => setForm({ ...form, stockCount: event.target.value })} /></label></>}</div><div className="product-editor-actions"><button type="button" className="button button-secondary" onClick={resetForm}>Cancel</button><button className="button button-primary" disabled={busy}>{busy ? "Saving…" : <>{editingId ? "Save changes" : "Create product"} <ArrowUpRight size={14} /></>}</button></div></form>}
    <section className="dashboard-panel managed-catalog"><div className="panel-heading"><div><span className="filter-label">SOURCE OF TRUTH · AIVEN POSTGRESQL</span><h2>Product catalog.</h2></div><span className="event-count">{products.data?.length ?? 0} ITEMS</span></div><div className="orders-table-wrap"><table className="data-table catalog-admin-table"><thead><tr><th>PRODUCT</th><th>CATEGORY</th><th>PRICE</th><th>STORE STOCK</th><th>RATING</th><th></th></tr></thead><tbody>{products.data?.map((product) => <tr key={product.id}><td><div className="inventory-product"><img src={product.imageUrl} alt="" /><strong>{product.name}</strong></div></td><td>{product.category}</td><td>₹{Number(product.price).toLocaleString("en-IN")}</td><td>{product.inventory.reduce((sum, item) => sum + item.stockCount, 0)}</td><td>{product.rating.toFixed(1)} / 5</td><td><button className="catalog-edit-button" onClick={() => beginEdit(product)}><ArrowDown size={12} /> Edit</button></td></tr>)}</tbody></table>{products.isError && <div className="small-empty">Could not load catalog from Aiven PostgreSQL.</div>}{products.data?.length === 0 && <div className="small-empty">No catalog items yet. Add a product to get started.</div>}</div></section>
  </AdminShell>;
}