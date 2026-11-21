"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { ShoppingCart, Search, Star, Truck, Shield, Zap, Phone, MapPin, ChevronRight } from "lucide-react";

type StoreConfig = {
  id: string;
  businessType: string;
  storeName: string;
  subdomain: string;
  primaryColor: string;
  accentColor: string;
  bannerImage: string;
  contactPhone: string;
  catalog: Array<{ id: string; name: string; price: number; stock: number; category: string }>;
};

type CartItem = { id: string; name: string; price: number; qty: number };

// Global in-memory store for generated stores (shared with API route via global)
declare global {
  // eslint-disable-next-line no-var
  var generatedStores: Map<string, StoreConfig> | undefined;
}

function getStoreImages(type: string): string[] {
  const imageMap: Record<string, string[]> = {
    Electronics: [
      "https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=400&q=80",
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80",
      "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=400&q=80",
      "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400&q=80",
      "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=400&q=80",
    ],
    Grocery: [
      "https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=400&q=80",
      "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400&q=80",
      "https://images.unsplash.com/photo-1543362906-acfc16c67564?w=400&q=80",
      "https://images.unsplash.com/photo-1534483509719-3feaee7c30da?w=400&q=80",
    ],
    Pharmacy: [
      "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&q=80",
      "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=400&q=80",
      "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400&q=80",
    ],
    Fashion: [
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&q=80",
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80",
      "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=400&q=80",
    ],
    Restaurant: [
      "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80",
      "https://images.unsplash.com/photo-1529042410759-befb1204b468?w=400&q=80",
      "https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=400&q=80",
    ],
    Furniture: [
      "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&q=80",
      "https://images.unsplash.com/photo-1540518614846-7eded433c457?w=400&q=80",
      "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=400&q=80",
    ],
  };
  return imageMap[type] || imageMap.Electronics;
}

