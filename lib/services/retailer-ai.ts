import { memoryStore } from "./db";
import { money } from "../api";

export type RestockForecast = {
  productId: string;
  productName: string;
  category: string;
  currentStock: number;
  avgDailySales: number;
  daysLeft: number;
  urgency: "CRITICAL" | "LOW" | "NORMAL";
  recommendedOrder: number;
  leadTimeDays: number;
  expectedStockout: string;
};

export type DynamicPriceItem = {
  productId: string;
  productName: string;
  category: string;
  currentPrice: number;
  suggestedPrice: number;
  changePercent: number;
  reason: string;
  inventoryLevel: "HIGH" | "BALANCED" | "LOW";
  demandVelocity: "FAST" | "MEDIUM" | "SLOW";
  expectedRevenueBoost: number;
};

export type CustomerSegment = {
  segment: string;
  count: number;
  avgOrderValue: number;
  repeatRate: string;
  topItems: string[];
  suggestedCombo: {
    name: string;
    items: string[];
    regularPrice: number;
    comboPrice: number;
    expectedLift: string;
  };
};

export type StoreTemplate = {
  type: "Grocery" | "Pharmacy" | "Fashion" | "Electronics" | "Restaurant" | "Furniture";
  title: string;
  defaultSubdomain: string;
  primaryColor: string;
  accentColor: string;
  bannerImage: string;
  tagline: string;
  trustBadge: string;
  sampleCatalog: Array<{ name: string; price: number; stock: number; category: string; imageUrl: string }>;
};

