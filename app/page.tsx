"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowDownRight, ArrowRight, ArrowUpRight, AudioLines, Gamepad2, Laptop, Sparkles, Watch } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { SearchBox } from "@/components/search-box";
import { api, type SearchResult } from "@/lib/api";

const categories = [
  { title: "Audio", hint: "Hear more", icon: AudioLines, image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=480&q=80" },
  { title: "Computing", hint: "Work in flow", icon: Laptop, image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=480&q=80" },
  { title: "Gaming", hint: "Play sharper", icon: Gamepad2, image: "https://images.unsplash.com/photo-1592840496694-26d035b52b48?auto=format&fit=crop&w=480&q=80" },
  { title: "Wearables", hint: "Move smarter", icon: Watch, image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=480&q=80" },
];

export default function HomePage() {
  const products = useQuery({
    queryKey: ["home-products"],
    queryFn: () => api<SearchResult>("/products?sort=popular&limit=4"),
  });

  return (
    <main>
      <section className="hero-section page-width">
        <div className="hero-content">
          <div className="eyebrow"><span className="eyebrow-line" /> THE GOOD STUFF, FOUND</div>
          <h1>Better things.<br /><span>Less looking.</span></h1>
          <p>Thoughtful tech, honest prices, and a little help finding exactly what you need.</p>
          <SearchBox large />
          <div className="hero-assurance"><span><i /> Live stock, store by store</span><span className="assurance-dot">·</span><span>Free delivery over ₹2,500</span></div>
          <Link href="/products" className="text-link">Explore the collection <ArrowRight size={16} /></Link>
        </div>
        <div className="hero-visual">
          <img src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1100&q=88" alt="Over-ear headphones on a warm studio surface" />
          <div className="hero-image-tint" />
          <div className="hero-product-note"><span className="note-kicker">THE EDIT · 01</span><strong>Sound that<br />moves with you.</strong><span>Explore audio <ArrowUpRight size={14} /></span></div>
          <div className="hero-coordinate">12°58' N&nbsp; 77°35' E</div>
          <div className="hero-index">01 <span>/</span> 04</div>
        </div>
        <div className="hero-scroll"><ArrowDownRight size={17} /> SCROLL TO DISCOVER</div>
      </section>

      <section className="trust-strip" aria-label="RetailX benefits">
        <div className="page-width trust-inner"><span><i className="trust-dot blue" /> Curated, never crowded</span><span><i className="trust-dot green" /> Stock you can trust</span><span><i className="trust-dot amber" /> Here when you need us</span><span className="trust-aiven">MADE FOR REAL LIFE&nbsp; <b>×</b>&nbsp; POWERED BY AIVEN</span></div>
      </section>

      <section className="page-width section-block category-section">
        <div className="section-heading"><div><div className="eyebrow"><span className="eyebrow-line" /> FIND YOUR THING</div><h2>A good place to start.</h2></div><Link href="/products" className="text-link">All categories <ArrowRight size={16} /></Link></div>
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

      <section className="page-width section-block product-shelf">
        <div className="section-heading"><div><div className="eyebrow"><span className="eyebrow-line" /> THE CROWD-PLEASERS</div><h2>Popular for a reason.</h2></div><Link href="/products?sort=popular" className="text-link">See everything <ArrowRight size={16} /></Link></div>
        <div className="shelf-meta"><span className="live-source"><i /> LIVE CATALOG</span><span>Discoveries powered by Aiven OpenSearch</span></div>
        {products.isLoading ? <div className="product-grid">{[0, 1, 2, 3].map((item) => <div className="product-skeleton" key={item} />)}</div> : products.data?.products.length ? <div className="product-grid">{products.data.products.map((product, index) => <ProductCard key={product.productId} product={product} index={index} />)}</div> : <div className="empty-catalog"><span className="empty-symbol">✳</span><div><strong>{products.isError ? "Your live catalog is waiting to connect." : "The shelves are ready for their first products."}</strong><p>Connect Aiven PostgreSQL and OpenSearch, then seed the catalog to bring this collection to life.</p></div><Link href="/admin" className="button button-secondary">Service status <ArrowUpRight size={15} /></Link></div>}
      </section>

      <section className="deal-band">
        <div className="page-width deal-inner">
          <div className="deal-copy"><div className="eyebrow"><span className="eyebrow-line" /> THE WEEKEND RESET</div><h2>Make room<br />for <em>better.</em></h2><p>Good gear for the spaces, routines, and little rituals that make your day.</p><Link href="/products?category=Home" className="button button-light">Shop home finds <ArrowRight size={16} /></Link></div>
          <div className="deal-art"><img src="https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?auto=format&fit=crop&w=1200&q=85" alt="A considered home interior with warm natural light" loading="lazy" /><div className="deal-art-label"><span>OBJECTS FOR</span><strong>Everyday living</strong><ArrowUpRight size={16} /></div><div className="deal-art-number">04 / 12</div></div>
        </div>
      </section>

      <section className="page-width assistant-promo">
        <div className="assistant-orbit"><div className="orbit-ring orbit-ring-one" /><div className="orbit-ring orbit-ring-two" /><span><Sparkles size={25} /></span></div>
        <div className="assistant-copy"><div className="eyebrow"><span className="eyebrow-line" /> A BETTER WAY TO ASK</div><h2>Not sure what fits?<br /><em>Just describe it.</em></h2><p>Tell our shopping assistant what you have in mind. It searches the live catalog and finds your kind of thing.</p></div>
        <Link href="/assistant" className="button button-primary">Ask the assistant <ArrowUpRight size={16} /></Link>
      </section>

      <footer className="site-footer page-width"><Link href="/" className="brand"><span className="brand-mark"><Sparkles size={16} /></span><span>retail<span className="brand-x">x</span></span></Link><span>Good finds. Fair prices. A smarter way to shop.</span><div><Link href="/admin">Retail operations</Link><span>© RetailX 2026</span></div></footer>
    </main>
  );
}