"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowDownRight, ArrowRight, ArrowUpRight, AudioLines, Check, Copy, Flame, Gamepad2, GitCompare, Laptop, Sparkles, Tag, Watch, Zap } from "lucide-react";
import { useState } from "react";
import { ProductCard } from "@/components/product-card";
import { SearchBox } from "@/components/search-box";
import { api, type SearchResult } from "@/lib/api";

const categories = [
  { title: "Audio", hint: "Hear more", icon: AudioLines, image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=480&q=80" },
  { title: "Computing", hint: "Work in flow", icon: Laptop, image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=480&q=80" },
  { title: "Gaming", hint: "Play sharper", icon: Gamepad2, image: "https://images.unsplash.com/photo-1592840496694-26d035b52b48?auto=format&fit=crop&w=480&q=80" },
  { title: "Wearables", hint: "Move smarter", icon: Watch, image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=480&q=80" },
];

const SEARCH_PILLS = [
  { label: "🎧 Noise Cancelling", query: "noise cancelling" },
  { label: "⌨️ Mechanical Keyboard", query: "keyboard" },
  { label: "🖱️ Ultralight Mouse", query: "gaming mouse" },
  { label: "🖥️ 4K Display", query: "4k monitor" },
  { label: "⌚ Smartwatch", query: "watch" },
];

export default function HomePage() {
  const [copiedCode, setCopiedCode] = useState(false);
  const products = useQuery({
    queryKey: ["home-products"],
    queryFn: () => api<SearchResult>("/products?sort=popular&limit=8"),
  });

  function copyPromo(code: string) {
    if (typeof navigator !== "undefined") {
      navigator.clipboard.writeText(code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  }

  return (
    <main>
      {/* Hackathon Promo Announcement Banner */}
      <section className="hackathon-promo-banner">
        <div className="page-width promo-banner-inner">
          <span className="promo-badge"><Flame size={14} /> LIVE HACKATHON OFFER</span>
          <span className="promo-text">Get 20% off your entire order + free express shipping across all hubs!</span>
          <button
            onClick={() => copyPromo("HACKATHON2026")}
            className="promo-code-btn"
            title="Click to copy coupon code"
          >
            <Tag size={12} />
            <span>HACKATHON2026</span>
            {copiedCode ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
          </button>
        </div>
      </section>

      {/* Hero Section */}
      <section className="hero-section page-width">
        <div className="hero-content">
          <div className="eyebrow"><span className="eyebrow-line" /> THE GOOD STUFF, FOUND</div>
          <h1>Better things.<br /><span>Less looking.</span></h1>
          <p>Next-generation commerce with sub-second OpenSearch matching and durable Kafka event-driven order processing.</p>
          <SearchBox large />

          {/* Quick Search Pills */}
          <div className="hero-search-pills">
            <span className="pill-title">Popular:</span>
            {SEARCH_PILLS.map((pill) => (
              <Link key={pill.label} href={`/products?q=${encodeURIComponent(pill.query)}`} className="hero-pill">
                {pill.label}
              </Link>
            ))}
          </div>

          <div className="hero-assurance">
            <span><i /> Real-time stock in Bengaluru, Mumbai, Delhi & Hyderabad</span>
            <span className="assurance-dot">·</span>
            <span>Free delivery over ₹2,500</span>
          </div>

          <div className="hero-action-buttons">
            <Link href="/products" className="button button-primary">
              Explore catalog <ArrowRight size={16} />
            </Link>
            <Link href="/compare" className="button button-outline">
              <GitCompare size={15} /> Compare gear
            </Link>
          </div>
        </div>

        <div className="hero-visual">
          <img src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1100&q=88" alt="Over-ear headphones on a warm studio surface" />
          <div className="hero-image-tint" />
          <div className="hero-product-note">
            <span className="note-kicker">THE EDIT · 01</span>
            <strong>Sound that<br />moves with you.</strong>
            <Link href="/products/rx-soundcore-q30">Inspect Soundcore <ArrowUpRight size={14} /></Link>
          </div>
          <div className="hero-coordinate">12°58' N&nbsp; 77°35' E</div>
          <div className="hero-index">01 <span>/</span> 04</div>
        </div>
        <div className="hero-scroll"><ArrowDownRight size={17} /> SCROLL TO DISCOVER</div>
      </section>

      {/* Real-time Ticker */}
      <section className="live-ticker-strip">
        <div className="ticker-track">
          <span>🔥 Just purchased: Soundcore Space One in Bengaluru</span>
          <span className="ticker-sep">·</span>
          <span>⚡ Stock synchronized: Keychron K2 in Mumbai warehouse</span>
          <span className="ticker-sep">·</span>
          <span>✨ OpenSearch reindex latency: 12ms</span>
          <span className="ticker-sep">·</span>
          <span>📦 Aiven PostgreSQL transactional outbox active</span>
          <span className="ticker-sep">·</span>
          <span>🎯 Apache Kafka event consumer listening on 4 topics</span>
        </div>
      </section>

      {/* Trust Strip */}
      <section className="trust-strip" aria-label="RetailX benefits">
        <div className="page-width trust-inner">
          <span><i className="trust-dot blue" /> Curated, never crowded</span>
          <span><i className="trust-dot green" /> City warehouse stock guaranteed</span>
          <span><i className="trust-dot amber" /> Live Kafka & OpenSearch pipeline</span>
          <span className="trust-aiven">POWERED BY AIVEN CLOUD × NEXT.JS 15</span>
        </div>
      </section>

      {/* Category Section */}
      <section className="page-width section-block category-section">
        <div className="section-heading">
          <div>
            <div className="eyebrow"><span className="eyebrow-line" /> FIND YOUR THING</div>
            <h2>A good place to start.</h2>
          </div>
          <Link href="/products" className="text-link">All categories <ArrowRight size={16} /></Link>
        </div>
        <div className="category-grid">
          {categories.map(({ title, hint, icon: Icon, image }, index) => (
            <Link href={`/products?category=${encodeURIComponent(title)}`} className={`category-tile category-tone-${index + 1}`} key={title}>
              <img src={image} alt="" loading="lazy" />
              <span className="category-icon"><Icon size={18} /></span>
              <span className="category-copy"><strong>{title}</strong><small>{hint}</small></span>
              <ArrowUpRight className="category-arrow" size={17} />
            </Link>
          ))}
        </div>
      </section>

      {/* Product Shelf */}
      <section className="page-width section-block product-shelf">
        <div className="section-heading">
          <div>
            <div className="eyebrow"><span className="eyebrow-line" /> THE CROWD-PLEASERS</div>
            <h2>Popular for a reason.</h2>
          </div>
          <Link href="/products?sort=popular" className="text-link">See all products <ArrowRight size={16} /></Link>
        </div>
        <div className="shelf-meta">
          <span className="live-source"><i /> LIVE CATALOG</span>
          <span>Synchronized with Aiven PostgreSQL & OpenSearch</span>
        </div>
        {products.isLoading ? (
          <div className="product-grid">
            {[0, 1, 2, 3].map((item) => <div className="product-skeleton" key={item} />)}
          </div>
        ) : products.data?.products.length ? (
          <div className="product-grid">
            {products.data.products.map((product, index) => (
              <ProductCard key={product.productId} product={product} index={index} />
            ))}
          </div>
        ) : (
          <div className="empty-catalog">
            <span className="empty-symbol">✳</span>
            <div>
              <strong>Loading catalog...</strong>
              <p>Fetching real-time products and stock.</p>
            </div>
          </div>
        )}
      </section>

      {/* Interactive Compare Teaser */}
      <section className="page-width section-block compare-teaser-section">
        <div className="compare-teaser-card">
          <div className="compare-teaser-content">
            <div className="eyebrow"><span className="eyebrow-line" /> PRODUCT DECISION ENGINE</div>
            <h2>Can’t decide between two pieces of gear?</h2>
            <p>Use our real-time comparison matrix to evaluate battery life, weight, connectivity, driver specs, and city stock side by side with AI verdict.</p>
            <Link href="/compare" className="button button-primary">
              Launch Product Matrix <GitCompare size={16} />
            </Link>
          </div>
          <div className="compare-teaser-graphic">
            <div className="mini-card-stack">
              <div className="mini-compare-chip chip-1">
                <img src="https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?auto=format&fit=crop&w=300&q=80" alt="" />
                <div>
                  <strong>Bluetooth Earphones</strong>
                  <span>₹1,799 · 24h Playtime</span>
                </div>
              </div>
              <span className="vs-badge">VS</span>
              <div className="mini-compare-chip chip-2">
                <img src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=300&q=80" alt="" />
                <div>
                  <strong>Soundcore Space One</strong>
                  <span>₹7,999 · Hybrid ANC</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Assistant Promo Banner */}
      <section className="page-width assistant-promo">
        <div className="assistant-orbit">
          <div className="orbit-ring orbit-ring-one" />
          <div className="orbit-ring orbit-ring-two" />
          <span><Sparkles size={25} /></span>
        </div>
        <div className="assistant-copy">
          <div className="eyebrow"><span className="eyebrow-line" /> A BETTER WAY TO SHOP</div>
          <h2>Not sure what fits?<br /><em>Just speak or describe it.</em></h2>
          <p>Tell our AI shopping concierge what you have in mind. It reasons through real-time store stock, creates money-saving bundles, and answers questions instantly.</p>
        </div>
        <Link href="/assistant" className="button button-primary">
          Try AI Concierge <ArrowUpRight size={16} />
        </Link>
      </section>

      <footer className="site-footer page-width">
        <Link href="/" className="brand">
          <span className="brand-mark"><Zap size={16} fill="currentColor" /></span>
          <span>retail<span className="brand-x">x</span></span>
        </Link>
        <span>Good finds. Fair prices. A smarter way to shop.</span>
        <div>
          <Link href="/compare">Product comparison</Link>
          <span>·</span>
          <Link href="/assistant">AI assistant</Link>
          <span>·</span>
          <Link href="/admin">Retail operations</Link>
          <span>© RetailX 2026</span>
        </div>
      </footer>
    </main>
  );
}
