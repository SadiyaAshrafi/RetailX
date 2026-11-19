"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Check, LockKeyhole, ShieldCheck, Sparkles, Tag, Zap } from "lucide-react";
import { useState } from "react";
import { api, cartId, money } from "@/lib/api";

type Cart = {
  items: {
    quantity: number;
    product: {
      name: string;
      price: string | number;
      inventory: { stockCount: number }[];
    };
  }[];
};

type CouponResult = {
  valid: boolean;
  code: string;
  description: string;
  discountAmount: number;
  finalTotal: number;
};

export default function CheckoutPage() {
  const router = useRouter();
  const [values, setValues] = useState({ name: "", phone: "", email: "", address: "" });
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<CouponResult | null>(null);
  const [couponError, setCouponError] = useState("");
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const cart = useQuery({
    queryKey: ["checkout-cart"],
    queryFn: () => api<Cart>(`/cart/${cartId()}`),
    enabled: typeof window !== "undefined",
  });

  const items = cart.data?.items ?? [];
  const rawSubtotal = items.reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0);
  const shippingFee = rawSubtotal >= 2500 || appliedCoupon?.code === "FREESHIP" ? 0 : 149;
  const discount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const finalTotal = Math.max(0, rawSubtotal + shippingFee - discount);

  async function applyCoupon(e: React.FormEvent) {
    e.preventDefault();
    if (!couponCode.trim()) return;
    setCouponError("");
    setApplyingCoupon(true);
    try {
      const res = await api<CouponResult>("/coupons", {
        method: "POST",
        body: JSON.stringify({ code: couponCode.trim(), cartTotal: rawSubtotal }),
      });
      setAppliedCoupon(res);
      setCouponCode("");
    } catch (err) {
      setCouponError(err instanceof Error ? err.message : "Invalid promo code");
      setAppliedCoupon(null);
    } finally {
      setApplyingCoupon(false);
    }
  }

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
      <div className="breadcrumb">
        <Link href="/cart"><ArrowLeft size={13} /> Back to bag</Link>
      </div>

      <div className="page-title-row">
        <div>
          <div className="eyebrow"><span className="eyebrow-line" /> ALMOST YOURS</div>
          <h1>Delivery details.</h1>
        </div>
        <span className="secure-checkout"><LockKeyhole size={13} /> 256-bit Encrypted Checkout</span>
      </div>

      {!items.length && !cart.isLoading ? (
        <div className="catalog-empty">
          <strong>Your bag is empty.</strong>
          <p>Add something good before checking out.</p>
          <Link href="/products" className="text-link">Explore products <ArrowRight size={14} /></Link>
        </div>
      ) : (
        <div className="checkout-layout">
          <form className="checkout-form" onSubmit={placeOrder}>
            <div className="form-section-title">
              <span>01</span>
              <div>
                <strong>Who’s receiving this?</strong>
                <small>We’ll send instant SMS and email order updates.</small>
              </div>
            </div>

            <label className="form-field">
              Full name
              <input
                required
                minLength={2}
                autoComplete="name"
                value={values.name}
                onChange={(event) => setValues({ ...values, name: event.target.value })}
                placeholder="e.g. Rahul Sharma"
              />
            </label>

            <div className="form-columns">
              <label className="form-field">
                Email address
                <input
                  required
                  type="email"
                  autoComplete="email"
                  value={values.email}
                  onChange={(event) => setValues({ ...values, email: event.target.value })}
                  placeholder="you@example.com"
                />
              </label>

              <label className="form-field">
                Phone number
                <input
                  required
                  minLength={8}
                  type="tel"
                  autoComplete="tel"
                  value={values.phone}
                  onChange={(event) => setValues({ ...values, phone: event.target.value })}
                  placeholder="+91 98765 43210"
                />
              </label>
            </div>

            <div className="form-section-title address-title">
              <span>02</span>
              <div>
                <strong>Where should it go?</strong>
                <small>Select from our warehouse regions (Bengaluru, Mumbai, Delhi, Hyderabad) or any PIN code.</small>
              </div>
            </div>

            <label className="form-field">
              Delivery address
              <textarea
                required
                minLength={8}
                autoComplete="street-address"
                rows={3}
                value={values.address}
                onChange={(event) => setValues({ ...values, address: event.target.value })}
                placeholder="House / flat number, building, street, city and PIN code"
              />
            </label>

            {error && <p className="error-message">{error}</p>}

            <button
              type="submit"
              className="button button-primary place-order"
              disabled={submitting || !items.length}
            >
              {submitting ? "Processing through Kafka pipeline…" : <>Confirm Order · {money(finalTotal)} <ArrowRight size={15} /></>}
            </button>

            <p className="checkout-consent">
              <ShieldCheck size={14} /> Transactional stock lock guaranteed by Aiven PostgreSQL.
            </p>
          </form>

          <aside className="order-summary checkout-summary">
            <div className="summary-heading">
              In your bag <span>{items.length}</span>
            </div>

            {items.map((item, index) => (
              <div className="checkout-mini-item" key={`${item.product.name}-${index}`}>
                <span>{item.quantity} × {item.product.name}</span>
                <strong>{money(Number(item.product.price) * item.quantity)}</strong>
              </div>
            ))}

            <div className="summary-line">
              <span>Subtotal</span>
              <strong>{money(rawSubtotal)}</strong>
            </div>

            <div className="summary-line">
              <span>Delivery</span>
              <strong>{shippingFee === 0 ? <span className="text-emerald-600 font-medium">Free</span> : "₹149"}</strong>
            </div>

            {appliedCoupon && (
              <div className="summary-line text-emerald-600">
                <span>Promo ({appliedCoupon.code})</span>
                <strong>−{money(appliedCoupon.discountAmount)}</strong>
              </div>
            )}

            <div className="summary-line summary-total">
              <span>Total Amount</span>
              <strong>{money(finalTotal)}</strong>
            </div>

            {/* Coupon Code Input */}
            <div className="checkout-coupon-box">
              <div className="coupon-title">
                <Tag size={13} /> Have a promo code?
              </div>
              <div className="coupon-input-row">
                <input
                  type="text"
                  placeholder="Try HACKATHON2026"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="coupon-input"
                />
                <button
                  type="button"
                  onClick={applyCoupon}
                  disabled={applyingCoupon || !couponCode.trim()}
                  className="coupon-btn"
                >
                  {applyingCoupon ? "..." : "Apply"}
                </button>
              </div>
              {couponError && <span className="coupon-err">{couponError}</span>}
              {appliedCoupon && (
                <div className="coupon-applied-tag">
                  <Check size={12} /> {appliedCoupon.description}
                </div>
              )}
            </div>

            <div className="checkout-powered">
              <i /> Event Stream: PostgreSQL Outbox ➔ Aiven Kafka ➔ OpenSearch
            </div>
          </aside>
        </div>
      )}
    </main>
  );
}
