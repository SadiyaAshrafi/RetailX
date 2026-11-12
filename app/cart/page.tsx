"use client";

import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, LockKeyhole, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { api, cartId, money, notifyCartChanged } from "@/lib/api";

type Cart = {
  items: {
    id: string;
    quantity: number;
    product: { id: string; name: string; imageUrl: string; price: string | number; inventory: { stockCount: number }[] };
  }[];
};

export default function CartPage() {
  const queryClient = useQueryClient();
  const cart = useQuery({ queryKey: ["cart"], queryFn: () => api<Cart>(`/cart/${cartId()}`), enabled: typeof window !== "undefined" });
  const items = cart.data?.items ?? [];
  const subtotal = items.reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0);

  async function setQuantity(itemId: string, quantity: number) {
    await api(`/cart/${cartId()}/items/${itemId}`, { method: "PATCH", body: JSON.stringify({ quantity }) });
    await queryClient.invalidateQueries({ queryKey: ["cart"] });
    notifyCartChanged();
  }

  return (
    <main className="page-width cart-page">
      <div className="breadcrumb"><Link href="/products"><ArrowLeft size={13} /> Continue shopping</Link></div>
      <div className="page-title-row"><div><div className="eyebrow"><span className="eyebrow-line" /> YOUR BAG</div><h1>Your good finds.</h1></div><span className="cart-item-count">{items.reduce((sum, item) => sum + item.quantity, 0)} items</span></div>
      {items.length ? <div className="cart-layout"><section className="cart-items">{items.map((item) => {
        const stock = item.product.inventory.reduce((sum, location) => sum + location.stockCount, 0);
        return <article className="cart-item" key={item.id}><Link href={`/products/${item.product.id}`} className="cart-item-image"><img src={item.product.imageUrl} alt={item.product.name} /></Link><div className="cart-item-info"><Link href={`/products/${item.product.id}`} className="cart-item-name">{item.product.name}</Link><span className="cart-item-stock">{stock > 0 ? `${stock} available across stores` : "Out of stock"}</span><div className="quantity-stepper cart-stepper"><button onClick={() => void setQuantity(item.id, item.quantity - 1)} aria-label="Decrease quantity"><Minus size={13} /></button><span>{item.quantity}</span><button onClick={() => void setQuantity(item.id, Math.min(stock, item.quantity + 1))} aria-label="Increase quantity" disabled={item.quantity >= stock}><Plus size={13} /></button></div></div><div className="cart-item-end"><strong>{money(Number(item.product.price) * item.quantity)}</strong><button className="remove-item" onClick={() => void setQuantity(item.id, 0)} aria-label={`Remove ${item.product.name}`}><Trash2 size={15} /></button></div></article>;
      })}</section><aside className="order-summary"><div className="summary-heading">Order summary</div><div className="summary-line"><span>Subtotal</span><strong>{money(subtotal)}</strong></div><div className="summary-line"><span>Delivery</span><strong>{subtotal >= 2500 ? "Free" : "₹149"}</strong></div><div className="summary-line summary-total"><span>Total</span><strong>{money(subtotal + (subtotal >= 2500 ? 0 : 149))}</strong></div><p className="summary-note">Taxes included. Delivery calculated for your address at checkout.</p><Link href="/checkout" className="button button-primary summary-checkout">Continue to checkout <ArrowRight size={16} /></Link><span className="secure-checkout"><LockKeyhole size={13} /> Secure checkout</span></aside></div> : <div className="cart-empty"><div className="empty-bag"><ShoppingBag size={25} /></div><h2>Your bag is taking a breather.</h2><p>Find something useful, lovely, or a bit of both.</p><Link href="/products" className="button button-primary">Explore the collection <ArrowRight size={15} /></Link></div>}
    </main>
  );
}