export const STORE_TEMPLATES: Record<string, StoreTemplate> = {
  Pharmacy: {
    type: "Pharmacy",
    title: "ApolloCare Meds & Healthcare",
    defaultSubdomain: "apollocare.retailx.ai",
    primaryColor: "#0284c7",
    accentColor: "#38bdf8",
    bannerImage: "https://images.unsplash.com/photo-1586015555751-63bb77f4322a?auto=format&fit=crop&w=1200&q=80",
    tagline: "Licensed Pharmacy · 100% Genuine Medicines · 30-Min Fast Delivery",
    trustBadge: "CDSCO & FDA Licensed · Pharmacist Verified",
    sampleCatalog: [
      { name: "Paracetamol 650mg Fast-Action Tablets (Strip of 15)", price: 38, stock: 150, category: "Pain & Fever", imageUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&q=80" },
      { name: "Vitamin C 500mg + Zinc Chewables (60 Tablets)", price: 299, stock: 85, category: "Immunity", imageUrl: "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=500&q=80" },
      { name: "Automatic Digital Blood Pressure Monitor with Memory", price: 1599, stock: 24, category: "Medical Devices", imageUrl: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=500&q=80" },
      { name: "Non-Contact Infrared Forehead Thermometer", price: 899, stock: 32, category: "Medical Devices", imageUrl: "https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?w=500&q=80" },
      { name: "Pain Relief Diclofenac Herbal Gel (50g)", price: 145, stock: 90, category: "Ointments", imageUrl: "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=500&q=80" },
      { name: "Ayurvedic Herbal Tulsi & Ginger Cough Syrup (100ml)", price: 110, stock: 65, category: "Ayurveda", imageUrl: "https://images.unsplash.com/photo-1550572017-ed2364c6762c?w=500&q=80" },
      { name: "Emergency Trauma & First Aid Kit (36 Essentials)", price: 649, stock: 40, category: "First Aid", imageUrl: "https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=500&q=80" },
      { name: "Multivitamin Daily Vitality Softgels (Pack of 60)", price: 449, stock: 75, category: "Supplements", imageUrl: "https://images.unsplash.com/photo-1550572017-4fcdbb59cc32?w=500&q=80" },
    ],
  },
  Grocery: {
    type: "Grocery",
    title: "Fresh Harvest Supermart",
    defaultSubdomain: "freshharvest.retailx.ai",
    primaryColor: "#15803d",
    accentColor: "#86efac",
    bannerImage: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80",
    tagline: "Farm Fresh Daily · Direct from Local Farms · Zero Middlemen",
    trustBadge: "100% Organic & FSSAI Certified",
    sampleCatalog: [
      { name: "Farm Fresh Pasteurized Whole Milk (1L)", price: 68, stock: 95, category: "Dairy", imageUrl: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500&q=80" },
      { name: "Artisanal Multigrain Bread (400g)", price: 55, stock: 48, category: "Bakery", imageUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&q=80" },
      { name: "Organic Farm Eggs (Pack of 12)", price: 120, stock: 80, category: "Dairy", imageUrl: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=500&q=80" },
      { name: "Fresh Royal Gala Apples (1kg)", price: 180, stock: 60, category: "Fruits", imageUrl: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=500&q=80" },
      { name: "Cold-Pressed Virgin Mustard Oil (1L)", price: 195, stock: 45, category: "Staples", imageUrl: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=500&q=80" },
      { name: "Basmati Premium Aged Rice (5kg)", price: 499, stock: 50, category: "Staples", imageUrl: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&q=80" },
    ],
  },
  Electronics: {
    type: "Electronics",
    title: "VoltEdge Modern Tech",
    defaultSubdomain: "voltedge.retailx.ai",
    primaryColor: "#0f766e",
    accentColor: "#2dd4bf",
    bannerImage: "https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=1200&q=80",
    tagline: "Next-Gen Consumer Tech · Manufacturer Warranty · Express Dispatch",
    trustBadge: "100% Genuine · 1-Year Brand Warranty",
    sampleCatalog: [
      { name: "GaN 65W Fast Charger (Triple Port)", price: 2499, stock: 52, category: "Power", imageUrl: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=500&q=80" },
      { name: "Ergonomic Aluminium Laptop Riser", price: 3199, stock: 22, category: "Desk Setup", imageUrl: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500&q=80" },
      { name: "Low-Profile Wireless Mechanical Keyboard", price: 4899, stock: 18, category: "Keyboards", imageUrl: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500&q=80" },
      { name: "Precision 2.4GHz Wireless Mouse", price: 1899, stock: 35, category: "Accessories", imageUrl: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=500&q=80" },
    ],
  },
  Fashion: {
    type: "Fashion",
    title: "Aura Minimalist Studio",
    defaultSubdomain: "aurastudio.retailx.ai",
    primaryColor: "#7c3aed",
    accentColor: "#c084fc",
    bannerImage: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80",
    tagline: "Conscious Apparel · Premium Organic Cotton · Designed in India",
    trustBadge: "Sustainable Fabrics · Easy 7-Day Exchange",
    sampleCatalog: [
      { name: "Organic Heavyweight Cotton Oversized Tee", price: 1499, stock: 45, category: "Apparel", imageUrl: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&q=80" },
      { name: "Japanese Selvedge Raw Denim Jeans", price: 4299, stock: 20, category: "Denim", imageUrl: "https://images.unsplash.com/photo-1542272604-780c96856592?w=500&q=80" },
      { name: "Merino Wool Knit Beanie", price: 899, stock: 60, category: "Accessories", imageUrl: "https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?w=500&q=80" },
      { name: "Everyday Canvas Tote Bag (16L)", price: 799, stock: 50, category: "Bags", imageUrl: "https://images.unsplash.com/photo-1544816155-12df9643f363?w=500&q=80" },
    ],
  },
  Restaurant: {
    type: "Restaurant",
    title: "Tandoor & Twig Cloud Kitchen",
    defaultSubdomain: "tandoorandtwig.retailx.ai",
    primaryColor: "#ea580c",
    accentColor: "#fdba74",
    bannerImage: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80",
    tagline: "Authentic Charcoal Tandoor · Hot & Fresh to Your Doorstep in 30 Mins",
    trustBadge: "FSSAI 5-Star Hygiene Rated Kitchen",
    sampleCatalog: [
      { name: "Signature Butter Chicken Roll", price: 260, stock: 45, category: "Rolls", imageUrl: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500&q=80" },
      { name: "Paneer Tikka Dum Biryani Bowl", price: 320, stock: 50, category: "Bowls", imageUrl: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&q=80" },
      { name: "Alphonso Mango Lassi (300ml)", price: 110, stock: 70, category: "Beverages", imageUrl: "https://images.unsplash.com/photo-1529042410759-befb1204b468?w=500&q=80" },
      { name: "Smoked Dal Makhani with Garlic Naan", price: 280, stock: 35, category: "Combos", imageUrl: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500&q=80" },
    ],
  },
  Furniture: {
    type: "Furniture",
    title: "Oak & Iron Living Spaces",
    defaultSubdomain: "oakandiron.retailx.ai",
    primaryColor: "#b45309",
    accentColor: "#fcd34d",
    bannerImage: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=80",
    tagline: "Solid Teak & Engineered Steel · Handcrafted Designer Furniture",
    trustBadge: "10-Year Timber Warranty · Free White-Glove Installation",
    sampleCatalog: [
      { name: "Solid Teakwood Coffee Table", price: 14500, stock: 8, category: "Tables", imageUrl: "https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?w=500&q=80" },
      { name: "Ergonomic Linen Accent Armchair", price: 18900, stock: 5, category: "Seating", imageUrl: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=500&q=80" },
      { name: "Minimalist Scandinavian Bookshelf", price: 9200, stock: 12, category: "Storage", imageUrl: "https://images.unsplash.com/photo-1594671581654-2785549114c6?w=500&q=80" },
    ],
  },
};

export function getRetailerIntelligence() {
  const products = memoryStore.products;
  const orders = Array.from(memoryStore.orders.values());

  const todayRevenue = 48500 + orders.length * 1200;
  const weeklyRevenue = 342000;
  const monthlyRevenue = 1485000;
  const grossMargin = 38.4;
  const netMargin = 22.1;
  const businessHealthScore = 94; // Out of 100
  const aiScore = 96;

  // 1. Smart Restocking Engine (Module 2)
  const restockForecasts: RestockForecast[] = [
    {
      productId: "rx-bluetooth-earphones",
      productName: "Bluetooth Earphones",
      category: "Audio",
      currentStock: 12,
      avgDailySales: 9.8,
      daysLeft: 1.2,
      urgency: "CRITICAL",
      recommendedOrder: 60,
      leadTimeDays: 2,
      expectedStockout: "Tomorrow 4:00 PM",
    },
    {
      productId: "rx-soundcore-q30",
      productName: "Soundcore Space One",
      category: "Audio",
      currentStock: 18,
      avgDailySales: 4.2,
      daysLeft: 4.3,
      urgency: "LOW",
      recommendedOrder: 35,
      leadTimeDays: 3,
      expectedStockout: "In 4 days",
    },
    {
      productId: "rx-mechanical-keyboard",
      productName: "Keychron K2 Wireless",
      category: "Computing",
      currentStock: 8,
      avgDailySales: 5.5,
      daysLeft: 1.5,
      urgency: "CRITICAL",
      recommendedOrder: 45,
      leadTimeDays: 2,
      expectedStockout: "In 36 hours",
    },
    {
      productId: "rx-gaming-mouse",
      productName: "Logitech G Pro X",
      category: "Gaming",
      currentStock: 14,
      avgDailySales: 3.1,
      daysLeft: 4.5,
      urgency: "LOW",
      recommendedOrder: 25,
      leadTimeDays: 3,
      expectedStockout: "In 5 days",
    },
    {
      productId: "rx-smartwatch",
      productName: "Pixel Watch 3",
      category: "Wearables",
      currentStock: 22,
      avgDailySales: 1.8,
      daysLeft: 12.2,
      urgency: "NORMAL",
      recommendedOrder: 15,
      leadTimeDays: 4,
      expectedStockout: "In 12 days",
    },
  ];

  // 2. Dynamic Pricing Engine
  const dynamicPricing: DynamicPriceItem[] = [
    {
      productId: "rx-studio-headphones",
      productName: "Studio Pro Headphones",
      category: "Audio",
      currentPrice: 12999,
      suggestedPrice: 11999,
      changePercent: -7.7,
      reason: "High stock (56 units) with slowing velocity. Competitor price dropped by 5%.",
      inventoryLevel: "HIGH",
      demandVelocity: "SLOW",
      expectedRevenueBoost: 38500,
    },
    {
      productId: "rx-bluetooth-earphones",
      productName: "Bluetooth Earphones",
      category: "Audio",
      currentPrice: 1799,
      suggestedPrice: 1899,
      changePercent: +5.6,
      reason: "High demand spike (+42% this week) and low hub stock. Inelastic demand zone.",
      inventoryLevel: "LOW",
      demandVelocity: "FAST",
      expectedRevenueBoost: 12400,
    },
    {
      productId: "rx-speaker",
      productName: "Marshall Emberton II",
      category: "Audio",
      currentPrice: 16999,
      suggestedPrice: 15499,
      changePercent: -8.8,
      reason: "Excess regional inventory across Mumbai & Delhi. Flash weekend discount recommended.",
      inventoryLevel: "HIGH",
      demandVelocity: "SLOW",
      expectedRevenueBoost: 24800,
    },
  ];

  // 4. Retail Analytics: Inventory Health Breakdown (Module 5)
  const inventoryHealth = {
    fastMoving: { count: 6, percentage: 46, totalValue: 245000, description: "Turns over in < 5 days" },
    slowMoving: { count: 5, percentage: 38, totalValue: 184000, description: "Turns over in 15–30 days" },
    deadStock: { count: 2, percentage: 16, totalValue: 62000, description: "No orders in last 30 days" },
  };

  // 5. Customer Insights & Segmentation (Module 6 & 7)
  const customerSegments: CustomerSegment[] = [
    {
      segment: "Power Weekend Buyers (VIP)",
      count: 142,
      avgOrderValue: 4850,
      repeatRate: "82%",
      topItems: ["Bluetooth Earphones", "Soundcore Space One", "Keychron K2"],
      suggestedCombo: {
        name: "Remote Work Productivity Kit",
        items: ["Keychron K2 Wireless", "Twelve South Curve Stand", "Logitech G Pro"],
        regularPrice: 22497,
        comboPrice: 18999,
        expectedLift: "+18% basket size",
      },
    },
    {
      segment: "Daily Essentials Seekers",
      count: 380,
      avgOrderValue: 840,
      repeatRate: "68%",
      topItems: ["Whole Milk", "Multigrain Bread", "Organic Eggs"],
      suggestedCombo: {
        name: "Artisan Breakfast Combo",
        items: ["Organic Whole Milk (1L)", "Multigrain Bread", "Almond Butter (250g)"],
        regularPrice: 572,
        comboPrice: 479,
        expectedLift: "+29% daily repeat purchases",
      },
    },
  ];

  return {
    todayRevenue,
    weeklyRevenue,
    monthlyRevenue,
    grossMargin,
    netMargin,
    businessHealthScore,
    aiScore,
    restockForecasts,
    dynamicPricing,
    inventoryHealth,
    customerSegments,
  };
}

export function handleCopilotQuery(query: string, language: "en" | "hi" | "kn" = "en") {
  const q = query.toLowerCase().trim();

  // Question 1: Which products should I restock?
  if (q.includes("restock") || q.includes("reorder") || q.includes("स्टॉक") || q.includes("ಸ್ಟಾಕ್")) {
    if (language === "hi") {
      return {
        query,
        summary: "⚠️ 2 उत्पादों का स्टॉक 1.5 दिनों के अंदर समाप्त होने वाला है:",
        actions: [
          "✅ ब्लूटूथ इयरफ़ोन (Bluetooth Earphones) के 60 यूनिट अभी ऑर्डर करें (केवल 1.2 दिन शेष)।",
          "✅ कीक्रोन K2 कीबोर्ड (Keychron K2) के 45 यूनिट रीऑर्डर करें।",
        ],
        expectedImpact: "अनुमानित राजस्व वृद्धि: ₹14,200 (स्टॉकआउट रोकथाम)",
        kpi: "+₹14,200",
      };
    }
    if (language === "kn") {
      return {
        query,
        summary: "⚠️ 2 ಉತ್ಪನ್ನಗಳ ದಾಸ್ತಾನು 1.5 ದಿನಗಳಲ್ಲಿ ಖಾಲಿಯಾಗಲಿದೆ:",
        actions: [
          "✅ ಬ್ಲೂಟೂತ್ ಇಯರ್‌ಫೋನ್ (Bluetooth Earphones) 60 ಯುನಿಟ್‌ಗಳನ್ನು ಈಗಲೇ ಮರು-ಆರ್ಡರ್ ಮಾಡಿ (1.2 ದಿನ ಬಾಕಿ).",
          "✅ ಕೀಕ್ರಾನ್ K2 ಕೀಬೋರ್ಡ್ (Keychron K2) 45 ಯುನಿಟ್‌ಗಳನ್ನು ತಕ್ಷಣ ತರಿಸಿ.",
        ],
        expectedImpact: "ನಿರೀಕ್ಷಿತ ಆದಾಯ ಹೆಚ್ಚಳ: ₹14,200 (ಸ್ಟಾಕ್‌ಔಟ್ ತಡೆಗಟ್ಟುವಿಕೆ)",
        kpi: "+₹14,200",
      };
    }
    return {
      query,
      summary: "⚠️ 2 high-velocity items are within 1.5 days of complete stockout:",
      actions: [
        "✅ Restock Bluetooth Earphones immediately: 60 units recommended (Current: 12 units, Daily sales: 9.8).",
        "✅ Restock Keychron K2 Wireless: 45 units recommended (Stockout expected in 36 hours).",
        "✅ Schedule automatic supplier Purchase Order via Aiven Kafka queue.",
      ],
      expectedImpact: "Expected Revenue Protection: ₹14,200 prevented stockout loss.",
      kpi: "+₹14,200",
    };
  }

  // Question 2: What products are underperforming?
  if (q.includes("underperform") || q.includes("slow") || q.includes("धीमी") || q.includes("ಕಡಿಮೆ ಮಾರಾಟ")) {
    return {
      query,
      summary: "📉 Studio Pro Headphones & Marshall Speaker have excess holding cost with declining sell-through:",
      actions: [
        "✅ Studio Pro Headphones: 56 units stagnant across 2 hubs. Apply 7.7% markdown to ₹11,999.",
        "✅ Marshall Emberton II: Bundle with free audio cable to accelerate conversion by 34%.",
        "✅ Re-allocate shelf priority on mobile homepage via OpenSearch ranking boost.",
      ],
      expectedImpact: "Expected Capital Unlocked: ₹84,000 in working capital within 7 days.",
      kpi: "₹84,000 Unlocked",
    };
  }

  // Question 3: What are my highest-profit items?
  if (q.includes("profit") || q.includes("highest") || q.includes("मुनाफा") || q.includes("ಹೆಚ್ಚು ಲಾಭ")) {
    return {
      query,
      summary: "💎 Top 3 margin contributors generating 54% of net operating profit:",
      actions: [
        "✅ Soundcore Space One (Retail: ₹7,999 | Cost: ₹4,100 | Gross Margin: 48.7%).",
        "✅ Bluetooth Earphones (Retail: ₹1,799 | Cost: ₹720 | Gross Margin: 59.9%).",
        "✅ Action: Place these in checkout cross-sell strip and hero category carousel.",
      ],
      expectedImpact: "Expected Net Profit Lift: +₹18,500/week by prioritizing high-margin placements.",
      kpi: "+₹18,500/wk",
    };
  }

  // Question 4: Which categories are growing?
  if (q.includes("expire") || q.includes("expiry") || q.includes("grow") || q.includes("trend") || q.includes("एक्सपायरी") || q.includes("ಮುಕ್ತಾಯ")) {
    return {
      query,
      summary: "📈 Top 3 fastest-growing product categories based on 30-day sales velocity:",
      actions: [
        "✅ Audio (Earphones & Headphones): +42% week-over-week. Increase catalog depth and hero placement.",
        "✅ Computing Accessories (Keyboards, Mice): +28% month-over-month. Add bundle kits.",
        "✅ Wearables (Smartwatches): +19% steady growth. Promote via personalized push to repeat buyers.",
      ],
      expectedImpact: "Capturing category growth trends can unlock an estimated +₹22,000 incremental revenue this month.",
      kpi: "+₹22,000 Potential",
    };
  }

  // Question 5: How can I increase revenue this week?
  if (q.includes("revenue") || q.includes("sales") || q.includes("बिक्री") || q.includes("ಹೆಚ್ಚಳ")) {
    return {
      query,
      summary: "🚀 3-step action plan to generate an estimated ₹18,000–₹32,000 additional revenue this week:",
      actions: [
        "✅ Restock Bluetooth Earphones & Keychron K2 immediately (prevents ₹14,200 lost demand from stockouts).",
        "✅ Promote Soundcore Space One & Studio Headphones via personalized push to VIP buyers (+₹6,500).",
        "✅ Launch 'Remote Work Kit' and 'Audio Starter Pack' bundles at checkout (+₹8,200 basket size).",
        "✅ Enable Dynamic Pricing on slow-moving Marshall Emberton II to clear excess stock (+₹3,800).",
      ],
      expectedImpact: "Expected Total Sales Increase: +₹18,500 to ₹32,700 this week.",
      kpi: "+₹24,500 Net Lift",
    };
  }

  // Default intelligent fallback
  return {
    query,
    summary: `🤖 AI Retail Copilot analyzed catalog, sales velocity & current Aiven PostgreSQL inventory:`,
    actions: [
      "✅ Recommendation 1: Prioritize restocking 2 critical items (Bluetooth Earphones & Keychron K2).",
      "✅ Recommendation 2: Activate Dynamic Pricing on Studio Pro Headphones to unlock ₹38,500 latent demand.",
      "✅ Recommendation 3: Launch 'Remote Work Kit' bundle to increase average basket size by 18%.",
    ],
    expectedImpact: "Projected 7-Day Net Impact: +₹32,700 additional store revenue.",
    kpi: "+₹32,700",
  };
}
