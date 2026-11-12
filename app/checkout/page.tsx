"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, LockKeyhole, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { api, cartId, money } from "@/lib/api";

type Cart = { items: { quantity: number; product: { name: string; price: string | number; inventory: { stockCount: number }[] } }[] };

export default function CheckoutPage() {
  const router = useRouter();
  const [values, setValues] = useState({ name: "", phone: "", email: "", address: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const cart = useQuery({ queryKey: ["checkout-cart"], queryFn: () => api<Cart>(`/cart/${cartId()}`), enabled: typeof window !== "undefined" });
  const items = cart.data?.items ?? [];
  const total = items.reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0);

  async function placeOrder(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const result = await api<{ orderId: string }>("/checkout", {
        method: "POST",
        body: JSON.stringify({ ...values, cartId: cartId() }),
      });
      router.push(`/order-success?order=${encodeURIComponent(result.orderId)}`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to place your order.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="page-width checkout-page">
      <div className="breadcrumb"><Link href="/cart"><ArrowLeft size={13} /> Back to bag</Link></div>
      <div className="page-title-row"><div><div className="eyebrow"><span className="eyebrow-line" /> ALMOST YOURS</div><h1>Delivery details.</h1></div><span className="secure-checkout"><LockKeyhole size={13} /> Secure checkout</span></div>
      {!items.length && !cart.isLoading ? <div className="catalog-empty"><strong>Your bag is empty.</strong><p>Add something good before checking out.</p><Link href="/products" className="text-link">Explore products <ArrowRight size={14} /></Link></div> : <div className="checkout-layout"><form className="checkout-form" onSubmit={placeOrder}><div className="form-section-title"><span>01</span><div><strong>Who’s receiving this?</strong><small>We’ll only use these details for your order.</small></div></div><label className="form-field">Full name<input required minLength={2} autoComplete="name" value={values.name} onChange={(event) => setValues({ ...values, name: event.target.value })} placeholder="Your name" /></label><div className="form-columns"><label className="form-field">Email address<input required type="email" autoComplete="email" value={values.email} onChange={(event) => setValues({ ...values, email: event.target.value })} placeholder="you@example.com" /></label><label className="form-field">Phone number<input required minLength={8} type="tel" autoComplete="tel" value={values.phone} onChange={(event) => setValues({ ...values, phone: event.target.value })} placeholder="+91 98765 43210" /></label></div><div className="form-section-title address-title"><span>02</span><div><strong>Where should it go?</strong><small>Include your street, city, and PIN code.</small></div></div><label className="form-field">Delivery address<textarea required minLength={8} autoComplete="street-address" rows={3} value={values.address} onChange={(event) => setValues({ ...values, address: event.target.value })} placeholder="House / flat, street, city, PIN code" /></label>{error && <p className="error-message">{error}</p>}<button className="button button-primary place-order" disabled={submitting || !items.length}>{submitting ? "Placing your order…" : <>Place order <ArrowRight size={15} /></>}</button><p className="checkout-consent"><ShieldCheck size={14} /> Your order and inventory are validated before confirmation.</p></form><aside className="order-summary checkout-summary"><div className="summary-heading">In your bag <span>{items.length}</span></div>{items.map((item, index) => <div className="checkout-mini-item" key={`${item.product.name}-${index}`}><span>{item.quantity} × {item.product.name}</span><strong>{money(Number(item.product.price) * item.quantity)}</strong></div>)}<div className="summary-line"><span>Delivery</span><strong>{total >= 2500 ? "Free" : "₹149"}</strong></div><div className="summary-line summary-total"><span>Total</span><strong>{money(total + (total >= 2500 ? 0 : 149))}</strong></div><div className="checkout-powered"><i /> Order storage by Aiven PostgreSQL</div></aside></div>}
    </main>
  );
}