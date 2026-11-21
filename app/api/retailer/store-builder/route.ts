import { NextRequest, NextResponse } from "next/server";
import { STORE_TEMPLATES, type StoreTemplate } from "@/lib/services/retailer-ai";

export const dynamic = "force-dynamic";

// Global in-memory store registry
const globalForStores = globalThis as typeof globalThis & {
  generatedStores?: Map<string, any>;
};
if (!globalForStores.generatedStores) {
  globalForStores.generatedStores = new Map();
}
const storeRegistry = globalForStores.generatedStores;

// Pre-populate with default demo store
if (!storeRegistry.has("demotech") && !storeRegistry.has("mystore")) {
  const defaultTemplate = STORE_TEMPLATES.Electronics;
  const initialStore = {
    id: "store-demotech",
    businessType: "Electronics",
    storeName: "VoltEdge Modern Tech",
    subdomain: "voltedge.retailx.ai",
    subdomainSlug: "voltedge",
    previewUrl: "/store/voltedge",
    customDomain: "voltedge.com",
    primaryColor: defaultTemplate.primaryColor,
    accentColor: defaultTemplate.accentColor,
    bannerImage: defaultTemplate.bannerImage,
    logoUrl: "",
    contactPhone: "+91 98765 43210",
    createdAt: new Date().toISOString(),
    features: [
      "✅ Customer Web App (Next.js 15 PWA Ready)",
      "✅ Instant Admin Panel with Real-Time KPIs",
      "✅ Auto-Generated Product Catalog & Image AI",
      "✅ PostgreSQL ACID Order & Billing Database",
      "✅ OpenSearch Sub-Second Search Engine",
      "✅ Real-Time Kafka Dispatch Stream",
      "✅ UPI / QR Code / COD Payment Gateway",
    ],
    catalog: defaultTemplate.sampleCatalog.map((item, index) => ({
      id: `gen-voltedge-${index + 1}`,
      name: item.name,
      price: item.price,
      stock: item.stock,
      category: item.category,
    })),
  };
  storeRegistry.set("voltedge", initialStore);
  storeRegistry.set("demotech", initialStore);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const subdomain = searchParams.get("subdomain");

  if (subdomain) {
    const clean = subdomain.toLowerCase().replace(/[^a-z0-9]/g, "");
    const store = storeRegistry.get(clean);
    if (store) {
      return NextResponse.json(store);
    }

    // Auto-synthesize on-demand if not explicitly created yet
    // Try to guess template from name or default to Electronics
    let guessedType: keyof typeof STORE_TEMPLATES = "Electronics";
    if (clean.includes("fresh") || clean.includes("grocery") || clean.includes("mart") || clean.includes("farm")) {
      guessedType = "Grocery";
    } else if (clean.includes("med") || clean.includes("care") || clean.includes("pharmacy")) {
      guessedType = "Pharmacy";
    } else if (clean.includes("fashion") || clean.includes("wear") || clean.includes("style")) {
      guessedType = "Fashion";
    } else if (clean.includes("food") || clean.includes("kitchen") || clean.includes("cafe")) {
      guessedType = "Restaurant";
    } else if (clean.includes("home") || clean.includes("wood") || clean.includes("furn")) {
      guessedType = "Furniture";
    }

    const template = STORE_TEMPLATES[guessedType] || STORE_TEMPLATES.Electronics;
    const formattedName = clean.charAt(0).toUpperCase() + clean.slice(1);

    const synthesizedStore = {
      id: `store-${clean}`,
      businessType: guessedType,
      storeName: `${formattedName} Store`,
      subdomain: `${clean}.retailx.ai`,
      subdomainSlug: clean,
      previewUrl: `/store/${clean}`,
      customDomain: `${clean}.com`,
      primaryColor: template.primaryColor,
      accentColor: template.accentColor,
      bannerImage: template.bannerImage,
      logoUrl: "",
      contactPhone: "+91 98765 43210",
      createdAt: new Date().toISOString(),
      features: [
        "✅ Customer Web App (Next.js 15 PWA Ready)",
        "✅ Instant Admin Panel with Real-Time KPIs",
        "✅ Auto-Generated Product Catalog & Image AI",
        "✅ PostgreSQL ACID Order & Billing Database",
        "✅ OpenSearch Sub-Second Search Engine",
        "✅ Real-Time Kafka Dispatch Stream",
        "✅ UPI / QR Code / COD Payment Gateway",
      ],
      catalog: template.sampleCatalog.map((item, index) => ({
        id: `gen-${clean}-${index + 1}`,
        name: item.name,
        price: item.price,
        stock: item.stock,
        category: item.category,
      })),
    };

    storeRegistry.set(clean, synthesizedStore);
    return NextResponse.json(synthesizedStore);
  }

  // Return all templates
  return NextResponse.json({ templates: STORE_TEMPLATES });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { businessType, storeName, primaryColor, logoUrl, contactPhone } = body;

    const baseTemplate: StoreTemplate = STORE_TEMPLATES[businessType] || STORE_TEMPLATES.Electronics;
    const cleanSubdomain = (storeName || "mystore")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .substring(0, 20) || "mystore";

    const generatedStore = {
      id: `store-${Date.now().toString(36)}`,
      businessType: businessType || baseTemplate.type,
      storeName: storeName || baseTemplate.title,
      subdomain: `${cleanSubdomain}.retailx.ai`,
      subdomainSlug: cleanSubdomain,
      previewUrl: `/store/${cleanSubdomain}`,
      customDomain: `${cleanSubdomain}.com`,
      primaryColor: primaryColor || baseTemplate.primaryColor,
      accentColor: baseTemplate.accentColor,
      bannerImage: baseTemplate.bannerImage,
      logoUrl: logoUrl || "",
      contactPhone: contactPhone || "+91 98765 43210",
      createdAt: new Date().toISOString(),
      features: [
        "✅ Customer Web App (Next.js 15 PWA Ready)",
        "✅ Instant Admin Panel with Real-Time KPIs",
        "✅ Auto-Generated Product Catalog & Image AI",
        "✅ PostgreSQL ACID Order & Billing Database",
        "✅ OpenSearch Sub-Second Search Engine",
        "✅ Real-Time Kafka Dispatch Stream",
        "✅ UPI / QR Code / COD Payment Gateway",
      ],
      catalog: baseTemplate.sampleCatalog.map((item, index) => ({
        id: `gen-${cleanSubdomain}-${index + 1}`,
        name: item.name,
        price: item.price,
        stock: item.stock,
        category: item.category,
      })),
    };

    // Save to registry
    storeRegistry.set(cleanSubdomain, generatedStore);

    return NextResponse.json(generatedStore, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate store" },
      { status: 500 }
    );
  }
}
