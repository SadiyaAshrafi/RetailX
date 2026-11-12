"use client";

import Link from "next/link";
import { ArrowUpRight, Check, Plus, Star } from "lucide-react";
import { useState } from "react";
import { api, cartId, money, notifyCartChanged, type Product } from "@/lib/api";

export function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const [added, setAdded] = useState(false);
  const [error, setError] = useState("");

  async function addToBag() {
    setError("");
    try {
      await api(`/cart/${cartId()}/items`, {
        method: "POST",
        body: JSON.stringify({ productId: product.productId, quantity: 1 }),
      });
      setAdded(true);
      notifyCartChanged();
      window.setTimeout(() => setAdded(false), 1500);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to add this item.");
    }
  }

  return (
    <article className="product-card" style={{ animationDelay: `${index * 55}ms` }}>
      <Link href={`/products/${product.productId}`} className="product-image-wrap">
        <img src={product.imageUrl} alt={product.name} loading="lazy" />
        <span className="product-category">{product.category}</span>
        <span className="product-open"><ArrowUpRight size={17} /></span>
      </Link>
      <div className="product-card-info">
        <div className="product-rating"><Star size={13} fill="currentColor" /> {product.rating.toFixed(1)} <span>·</span> {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}</div>
        <Link href={`/products/${product.productId}`} className="product-name">{product.name}</Link>
        <div className="product-card-bottom">
          <span className="product-price">{money(product.price)}</span>
          <button className={`add-button${added ? " added" : ""}`} onClick={addToBag} disabled={product.stock < 1} aria-label={`Add ${product.name} to bag`} title={error || (added ? "Added to bag" : "Add to bag")}>
            {added ? <Check size={17} /> : <Plus size={17} />}
          </button>
        </div>
        {error && <span className="inline-error">{error}</span>}
      </div>
    </article>
  );
}