"use client";

import Link from "next/link";
import { ArrowUpRight, Check, GitCompare, Plus, Star } from "lucide-react";
import { useState, useEffect } from "react";
import { api, cartId, money, notifyCartChanged, type Product } from "@/lib/api";

export function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const [added, setAdded] = useState(false);
  const [error, setError] = useState("");
  const [inCompare, setInCompare] = useState(false);

  useEffect(() => {
    const list = JSON.parse(localStorage.getItem("retailx-compare-list") || "[]");
    setInCompare(list.includes(product.productId));
  }, [product.productId]);

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

  function toggleCompare(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const list: string[] = JSON.parse(localStorage.getItem("retailx-compare-list") || "[]");
    let updated: string[];
    if (list.includes(product.productId)) {
      updated = list.filter((id) => id !== product.productId);
      setInCompare(false);
    } else {
      if (list.length >= 4) {
        alert("You can compare up to 4 products at once.");
        return;
      }
      updated = [...list, product.productId];
      setInCompare(true);
    }
    localStorage.setItem("retailx-compare-list", JSON.stringify(updated));
    window.dispatchEvent(new Event("retailx-compare-changed"));
  }

  return (
    <article className="product-card" style={{ animationDelay: `${index * 55}ms` }}>
      <Link href={`/products/${product.productId}`} className="product-image-wrap">
        <img src={product.imageUrl} alt={product.name} loading="lazy" />
        <span className="product-category">{product.category}</span>
        <button
          type="button"
          onClick={toggleCompare}
          className={`card-compare-btn ${inCompare ? "active" : ""}`}
          title={inCompare ? "Remove from comparison" : "Add to comparison"}
          aria-label="Compare product"
        >
          <GitCompare size={14} />
        </button>
        <span className="product-open"><ArrowUpRight size={17} /></span>
      </Link>
      <div className="product-card-info">
        <div className="product-rating">
          <Star size={13} fill="currentColor" /> {product.rating.toFixed(1)} <span>·</span>{" "}
          {product.stock > 0 ? (
            <span className="stock-pill">{product.stock} in stock</span>
          ) : (
            <span className="out-of-stock-pill">Out of stock</span>
          )}
        </div>
        <Link href={`/products/${product.productId}`} className="product-name">{product.name}</Link>
        <div className="product-card-bottom">
          <span className="product-price">{money(product.price)}</span>
          {product.stock < 1 ? (
            <span className="out-of-stock-tag" title="Out of stock - Not available">Out of stock</span>
          ) : (
            <button
              className={`add-button${added ? " added" : ""}`}
              onClick={addToBag}
              aria-label={`Add ${product.name} to bag`}
              title={error || (added ? "Added to bag" : "Add to bag")}
            >
              {added ? <Check size={17} /> : <Plus size={17} />}
            </button>
          )}
        </div>
        {error && <span className="inline-error">{error}</span>}
      </div>
    </article>
  );
}
