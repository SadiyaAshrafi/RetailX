"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Check, GitCompare, Plus, ShoppingBag, Sparkles, Star, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { api, cartId, money, notifyCartChanged, type Product } from "@/lib/api";

type CompareProduct = {
  id: string;
  name: string;
  category: string;
  price: number;
  rating: number;
  popularity: number;
  imageUrl: string;
  description: string;
  stock: number;
  specs: Record<string, string>;
  highlights: string[];
  cities: { city: string; stock: number }[];
};

export default function ComparePage() {
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [addedId, setAddedId] = useState<string | null>(null);

  useEffect(() => {
    const list = JSON.parse(localStorage.getItem("retailx-compare-list") || "[]");
    if (list.length === 0) {
      // Default sample items to showcase comparison
      const defaults = ["rx-bluetooth-earphones", "rx-soundcore-q30"];
      setCompareIds(defaults);
      localStorage.setItem("retailx-compare-list", JSON.stringify(defaults));
    } else {
      setCompareIds(list);
    }

    const handler = () => {
      const updated = JSON.parse(localStorage.getItem("retailx-compare-list") || "[]");
      setCompareIds(updated);
    };
    window.addEventListener("retailx-compare-changed", handler);
    return () => window.removeEventListener("retailx-compare-changed", handler);
  }, []);

  const query = useQuery({
    queryKey: ["compare-products", compareIds.join(",")],
    queryFn: () => api<{ products: CompareProduct[] }>(`/compare?ids=${compareIds.join(",")}`),
    enabled: compareIds.length > 0,
  });

  const products = query.data?.products || [];

  function removeProduct(id: string) {
    const updated = compareIds.filter((item) => item !== id);
    setCompareIds(updated);
    localStorage.setItem("retailx-compare-list", JSON.stringify(updated));
    window.dispatchEvent(new Event("retailx-compare-changed"));
  }

  function clearAll() {
    setCompareIds([]);
    localStorage.setItem("retailx-compare-list", "[]");
    window.dispatchEvent(new Event("retailx-compare-changed"));
  }

  async function addToBag(productId: string) {
    try {
      await api(`/cart/${cartId()}/items`, {
        method: "POST",
        body: JSON.stringify({ productId, quantity: 1 }),
      });
      setAddedId(productId);
      notifyCartChanged();
      window.setTimeout(() => setAddedId(null), 1500);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Could not add to bag");
    }
  }

  // Collect all unique spec keys across products
  const allSpecKeys = Array.from(
    new Set(products.flatMap((p) => Object.keys(p.specs || {})))
  );

  return (
    <main className="page-width compare-page">
      <div className="breadcrumb">
        <Link href="/products">
          <ArrowLeft size={13} /> Back to discovery
        </Link>
      </div>

      <div className="page-title-row">
        <div>
          <div className="eyebrow"><span className="eyebrow-line" /> INTELLIGENT PRODUCT MATRIX</div>
          <h1>Compare side by side.</h1>
          <p className="page-subtitle">Real-time specifications, live store availability, and AI suitability analysis.</p>
        </div>
        {products.length > 0 && (
          <button onClick={clearAll} className="button button-outline clear-compare-btn">
            <Trash2 size={14} /> Clear list
          </button>
        )}
      </div>

      {products.length === 0 ? (
        <div className="catalog-empty">
          <GitCompare size={36} className="text-stone-400 mx-auto mb-3" />
          <strong>No products selected for comparison.</strong>
          <p>Browse our catalog and tap the compare icon on any item.</p>
          <Link href="/products" className="button button-primary mt-4">
            Discover products <ArrowRight size={14} />
          </Link>
        </div>
      ) : (
        <div className="compare-matrix-wrap">
          {/* Header Card Row */}
          <div className="compare-grid" style={{ gridTemplateColumns: `220px repeat(${products.length}, minmax(260px, 1fr))` }}>
            <div className="compare-label-col">
              <span className="matrix-title">PRODUCT</span>
            </div>
            {products.map((p) => (
              <div key={p.id} className="compare-product-col">
                <button
                  onClick={() => removeProduct(p.id)}
                  className="compare-remove-btn"
                  title="Remove from comparison"
                >
                  <X size={15} />
                </button>
                <div className="compare-thumb">
                  <img src={p.imageUrl} alt={p.name} />
                </div>
                <div className="compare-category">{p.category}</div>
                <Link href={`/products/${p.id}`} className="compare-name">{p.name}</Link>
                <div className="compare-rating">
                  <Star size={13} fill="currentColor" /> {p.rating.toFixed(1)}
                </div>
                <div className="compare-price">{money(p.price)}</div>
                <button
                  onClick={() => addToBag(p.id)}
                  disabled={p.stock < 1}
                  className={`button button-primary compare-add-btn ${addedId === p.id ? "added" : ""}`}
                >
                  {addedId === p.id ? <><Check size={14} /> Added</> : <><ShoppingBag size={14} /> Add to bag</>}
                </button>
              </div>
            ))}
          </div>

          {/* AI Suitability Verdict */}
          <div className="compare-section-heading">
            <Sparkles size={16} className="text-amber-500" /> AI VERDICT & SUITABILITY
          </div>
          <div className="compare-grid" style={{ gridTemplateColumns: `220px repeat(${products.length}, minmax(260px, 1fr))` }}>
            <div className="compare-label-col">Best For</div>
            {products.map((p) => (
              <div key={p.id} className="compare-cell ai-highlight-cell">
                <strong>
                  {p.price < 3000
                    ? "Best Everyday Value"
                    : p.price < 10000
                    ? "Sweet-Spot Daily Driver"
                    : "Premium Enthusiast Choice"}
                </strong>
                <p className="text-xs text-stone-600 mt-1">
                  {p.description}
                </p>
              </div>
            ))}
          </div>

          {/* Live Store Stock Row */}
          <div className="compare-section-heading">LIVE CITY INVENTORY</div>
          <div className="compare-grid" style={{ gridTemplateColumns: `220px repeat(${products.length}, minmax(260px, 1fr))` }}>
            <div className="compare-label-col">Store Availability</div>
            {products.map((p) => (
              <div key={p.id} className="compare-cell">
                <div className="city-stock-tags">
                  {p.cities?.map((c) => (
                    <span key={c.city} className={`city-tag ${c.stock > 0 ? "in-stock" : "out"}`}>
                      {c.city}: <b>{c.stock > 0 ? `${c.stock} pcs` : "0"}</b>
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Highlights */}
          <div className="compare-section-heading">KEY HIGHLIGHTS</div>
          <div className="compare-grid" style={{ gridTemplateColumns: `220px repeat(${products.length}, minmax(260px, 1fr))` }}>
            <div className="compare-label-col">Highlights</div>
            {products.map((p) => (
              <div key={p.id} className="compare-cell">
                <ul className="compare-highlights-list">
                  {(p.highlights || ["Verified authentic", "1-year warranty"]).map((h, i) => (
                    <li key={i}><Check size={12} className="text-emerald-600 inline mr-1" /> {h}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Technical Specs Rows */}
          {allSpecKeys.length > 0 && (
            <>
              <div className="compare-section-heading">HARDWARE SPECIFICATIONS</div>
              {allSpecKeys.map((specKey) => (
                <div key={specKey} className="compare-grid" style={{ gridTemplateColumns: `220px repeat(${products.length}, minmax(260px, 1fr))` }}>
                  <div className="compare-label-col">{specKey}</div>
                  {products.map((p) => (
                    <div key={p.id} className="compare-cell">
                      {p.specs?.[specKey] || "—"}
                    </div>
                  ))}
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </main>
  );
}
