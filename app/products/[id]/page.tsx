"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Check, MapPin, ShieldCheck, ShoppingBag, Star, Truck } from "lucide-react";
import { useState } from "react";
import { api, cartId, money, notifyCartChanged, type Product } from "@/lib/api";

type ProductDetail = Omit<Product, "cities"> & { cities: { city: string; stock: number }[] };

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState("");
  const product = useQuery({ queryKey: ["product", params.id], queryFn: () => api<ProductDetail>(`/products/${params.id}`) });

  async function addToCart(buyNow = false) {
    if (!product.data) return;
    setMessage("");
    try {
      await api(`/cart/${cartId()}/items`, { method: "POST", body: JSON.stringify({ productId: product.data.productId, quantity }) });
      notifyCartChanged();
      if (buyNow) router.push("/checkout");
      else setMessage("Added to your bag.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to add this item.");
    }
  }

  if (product.isLoading) return <main className="page-width detail-loading"><div className="product-skeleton" /></main>;
  if (!product.data) return <main className="page-width detail-missing"><strong>We couldn’t find this item.</strong><Link href="/products" className="text-link">Back to discovery <ArrowRight size={14} /></Link></main>;

  const item = product.data;
  return (
    <main className="page-width detail-page">
      <div className="breadcrumb"><Link href="/products"><ArrowLeft size={13} /> Back to discovery</Link><span>/</span><span>{item.category}</span></div>
      <div className="detail-layout">
        <div className="detail-image"><img src={item.imageUrl} alt={item.name} /><span className="detail-image-tag">{item.category} / RETAILX EDIT</span></div>
        <section className="detail-copy">
          <div className="eyebrow"><span className="eyebrow-line" /> THOUGHTFULLY CHOSEN</div>
          <h1>{item.name}</h1>
          <div className="detail-rating"><Star size={15} fill="currentColor" /> {item.rating.toFixed(1)} <span>·</span> Highly rated by customers</div>
          <p className="detail-description">{item.description}</p>
          <div className="detail-price">{money(item.price)} <span>Inclusive of all taxes</span></div>
          <div className={`stock-callout${item.stock < 6 ? " stock-low" : ""}`}><span className="stock-indicator" /><div><strong>{item.stock > 0 ? item.stock < 6 ? `Only ${item.stock} left` : "In stock and ready" : "Currently unavailable"}</strong><span>Inventory synced from your local stores</span></div></div>
          <div className="detail-locations"><span className="filter-label">Available near</span>{item.cities.length ? item.cities.map((location) => <span className="location-chip" key={location.city}><MapPin size={12} /> {location.city} <b>{location.stock}</b></span>) : <span className="muted-copy">No stores have stock right now.</span>}</div>
          <div className="detail-buy-row"><div className="quantity-stepper"><button onClick={() => setQuantity(Math.max(1, quantity - 1))} aria-label="Decrease quantity">−</button><span>{quantity}</span><button onClick={() => setQuantity(Math.min(Math.max(item.stock, 1), quantity + 1))} aria-label="Increase quantity">+</button></div><button className="button button-primary detail-add" disabled={item.stock < 1} onClick={() => void addToCart()}><ShoppingBag size={16} /> Add to bag</button></div>
          <button className="button button-secondary detail-buy" disabled={item.stock < 1} onClick={() => void addToCart(true)}>Buy now <ArrowRight size={15} /></button>
          {message && <p className={message.startsWith("Added") ? "success-message" : "error-message"}>{message.startsWith("Added") && <Check size={14} />}{message}</p>}
          <div className="detail-promises"><span><Truck size={15} /> Delivery in 2–4 days</span><span><ShieldCheck size={15} /> Easy 30-day returns</span></div>
        </section>
      </div>
    </main>
  );
}