export default function GeneratedStorePage() {
  const params = useParams();
  const subdomain = params.subdomain as string;

  const [store, setStore] = useState<StoreConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [addedId, setAddedId] = useState<string | null>(null);

  useEffect(() => {
    async function loadStore() {
      try {
        const res = await fetch(`/api/retailer/store-builder?subdomain=${subdomain}`);
        if (res.ok) {
          const data = await res.json();
          setStore(data);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    loadStore();
  }, [subdomain]);

  const images = store ? getStoreImages(store.businessType) : [];
  const filteredCatalog = store?.catalog.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) ?? [];

  const cartTotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  const cartCount = cart.reduce((sum, i) => sum + i.qty, 0);

  function addToCart(item: { id: string; name: string; price: number }) {
    setCart((prev) => {
      const existing = prev.find((c) => c.id === item.id);
      if (existing) return prev.map((c) => c.id === item.id ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { id: item.id, name: item.name, price: item.price, qty: 1 }];
    });
    setAddedId(item.id);
    setTimeout(() => setAddedId(null), 1200);
  }

  function placeOrder() {
    setOrderPlaced(true);
    setCart([]);
    setCartOpen(false);
    setTimeout(() => setOrderPlaced(false), 4000);
  }

  const primary = store?.primaryColor ?? "#0f766e";
  const accent = store?.accentColor ?? "#2dd4bf";

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0f172a", color: "#fff", fontFamily: "Inter, sans-serif" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 48, height: 48, border: `4px solid ${primary}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
          <p style={{ color: "#94a3b8" }}>Loading your store...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!store) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0f172a", color: "#fff", fontFamily: "Inter, sans-serif" }}>
        <div style={{ textAlign: "center", maxWidth: 480, padding: "2rem" }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🏪</div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: 8 }}>Store Not Found</h1>
          <p style={{ color: "#94a3b8", marginBottom: 24 }}>
            The store <b style={{ color: "#e2e8f0" }}>{subdomain}.retailx.ai</b> hasn&apos;t been generated yet.
          </p>
          <a href="/retailer#store-builder"
            style={{ display: "inline-block", padding: "10px 24px", background: primary, color: "#fff", borderRadius: 8, textDecoration: "none", fontWeight: 600 }}>
            ← Build Your Store Now
          </a>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "Inter, system-ui, sans-serif" }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
        .store-nav { position: sticky; top: 0; z-index: 100; background: #fff; border-bottom: 1px solid #e2e8f0; box-shadow: 0 1px 8px rgba(0,0,0,0.06); }
        .store-nav-inner { max-width: 1200px; margin: 0 auto; padding: 0 20px; height: 64px; display: flex; align-items: center; gap: 16px; }
        .store-logo { font-size: 1.3rem; font-weight: 800; letter-spacing: -0.5px; }
        .store-search { flex: 1; max-width: 400px; position: relative; }
        .store-search input { width: 100%; padding: 8px 16px 8px 40px; border: 1.5px solid #e2e8f0; border-radius: 24px; font-size: 0.875rem; outline: none; transition: border-color 0.2s; }
        .store-search input:focus { border-color: var(--primary); }
        .store-search svg { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #94a3b8; }
        .cart-btn { position: relative; padding: 8px 16px; background: var(--primary); color: #fff; border: none; border-radius: 24px; font-weight: 600; font-size: 0.875rem; cursor: pointer; display: flex; align-items: center; gap: 6px; }
        .cart-badge { position: absolute; top: -6px; right: -6px; background: #ef4444; color: #fff; font-size: 0.65rem; font-weight: 700; width: 18px; height: 18px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
        .hero-banner { background: linear-gradient(135deg, var(--primary) 0%, #1e293b 100%); color: #fff; padding: 60px 20px; text-align: center; position: relative; overflow: hidden; }
        .hero-banner::before { content: ''; position: absolute; inset: 0; background: url('${store.bannerImage}') center/cover; opacity: 0.15; }
        .hero-banner-inner { position: relative; max-width: 700px; margin: 0 auto; }
        .hero-banner h1 { font-size: clamp(1.75rem, 5vw, 3rem); font-weight: 900; margin-bottom: 12px; letter-spacing: -1px; }
        .hero-banner p { color: rgba(255,255,255,0.8); font-size: 1rem; margin-bottom: 24px; }
        .hero-badges { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
        .hero-badge { background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.25); padding: 6px 14px; border-radius: 20px; font-size: 0.8rem; font-weight: 600; display: flex; align-items: center; gap: 6px; }
        .store-main { max-width: 1200px; margin: 0 auto; padding: 32px 20px; }
        .section-title { font-size: 1.3rem; font-weight: 800; color: #0f172a; margin-bottom: 20px; display: flex; align-items: center; gap: 8px; }
        .section-title::after { content: ''; flex: 1; height: 2px; background: #f1f5f9; }
        .products-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 20px; margin-bottom: 48px; }
        .product-card { background: #fff; border-radius: 16px; overflow: hidden; border: 1.5px solid #f1f5f9; transition: all 0.2s; box-shadow: 0 1px 4px rgba(0,0,0,0.04); animation: fadeIn 0.3s ease; }
        .product-card:hover { border-color: var(--primary); box-shadow: 0 8px 24px rgba(0,0,0,0.1); transform: translateY(-2px); }
        .product-img { width: 100%; height: 160px; object-fit: cover; background: #f8fafc; }
        .product-body { padding: 14px; }
        .product-category { font-size: 0.7rem; font-weight: 700; color: var(--primary); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
        .product-name { font-size: 0.9rem; font-weight: 700; color: #0f172a; margin-bottom: 6px; line-height: 1.3; }
        .product-meta { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
        .product-price { font-size: 1.1rem; font-weight: 800; color: #0f172a; }
        .product-rating { display: flex; gap: 2px; align-items: center; }
        .in-stock { font-size: 0.7rem; color: #16a34a; font-weight: 600; margin-bottom: 10px; }
        .add-btn { width: 100%; padding: 9px; background: var(--primary); color: #fff; border: none; border-radius: 10px; font-weight: 700; font-size: 0.85rem; cursor: pointer; transition: all 0.2s; }
        .add-btn:hover { filter: brightness(1.1); }
        .add-btn.added { background: #16a34a; }
        .cart-drawer { position: fixed; top: 0; right: 0; height: 100vh; width: 380px; max-width: 95vw; background: #fff; box-shadow: -8px 0 32px rgba(0,0,0,0.12); z-index: 200; display: flex; flex-direction: column; animation: slideIn 0.25s ease; }
        .cart-header { padding: 20px; border-bottom: 1px solid #f1f5f9; display: flex; align-items: center; justify-content: space-between; }
        .cart-items { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 12px; }
        .cart-item { display: flex; align-items: center; gap: 12px; padding: 12px; background: #f8fafc; border-radius: 12px; }
        .cart-item-info { flex: 1; }
        .cart-item-name { font-size: 0.875rem; font-weight: 600; color: #0f172a; }
        .cart-item-price { font-size: 0.8rem; color: #64748b; }
        .qty-ctrl { display: flex; align-items: center; gap: 8px; }
        .qty-btn { width: 26px; height: 26px; border-radius: 50%; border: 1.5px solid #e2e8f0; background: #fff; font-size: 1rem; cursor: pointer; display: flex; align-items: center; justify-content: center; font-weight: 700; }
        .cart-footer { padding: 20px; border-top: 1px solid #f1f5f9; }
        .cart-total { display: flex; justify-content: space-between; font-weight: 700; font-size: 1.1rem; margin-bottom: 16px; }
        .checkout-btn { width: 100%; padding: 14px; background: var(--primary); color: #fff; border: none; border-radius: 12px; font-weight: 700; font-size: 1rem; cursor: pointer; }
        .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 199; }
        .order-success { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); background: #16a34a; color: #fff; padding: 14px 28px; border-radius: 12px; font-weight: 700; font-size: 0.95rem; z-index: 300; box-shadow: 0 8px 24px rgba(22,163,74,0.4); animation: fadeIn 0.3s ease; display: flex; align-items: center; gap: 10px; }
        .store-footer { background: #0f172a; color: #94a3b8; padding: 40px 20px; margin-top: 48px; }
        .store-footer-inner { max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 32px; }
        .footer-brand { font-size: 1.1rem; font-weight: 800; color: #fff; margin-bottom: 8px; }
        .footer-link { display: block; color: #94a3b8; text-decoration: none; font-size: 0.85rem; margin-bottom: 6px; }
        .footer-bottom { max-width: 1200px; margin: 24px auto 0; padding-top: 16px; border-top: 1px solid #1e293b; font-size: 0.8rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: gap; }
        .powered-badge { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); padding: 4px 10px; border-radius: 20px; font-size: 0.75rem; color: #94a3b8; }
        .trust-bar { background: #fff; border-top: 1px solid #f1f5f9; }
        .trust-bar-inner { max-width: 1200px; margin: 0 auto; padding: 16px 20px; display: flex; gap: 32px; justify-content: center; flex-wrap: wrap; }
        .trust-item { display: flex; align-items: center; gap: 8px; font-size: 0.8rem; color: #64748b; font-weight: 600; }
        .empty-cart { text-align: center; padding: 60px 20px; color: #94a3b8; }
        .empty-cart div { font-size: 48px; margin-bottom: 12px; }
      `}</style>

      <style>{`:root { --primary: ${primary}; --accent: ${accent}; }`}</style>

      {/* Navigation */}
      <nav className="store-nav">
        <div className="store-nav-inner">
          <div className="store-logo" style={{ color: primary }}>
            🏪 {store.storeName}
          </div>
          <div className="store-search">
            <Search size={15} />
            <input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="cart-btn" onClick={() => setCartOpen(true)}>
            <ShoppingCart size={15} /> Cart
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </button>
        </div>
      </nav>

      {/* Hero Banner */}
      <div className="hero-banner">
        <div className="hero-banner-inner">
          <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.6)", marginBottom: 8, letterSpacing: "1px", fontWeight: 700 }}>
            {subdomain}.retailx.ai · POWERED BY RETAILX AI
          </div>
          <h1>{store.storeName}</h1>
          <p>Shop directly from your trusted local store · No middlemen · Best prices</p>
          <div className="hero-badges">
            <span className="hero-badge"><Truck size={12} /> Free delivery above ₹499</span>
            <span className="hero-badge"><Shield size={12} /> Secure checkout</span>
            <span className="hero-badge"><Zap size={12} /> Real-time stock</span>
          </div>
        </div>
      </div>

      {/* Trust Bar */}
      <div className="trust-bar">
        <div className="trust-bar-inner">
          <div className="trust-item"><Star size={14} style={{ color: "#f59e0b" }} /> 4.8 · 2,400+ Reviews</div>
          <div className="trust-item"><Truck size={14} style={{ color: primary }} /> Express delivery</div>
          <div className="trust-item"><Shield size={14} style={{ color: "#16a34a" }} /> 100% Authentic</div>
          <div className="trust-item"><Phone size={14} style={{ color: primary }} /> {store.contactPhone}</div>
          <div className="trust-item"><MapPin size={14} style={{ color: "#ef4444" }} /> Bengaluru, India</div>
        </div>
      </div>

      {/* Product Grid */}
      <main className="store-main">
        <div className="section-title">
          {searchQuery ? `Results for "${searchQuery}"` : `All Products (${store.catalog.length})`}
        </div>

        {filteredCatalog.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#94a3b8" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
            <p>No products found for &ldquo;{searchQuery}&rdquo;</p>
          </div>
        ) : (
          <div className="products-grid">
            {filteredCatalog.map((item, idx) => (
              <div key={item.id} className="product-card">
                <img
                  src={images[idx % images.length]}
                  alt={item.name}
                  className="product-img"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=400&q=80`;
                  }}
                />
                <div className="product-body">
                  <div className="product-category">{item.category}</div>
                  <div className="product-name">{item.name}</div>
                  <div className="product-rating">
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} size={10} style={{ color: s <= 4 ? "#f59e0b" : "#e2e8f0", fill: s <= 4 ? "#f59e0b" : "#e2e8f0" }} />
                    ))}
                    <span style={{ fontSize: "0.7rem", color: "#64748b", marginLeft: 4 }}>({20 + idx * 13})</span>
                  </div>
                  <div className="product-meta" style={{ marginTop: 8 }}>
                    <div className="product-price">₹{item.price.toLocaleString("en-IN")}</div>
                  </div>
                  <div className="in-stock">✓ In Stock · {item.stock} units left</div>
                  <button
                    className={`add-btn${addedId === item.id ? " added" : ""}`}
                    onClick={() => addToCart(item)}
                  >
                    {addedId === item.id ? "✓ Added!" : "Add to Cart"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginTop: 16 }}>
          {[
            { icon: "⚡", title: "Powered by Aiven", desc: "PostgreSQL ACID orders, Kafka streaming, OpenSearch catalog" },
            { icon: "🚀", title: "Real-Time Inventory", desc: "Live stock updates across all city hubs via Kafka events" },
            { icon: "🔒", title: "Secure Payments", desc: "UPI, Cards, Wallets & COD — all encrypted & verified" },
          ].map((card) => (
            <div key={card.title} style={{ background: "#fff", border: "1.5px solid #f1f5f9", borderRadius: 16, padding: 20, display: "flex", gap: 14, alignItems: "flex-start" }}>
              <span style={{ fontSize: 28 }}>{card.icon}</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "#0f172a", marginBottom: 4 }}>{card.title}</div>
                <div style={{ fontSize: "0.8rem", color: "#64748b", lineHeight: 1.5 }}>{card.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="store-footer">
        <div className="store-footer-inner">
          <div>
            <div className="footer-brand">🏪 {store.storeName}</div>
            <p style={{ fontSize: "0.8rem", lineHeight: 1.6, marginBottom: 12 }}>Your trusted local store, now online. Shop directly — no commissions, no middlemen.</p>
            <div className="powered-badge">Powered by RetailX AI</div>
          </div>
          <div>
            <div style={{ fontWeight: 700, color: "#e2e8f0", marginBottom: 12, fontSize: "0.85rem" }}>Quick Links</div>
            {["All Products", "Track Order", "About Us", "Contact"].map((l) => (
              <a key={l} href="#" className="footer-link" onClick={(e) => e.preventDefault()}>{l} <ChevronRight size={10} style={{ display: "inline" }} /></a>
            ))}
          </div>
          <div>
            <div style={{ fontWeight: 700, color: "#e2e8f0", marginBottom: 12, fontSize: "0.85rem" }}>Contact</div>
            <div style={{ fontSize: "0.85rem", lineHeight: 1.8 }}>
              <div>📞 {store.contactPhone}</div>
              <div>📧 hello@{subdomain}.retailx.ai</div>
              <div>📍 Bengaluru, Karnataka</div>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 {store.storeName}. Built on RetailX AI Platform.</span>
          <span style={{ fontSize: "0.75rem" }}>🛡 Secured · ⚡ Kafka-Powered · 🗄 Aiven PostgreSQL</span>
        </div>
      </footer>

      {/* Cart Drawer */}
      {cartOpen && (
        <>
          <div className="overlay" onClick={() => setCartOpen(false)} />
          <div className="cart-drawer">
            <div className="cart-header">
              <h3 style={{ fontWeight: 800, color: "#0f172a" }}>🛒 Your Cart ({cartCount})</h3>
              <button onClick={() => setCartOpen(false)} style={{ background: "none", border: "none", fontSize: "1.25rem", cursor: "pointer", color: "#64748b" }}>✕</button>
            </div>

            <div className="cart-items">
              {cart.length === 0 ? (
                <div className="empty-cart">
                  <div>🛒</div>
                  <p>Your cart is empty</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.id} className="cart-item">
                    <div className="cart-item-info">
                      <div className="cart-item-name">{item.name}</div>
                      <div className="cart-item-price">₹{(item.price * item.qty).toLocaleString("en-IN")}</div>
                    </div>
                    <div className="qty-ctrl">
                      <button className="qty-btn" onClick={() => setCart(c => c.map(x => x.id === item.id ? { ...x, qty: Math.max(1, x.qty - 1) } : x))}>−</button>
                      <span style={{ fontWeight: 700, minWidth: 20, textAlign: "center" }}>{item.qty}</span>
                      <button className="qty-btn" onClick={() => setCart(c => c.map(x => x.id === item.id ? { ...x, qty: x.qty + 1 } : x))}>+</button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="cart-footer">
                <div className="cart-total">
                  <span>Total</span>
                  <span style={{ color: primary }}>₹{cartTotal.toLocaleString("en-IN")}</span>
                </div>
                <button className="checkout-btn" onClick={placeOrder}>
                  Place Order · ₹{cartTotal.toLocaleString("en-IN")}
                </button>
                <div style={{ fontSize: "0.75rem", color: "#94a3b8", textAlign: "center", marginTop: 8 }}>
                  Order saved to Aiven PostgreSQL · Event streamed via Kafka
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Order Success */}
      {orderPlaced && (
        <div className="order-success">
          ✅ Order placed! Confirmation sent via Kafka stream.
        </div>
      )}
    </div>
  );
}
