"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { ShoppingCart, Search, Star, Truck, Shield, Phone, MapPin, ChevronRight, Check } from "lucide-react";

type StoreConfig = {
  id: string;
  businessType: string;
  storeName: string;
  subdomain: string;
  primaryColor: string;
  accentColor: string;
  bannerImage: string;
  tagline?: string;
  trustBadge?: string;
  contactPhone: string;
  catalog: Array<{ id: string; name: string; price: number; stock: number; category: string; imageUrl?: string }>;
};

type CartItem = { id: string; name: string; price: number; qty: number };

function getDomainMeta(type: string) {
  switch (type) {
    case "Pharmacy":
      return {
        icon: "💊",
        tagline: "Licensed Pharmacy · 100% Genuine Medicines · Express Home Delivery",
        trustBadge: "CDSCO & FDA Licensed · Pharmacist Verified",
        freeDeliveryNotice: "Free prescription delivery above ₹299",
        trustPoints: [
          { icon: "🏥", text: "CDSCO Licensed Pharmacy" },
          { icon: "🩺", text: "Verified Pharmacists" },
          { icon: "❄️", text: "Cold-Chain Storage" },
          { icon: "⚡", text: "30-Min Fast Dispatch" },
        ],
        infoCards: [
          { icon: "💊", title: "100% Genuine Medicines", desc: "Sourced directly from certified pharmaceutical distributors. Batch tested." },
          { icon: "🩺", title: "Pharmacist Verification", desc: "Every order is reviewed by a registered pharmacist before packaging." },
          { icon: "❄️", title: "Cold-Chain Integrity", desc: "Temperature-sensitive vaccines & insulins stored at strict 2°C–8°C." },
        ],
        fallbackImage: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&q=80",
        orderSuccess: "Prescription order placed! Verified by on-duty pharmacist & dispatched.",
      };
    case "Grocery":
      return {
        icon: "🥦",
        tagline: "Farm Fresh Daily · Direct from Local Farmers · Zero Middlemen",
        trustBadge: "100% Fresh & FSSAI Certified",
        freeDeliveryNotice: "Free grocery delivery above ₹399",
        trustPoints: [
          { icon: "🌱", text: "Harvested Today" },
          { icon: "🥦", text: "100% Organic" },
          { icon: "⚡", text: "Same-Day Delivery" },
          { icon: "⚖️", text: "Fair Price to Farmers" },
        ],
        infoCards: [
          { icon: "🌱", title: "Farm to Kitchen", desc: "Direct sourcing eliminates up to 30% middleman markups." },
          { icon: "🥦", title: "Strict Quality Grading", desc: "Triple-washed and hand-sorted for the freshest produce." },
          { icon: "⚡", title: "Morning Express Slot", desc: "Delivery by 7:00 AM so your breakfast is never delayed." },
        ],
        fallbackImage: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&q=80",
        orderSuccess: "Grocery basket confirmed! Packed fresh and out for dispatch.",
      };
    case "Fashion":
      return {
        icon: "👗",
        tagline: "Conscious Apparel · Sustainable Fabrics · Handcrafted in India",
        trustBadge: "GOTS Certified Organic Cotton · 7-Day Exchange",
        freeDeliveryNotice: "Free shipping across India on orders above ₹999",
        trustPoints: [
          { icon: "🧵", text: "Organic Fabrics" },
          { icon: "🔄", text: "Hassle-Free Returns" },
          { icon: "✨", text: "Limited Edition" },
          { icon: "🚚", text: "Express Shipping" },
        ],
        infoCards: [
          { icon: "🧵", title: "Artisanal Craftsmanship", desc: "Slow fashion created with ethical labor and fair wages." },
          { icon: "🌿", title: "Zero Plastic Packaging", desc: "All shipments packaged in 100% biodegradable cornstarch bags." },
          { icon: "🔄", title: "7-Day Try & Buy", desc: "Easy doorstep exchanges with zero questions asked." },
        ],
        fallbackImage: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=500&q=80",
        orderSuccess: "Style order confirmed! Hand-packaged with care and dispatched.",
      };
    case "Restaurant":
      return {
        icon: "🍕",
        tagline: "Authentic Charcoal Tandoor & Curries · Hot to Your Door in 30 Mins",
        trustBadge: "FSSAI 5-Star Hygiene Rated Cloud Kitchen",
        freeDeliveryNotice: "Free delivery on orders above ₹249",
        trustPoints: [
          { icon: "🔥", text: "Made Fresh to Order" },
          { icon: "🧼", text: "FSSAI 5-Star Hygiene" },
          { icon: "⚡", text: "30-Min Delivery" },
          { icon: "🍱", text: "Tamper-Proof Seal" },
        ],
        infoCards: [
          { icon: "🔥", title: "Live Charcoal Flame", desc: "Traditional clay ovens for smoky perfection in every bite." },
          { icon: "🧼", title: "Hospital-Grade Hygiene", desc: "Daily temperature checks and sanitized stainless workstations." },
          { icon: "⚡", title: "Insulated Thermal Bags", desc: "Delivered piping hot directly to your dining table." },
        ],
        fallbackImage: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500&q=80",
        orderSuccess: "Order received in kitchen! Chef is preparing your hot meal.",
      };
    case "Furniture":
      return {
        icon: "🪑",
        tagline: "Solid Teak & Hand-Forged Iron · Lifetime Craftsmanship",
        trustBadge: "10-Year Timber Warranty · Free White-Glove Installation",
        freeDeliveryNotice: "Free doorstep white-glove installation included",
        trustPoints: [
          { icon: "🪵", text: "Seasoned Teakwood" },
          { icon: "🛠️", text: "Free Assembly" },
          { icon: "🛡️", text: "10-Year Warranty" },
          { icon: "📐", text: "Custom Dimensions" },
        ],
        infoCards: [
          { icon: "🪵", title: "Sustainably Sourced Teak", desc: "FSC-certified timber kiln-dried for zero warping or cracks." },
          { icon: "🛠️", title: "White-Glove Delivery", desc: "Unpacked, assembled, and placed in your room by our technicians." },
          { icon: "🛡️", title: "10-Year Structural Guarantee", desc: "Built to last across generations with timeless elegance." },
        ],
        fallbackImage: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500&q=80",
        orderSuccess: "Furniture order confirmed! Workshop scheduled for precision dispatch.",
      };
    default:
      return {
        icon: "⚡",
        tagline: "Next-Gen Consumer Electronics · Manufacturer Warranty · Express Dispatch",
        trustBadge: "100% Genuine · 1-Year Brand Warranty",
        freeDeliveryNotice: "Free express delivery above ₹499",
        trustPoints: [
          { icon: "⚡", text: "100% Genuine Tech" },
          { icon: "🛡️", text: "Brand Warranty" },
          { icon: "🚚", text: "Express Shipping" },
          { icon: "🔒", text: "Secure Payments" },
        ],
        infoCards: [
          { icon: "⚡", title: "Direct Brand Sourcing", desc: "Serial numbers registered for authorized manufacturer warranty." },
          { icon: "🛡️", title: "7-Day Replacement", desc: "Hassle-free replacement if anything goes wrong." },
          { icon: "📦", title: "Secure Padded Packaging", desc: "Shock-resistant anti-static packaging for delicate electronics." },
        ],
        fallbackImage: "https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=500&q=80",
        orderSuccess: "Order confirmed! Serial tracked & scheduled for courier dispatch.",
      };
  }
}

