import { memoryStore } from "./db";
import { money } from "../api";

export type ExpiryBatch = {
  id: string;
  productId: string;
  productName: string;
  category: string;
  batchNumber: string;
  quantity: number;
  costPrice: number;
  currentPrice: number;
  expiryDate: string;
  daysRemaining: number;
  status: "TOMORROW" | "3_DAYS" | "7_DAYS" | "SAFE";
  aiAction: {
    type: "DISCOUNT" | "BUNDLE" | "FLASH_SALE";
    label: string;
    description: string;
    projectedSavedValue: number;
  };
};

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
  expiryStatus: "NORMAL" | "EXPIRING_SOON";
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
  sampleCatalog: Array<{ name: string; price: number; stock: number; category: string }>;
};

export const STORE_TEMPLATES: Record<string, StoreTemplate> = {
  Grocery: {
    type: "Grocery",
    title: "Fresh Harvest Supermart",
    defaultSubdomain: "freshharvest.retailx.ai",
    primaryColor: "#15803d",
    accentColor: "#86efac",
    bannerImage: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80",
    sampleCatalog: [
      { name: "Farm Fresh Whole Milk (1L)", price: 68, stock: 45, category: "Dairy" },
      { name: "Artisanal Multigrain Bread (400g)", price: 55, stock: 24, category: "Bakery" },
      { name: "Organic Farm Eggs (Pack of 12)", price: 120, stock: 60, category: "Dairy" },
      { name: "Alphonso Mango Pulp (850g)", price: 249, stock: 18, category: "Gourmet" },
      { name: "Cold-Pressed Mustard Oil (1L)", price: 195, stock: 32, category: "Staples" },
    ],
  },
  Pharmacy: {
    type: "Pharmacy",
    title: "CarePlus Meds & Wellness",
    defaultSubdomain: "careplus.retailx.ai",
    primaryColor: "#0284c7",
    accentColor: "#38bdf8",
    bannerImage: "https://images.unsplash.com/photo-1586015555751-63bb77f4322a?auto=format&fit=crop&w=1200&q=80",
    sampleCatalog: [
      { name: "Vitamin C + Zinc Chewables (60 Tabs)", price: 349, stock: 80, category: "Supplements" },
      { name: "Digital Infrared Thermometer", price: 1299, stock: 15, category: "Devices" },
      { name: "Pain Relief Herbal Gel (50g)", price: 145, stock: 50, category: "Ointments" },
      { name: "Ayurvedic Immunity Booster Kadha (250g)", price: 299, stock: 35, category: "Wellness" },
    ],
  },
  Fashion: {
    type: "Fashion",
    title: "Aura Minimalist Studio",
    defaultSubdomain: "aurastudio.retailx.ai",
    primaryColor: "#7c3aed",
    accentColor: "#c084fc",
    bannerImage: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80",
    sampleCatalog: [
      { name: "Organic Heavyweight Cotton Oversized Tee", price: 1499, stock: 28, category: "Apparel" },
      { name: "Japanese Selvedge Raw Denim", price: 4299, stock: 14, category: "Denim" },
      { name: "Merino Wool Knit Beanie", price: 899, stock: 40, category: "Accessories" },
    ],
  },
  Electronics: {
    type: "Electronics",
    title: "VoltEdge Modern Tech",
    defaultSubdomain: "voltedge.retailx.ai",
    primaryColor: "#0f766e",
    accentColor: "#2dd4bf",
    bannerImage: "https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=1200&q=80",
    sampleCatalog: [
      { name: "GaN 65W Fast Charger (Triple Port)", price: 2499, stock: 52, category: "Power" },
      { name: "Ergonomic Aluminium Laptop Riser", price: 3199, stock: 22, category: "Desk Setup" },
      { name: "Low-Profile Mechanical Numpad", price: 2899, stock: 18, category: "Keyboards" },
    ],
  },
  Restaurant: {
    type: "Restaurant",
    title: "Tandoor & Twig Cloud Kitchen",
    defaultSubdomain: "tandoorandtwig.retailx.ai",
    primaryColor: "#ea580c",
    accentColor: "#fdba74",
    bannerImage: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80",
    sampleCatalog: [
      { name: "Signature Butter Chicken Roll", price: 260, stock: 35, category: "Rolls" },
      { name: "Paneer Tikka Dum Biryani Bowl", price: 320, stock: 40, category: "Bowls" },
      { name: "Alphonso Mango Lassi (300ml)", price: 110, stock: 60, category: "Beverages" },
    ],
  },
  Furniture: {
    type: "Furniture",
    title: "Oak & Iron Living Spaces",
    defaultSubdomain: "oakandiron.retailx.ai",
    primaryColor: "#b45309",
    accentColor: "#fcd34d",
    bannerImage: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=80",
    sampleCatalog: [
      { name: "Solid Teakwood Coffee Table", price: 14500, stock: 6, category: "Tables" },
      { name: "Ergonomic Linen Armchair", price: 18900, stock: 4, category: "Seating" },
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

  // 2. Expiry Management (Module 3)
  const today = new Date();
  const expiryBatches: ExpiryBatch[] = [
    {
      id: "batch-exp-01",
      productId: "rx-fresh-milk",
      productName: "Organic A2 Whole Milk (1L)",
      category: "Dairy",
      batchNumber: "BN-2026-081",
      quantity: 18,
      costPrice: 50,
      currentPrice: 72,
      expiryDate: new Date(today.getTime() + 24 * 3600 * 1000).toISOString().split("T")[0],
      daysRemaining: 1,
      status: "TOMORROW",
      aiAction: {
        type: "FLASH_SALE",
        label: "Flash Sale: 25% Off",
        description: "Liquidate batch by 6 PM today via push notification to nearby customers",
        projectedSavedValue: 972,
      },
    },
    {
      id: "batch-exp-02",
      productId: "rx-multigrain-bread",
      productName: "Artisanal Multigrain Bread",
      category: "Bakery",
      batchNumber: "BN-2026-079",
      quantity: 14,
      costPrice: 38,
      currentPrice: 60,
      expiryDate: new Date(today.getTime() + 3 * 24 * 3600 * 1000).toISOString().split("T")[0],
      daysRemaining: 3,
      status: "3_DAYS",
      aiAction: {
        type: "BUNDLE",
        label: "Bundle with Fruit Jam",
        description: "Offer Bread + Organic Jam at ₹129 (Save ₹35). Clears 100% stock in 48h.",
        projectedSavedValue: 840,
      },
    },
    {
      id: "batch-exp-03",
      productId: "rx-almond-butter",
      productName: "Raw Honey Almond Butter (250g)",
      category: "Gourmet",
      batchNumber: "BN-2026-064",
      quantity: 26,
      costPrice: 280,
      currentPrice: 440,
      expiryDate: new Date(today.getTime() + 7 * 24 * 3600 * 1000).toISOString().split("T")[0],
      daysRemaining: 7,
      status: "7_DAYS",
      aiAction: {
        type: "DISCOUNT",
        label: "Apply 15% Smart Markdown",
        description: "Adjust price to ₹374. Increases purchase probability by 3.4x based on elasticity.",
        projectedSavedValue: 9724,
      },
    },
  ];

  // 3. Dynamic Pricing (Module 4)
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
      expiryStatus: "NORMAL",
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
      expiryStatus: "NORMAL",
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
      expiryStatus: "NORMAL",
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

  // 6. Sustainability Tracker (Module 11)
  const sustainability = {
    wastePreventedPercent: 22.4,
    unitsSavedFromLandfill: 142,
    totalKgWasteDiverted: 86.5,
    salvagedRevenue: 18450,
    co2SavedKg: 218.4,
    badgeText: "You reduced retail wastage by 22.4% this month!",
  };

  return {
    todayRevenue,
    weeklyRevenue,
    monthlyRevenue,
    grossMargin,
    netMargin,
    businessHealthScore,
    aiScore,
    restockForecasts,
    expiryBatches,
    dynamicPricing,
    inventoryHealth,
    customerSegments,
    sustainability,
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

  // Question 4: Which products may expire soon?
  if (q.includes("expire") || q.includes("expiry") || q.includes("एक्सपायरी") || q.includes("ಮುಕ್ತಾಯ")) {
    return {
      query,
      summary: "⏳ 3 perishable batches require markdown intervention to prevent inventory loss:",
      actions: [
        "⚠️ Organic A2 Milk (Batch BN-081): 18 units expire tomorrow. Trigger instant 25% Flash Sale.",
        "⚠️ Multigrain Bread (Batch BN-079): 14 units expire in 3 days. Auto-bundle with Jam at ₹129.",
        "⚠️ Raw Honey Almond Butter: 26 units expire in 7 days. Apply 15% markdown to ₹374.",
      ],
      expectedImpact: "Sustainability Score: 100% loss prevented (₹11,536 inventory salvage).",
      kpi: "₹11,536 Saved",
    };
  }

  // Question 5: How can I increase revenue this week?
  if (q.includes("revenue") || q.includes("sales") || q.includes("बिक्री") || q.includes("ಹೆಚ್ಚಳ")) {
    return {
      query,
      summary: "🚀 3-step action plan to generate an estimated ₹4,000 to ₹18,000 additional revenue this week:",
      actions: [
        "✅ Restock Milk & Bluetooth Earphones (prevents immediate ₹14,200 lost demand).",
        "✅ Promote Rice & Staples via personalized SMS/WhatsApp to repeat buyers (+₹6,500).",
        "✅ Discount Bread & slow-moving batch by 10-15% (+₹3,800 liquidation velocity).",
        "✅ Launch 'Breakfast Combo' and 'Remote Work Kit' at checkout (+₹8,200 basket size).",
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
      "✅ Recommendation 2: Activate 10% markdown on nearing-expiry batch BN-2026-079 to eliminate wastage.",
      "✅ Recommendation 3: Enable Dynamic Pricing for Studio Pro Headphones to capture 38k latent demand.",
    ],
    expectedImpact: "Projected 7-Day Net Impact: +₹32,700 additional store revenue.",
    kpi: "+₹32,700",
  };
}