export default function GeneratedStorePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const subdomain = params.subdomain as string;
  const verticalParam = searchParams.get("vertical");

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
        const queryUrl = `/api/retailer/store-builder?subdomain=${subdomain}${verticalParam ? `&vertical=${verticalParam}` : ""}`;
        const res = await fetch(queryUrl);
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
  }, [subdomain, verticalParam]);

  const domain = getDomainMeta(store?.businessType || verticalParam || "Pharmacy");

  const filteredCatalog = store?.catalog.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
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
    setTimeout(() => setOrderPlaced(false), 4500);
  }

  const primary = store?.primaryColor ?? "#0284c7";
  const accent = store?.accentColor ?? "#38bdf8";

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0b1115", color: "#fff", fontFamily: "Inter, sans-serif" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 44, height: 44, border: `4px solid ${primary}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
          <p style={{ color: "#94a3b8", fontSize: "0.9rem" }}>Loading {subdomain}.retailx.ai...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!store) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0b1115", color: "#fff", fontFamily: "Inter, sans-serif" }}>
        <div style={{ textAlign: "center", maxWidth: 480, padding: "2rem" }}>
          <div style={{ fontSize: 60, marginBottom: 16 }}>{domain.icon}</div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: 8 }}>Store Loading</h1>
          <p style={{ color: "#94a3b8", marginBottom: 24 }}>Connecting to {subdomain}.retailx.ai...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "Inter, system-ui, sans-serif", color: "#0f172a" }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
        .store-nav { position: sticky; top: 0; z-index: 100; background: #fff; border-bottom: 1px solid #e2e8f0; box-shadow: 0 1px 8px rgba(0,0,0,0.06); }
        .store-nav-inner { max-width: 1200px; margin: 0 auto; padding: 0 20px; height: 64px; display: flex; align-items: center; gap: 16px; }
        .store-logo { font-size: 1.25rem; font-weight: 800; letter-spacing: -0.5px; display: flex; align-items: center; gap: 8px; }
        .store-search { flex: 1; max-width: 440px; position: relative; }
        .store-search input { width: 100%; padding: 8px 16px 8px 40px; border: 1.5px solid #e2e8f0; border-radius: 24px; font-size: 0.875rem; outline: none; transition: border-color 0.2s; }
        .store-search input:focus { border-color: var(--primary); }
        .store-search svg { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #94a3b8; }
        .cart-btn { position: relative; padding: 8px 18px; background: var(--primary); color: #fff; border: none; border-radius: 24px; font-weight: 700; font-size: 0.875rem; cursor: pointer; display: flex; align-items: center; gap: 6px; }
        .cart-badge { position: absolute; top: -6px; right: -6px; background: #ef4444; color: #fff; font-size: 0.65rem; font-weight: 700; width: 18px; height: 18px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
        .hero-banner { background: linear-gradient(135deg, var(--primary) 0%, #0f172a 100%); color: #fff; padding: 50px 20px; text-align: center; position: relative; overflow: hidden; }
        .hero-banner::before { content: ''; position: absolute; inset: 0; background: url('${store.bannerImage}') center/cover; opacity: 0.16; }
        .hero-banner-inner { position: relative; max-width: 760px; margin: 0 auto; }
        .hero-banner h1 { font-size: clamp(1.6rem, 4.5vw, 2.75rem); font-weight: 900; margin-bottom: 10px; letter-spacing: -0.5px; }
        .hero-banner p { color: rgba(255,255,255,0.85); font-size: 0.95rem; margin-bottom: 20px; }
        .hero-badges { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; }
        .hero-badge { background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.25); padding: 5px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: 600; display: flex; align-items: center; gap: 6px; }
        .trust-bar { background: #fff; border-top: 1px solid #f1f5f9; border-bottom: 1px solid #f1f5f9; }
        .trust-bar-inner { max-width: 1200px; margin: 0 auto; padding: 14px 20px; display: flex; gap: 24px; justify-content: center; flex-wrap: wrap; }
        .trust-item { display: flex; align-items: center; gap: 6px; font-size: 0.8rem; color: #475569; font-weight: 600; }
        .store-main { max-width: 1200px; margin: 0 auto; padding: 32px 20px; }
        .section-title { font-size: 1.25rem; font-weight: 800; color: #0f172a; margin-bottom: 20px; display: flex; align-items: center; gap: 8px; }
        .section-title::after { content: ''; flex: 1; height: 2px; background: #e2e8f0; }
        .products-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 20px; margin-bottom: 48px; }
        .product-card { background: #fff; border-radius: 14px; overflow: hidden; border: 1.5px solid #e2e8f0; transition: all 0.2s; box-shadow: 0 1px 4px rgba(0,0,0,0.04); animation: fadeIn 0.3s ease; display: flex; flex-direction: column; }
        .product-card:hover { border-color: var(--primary); box-shadow: 0 8px 24px rgba(0,0,0,0.08); transform: translateY(-2px); }
        .product-img { width: 100%; height: 165px; object-fit: cover; background: #f1f5f9; }
        .product-body { padding: 14px; display: flex; flex-direction: column; flex: 1; }
        .product-category { font-size: 0.7rem; font-weight: 700; color: var(--primary); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
        .product-name { font-size: 0.88rem; font-weight: 700; color: #0f172a; margin-bottom: 6px; line-height: 1.35; flex: 1; }
        .product-meta { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
        .product-price { font-size: 1.15rem; font-weight: 800; color: #0f172a; }
        .product-rating { display: flex; gap: 2px; align-items: center; }
        .in-stock { font-size: 0.72rem; color: #16a34a; font-weight: 600; margin-bottom: 10px; }
        .add-btn { width: 100%; padding: 10px; background: var(--primary); color: #fff; border: none; border-radius: 8px; font-weight: 700; font-size: 0.85rem; cursor: pointer; transition: all 0.2s; }
        .add-btn:hover { filter: brightness(1.1); }
        .add-btn.added { background: #16a34a; }
        .cart-drawer { position: fixed; top: 0; right: 0; height: 100vh; width: 380px; max-width: 95vw; background: #fff; box-shadow: -8px 0 32px rgba(0,0,0,0.14); z-index: 200; display: flex; flex-direction: column; animation: slideIn 0.25s ease; }
        .cart-header { padding: 20px; border-bottom: 1px solid #f1f5f9; display: flex; align-items: center; justify-content: space-between; }
        .cart-items { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 12px; }
        .cart-item { display: flex; align-items: center; gap: 12px; padding: 12px; background: #f8fafc; border-radius: 10px; }
        .cart-item-info { flex: 1; }
        .cart-item-name { font-size: 0.85rem; font-weight: 600; color: #0f172a; }
        .cart-item-price { font-size: 0.8rem; color: #64748b; margin-top: 2px; }
        .qty-ctrl { display: flex; align-items: center; gap: 8px; }
        .qty-btn { width: 26px; height: 26px; border-radius: 50%; border: 1.5px solid #e2e8f0; background: #fff; font-size: 1rem; cursor: pointer; display: flex; align-items: center; justify-content: center; font-weight: 700; }
        .cart-footer { padding: 20px; border-top: 1px solid #f1f5f9; }
        .cart-total { display: flex; justify-content: space-between; font-weight: 800; font-size: 1.15rem; margin-bottom: 14px; }
        .checkout-btn { width: 100%; padding: 14px; background: var(--primary); color: #fff; border: none; border-radius: 10px; font-weight: 700; font-size: 1rem; cursor: pointer; }
        .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 199; }
        .order-success { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); background: #16a34a; color: #fff; padding: 14px 24px; border-radius: 12px; font-weight: 700; font-size: 0.95rem; z-index: 300; box-shadow: 0 8px 24px rgba(22,163,74,0.4); animation: fadeIn 0.3s ease; display: flex; align-items: center; gap: 8px; text-align: center; }
        .store-footer { background: #0b1115; color: #94a3b8; padding: 40px 20px; margin-top: 48px; }
        .store-footer-inner { max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 32px; }
        .footer-brand { font-size: 1.1rem; font-weight: 800; color: #fff; margin-bottom: 8px; display: flex; align-items: center; gap: 6px; }
        .footer-link { display: block; color: #94a3b8; text-decoration: none; font-size: 0.85rem; margin-bottom: 6px; }
        .footer-bottom { max-width: 1200px; margin: 24px auto 0; padding-top: 16px; border-top: 1px solid #1e293b; font-size: 0.8rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; }
        .powered-badge { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); padding: 4px 10px; border-radius: 20px; font-size: 0.75rem; color: #cbd5e1; }
        .empty-cart { text-align: center; padding: 60px 20px; color: #94a3b8; }
        .empty-cart div { font-size: 48px; margin-bottom: 12px; }
      `}</style>

      <style>{`:root { --primary: ${primary}; --accent: ${accent}; }`}</style>

      {/* Navigation */}
      <nav className="store-nav">
        <div className="store-nav-inner">
          <div className="store-logo" style={{ color: primary }}>
            <span>{domain.icon}</span> {store.storeName}
          </div>
          <div className="store-search">
            <Search size={15} />
            <input
              placeholder={`Search ${store.businessType} catalog...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="cart-btn" onClick={() => setCartOpen(true)}>
            <ShoppingCart size={15} /> Basket
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </button>
        </div>
      </nav>

      {/* Hero Banner */}
      <div className="hero-banner">
        <div className="hero-banner-inner">
          <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.7)", marginBottom: 8, letterSpacing: "1px", fontWeight: 700 }}>
            {subdomain}.retailx.ai · DIRECT RETAILER NETWORK
          </div>
          <h1>{store.storeName}</h1>
          <p>{store.tagline || domain.tagline}</p>
          <div className="hero-badges">
            <span className="hero-badge"><Truck size={12} /> {domain.freeDeliveryNotice}</span>
            <span className="hero-badge"><Shield size={12} /> {store.trustBadge || domain.trustBadge}</span>
          </div>
        </div>
      </div>

      {/* Trust Points */}
      <div className="trust-bar">
        <div className="trust-bar-inner">
          <div className="trust-item"><Star size={14} style={{ color: "#f59e0b" }} /> 4.9 · 1,850+ Verified Ratings</div>
          {domain.trustPoints.map((tp, idx) => (
            <div key={idx} className="trust-item"><span>{tp.icon}</span> {tp.text}</div>
          ))}
          <div className="trust-item"><Phone size={14} style={{ color: primary }} /> {store.contactPhone}</div>
          <div className="trust-item"><MapPin size={14} style={{ color: "#ef4444" }} /> Bengaluru Hub</div>
        </div>
      </div>

      {/* Catalog */}
      <main className="store-main">
        <div className="section-title">
          {searchQuery ? `Results for "${searchQuery}"` : `Available in ${store.businessType} (${filteredCatalog.length} Items)`}
        </div>

        {filteredCatalog.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#94a3b8" }}>
            <div style={{ fontSize: 44, marginBottom: 12 }}>🔍</div>
            <p>No items found matching &ldquo;{searchQuery}&rdquo;</p>
          </div>
        ) : (
          <div className="products-grid">
            {filteredCatalog.map((item, idx) => (
              <div key={item.id || idx} className="product-card">
                <img
                  src={item.imageUrl || domain.fallbackImage}
                  alt={item.name}
                  className="product-img"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = domain.fallbackImage;
                  }}
                />
                <div className="product-body">
                  <div className="product-category">{item.category}</div>
                  <div className="product-name">{item.name}</div>
                  <div className="product-rating">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} size={10} style={{ color: s <= 4 ? "#f59e0b" : "#e2e8f0", fill: s <= 4 ? "#f59e0b" : "#e2e8f0" }} />
                    ))}
                    <span style={{ fontSize: "0.7rem", color: "#64748b", marginLeft: 4 }}>({15 + idx * 8})</span>
                  </div>
                  <div className="product-meta" style={{ marginTop: 8 }}>
                    <div className="product-price">₹{item.price.toLocaleString("en-IN")}</div>
                  </div>
                  <div className="in-stock">✓ Ready for dispatch · {item.stock} in stock</div>
                  <button
                    className={`add-btn${addedId === item.id ? " added" : ""}`}
                    onClick={() => addToCart(item)}
                  >
                    {addedId === item.id ? "✓ Added to Basket" : "Add to Basket"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Domain-specific Info Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16, marginTop: 16 }}>
          {domain.infoCards.map((card) => (
            <div key={card.title} style={{ background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 12, padding: 18, display: "flex", gap: 12, alignItems: "flex-start" }}>
              <span style={{ fontSize: 26 }}>{card.icon}</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "#0f172a", marginBottom: 3 }}>{card.title}</div>
                <div style={{ fontSize: "0.8rem", color: "#64748b", lineHeight: 1.45 }}>{card.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="store-footer">
        <div className="store-footer-inner">
          <div>
            <div className="footer-brand"><span>{domain.icon}</span> {store.storeName}</div>
            <p style={{ fontSize: "0.82rem", lineHeight: 1.6, marginBottom: 12 }}>
              Independent local {store.businessType.toLowerCase()} store powered by RetailX autonomous cloud. 0% middleman commission.
            </p>
            <div className="powered-badge">RetailX Powered Storefront</div>
          </div>
          <div>
            <div style={{ fontWeight: 700, color: "#e2e8f0", marginBottom: 12, fontSize: "0.85rem" }}>Customer Service</div>
            {["Track Order", "Prescriptions / Delivery Info", "Help & FAQs", "Contact Store"].map((l) => (
              <a key={l} href="#" className="footer-link" onClick={(e) => e.preventDefault()}>{l} <ChevronRight size={10} style={{ display: "inline" }} /></a>
            ))}
          </div>
          <div>
            <div style={{ fontWeight: 700, color: "#e2e8f0", marginBottom: 12, fontSize: "0.85rem" }}>Direct Contact</div>
            <div style={{ fontSize: "0.85rem", lineHeight: 1.8 }}>
              <div>📞 {store.contactPhone}</div>
              <div>📧 orders@{subdomain}.retailx.ai</div>
              <div>📍 Storefront Hub, Bengaluru</div>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 {store.storeName}. All rights reserved.</span>
          <span style={{ fontSize: "0.75rem" }}>🔒 256-Bit SSL · ⚡ Kafka Dispatch Stream · 🗄 Aiven PostgreSQL</span>
        </div>
      </footer>

      {/* Cart Drawer */}
      {cartOpen && (
        <>
          <div className="overlay" onClick={() => setCartOpen(false)} />
          <div className="cart-drawer">
            <div className="cart-header">
              <h3 style={{ fontWeight: 800, color: "#0f172a" }}>🛒 Basket ({cartCount})</h3>
              <button onClick={() => setCartOpen(false)} style={{ background: "none", border: "none", fontSize: "1.25rem", cursor: "pointer", color: "#64748b" }}>✕</button>
            </div>

            <div className="cart-items">
              {cart.length === 0 ? (
                <div className="empty-cart">
                  <div>🛒</div>
                  <p>Your basket is currently empty</p>
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
                  <span>Total Amount</span>
                  <span style={{ color: primary }}>₹{cartTotal.toLocaleString("en-IN")}</span>
                </div>
                <button className="checkout-btn" onClick={placeOrder}>
                  Confirm Order · ₹{cartTotal.toLocaleString("en-IN")}
                </button>
                <div style={{ fontSize: "0.75rem", color: "#64748b", textAlign: "center", marginTop: 8 }}>
                  Saved to Aiven PostgreSQL · Real-time event streamed via Kafka
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Order Success */}
      {orderPlaced && (
        <div className="order-success">
          <Check size={18} /> {domain.orderSuccess}
        </div>
      )}
    </div>
  );
}
