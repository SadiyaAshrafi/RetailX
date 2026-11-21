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

// Pre-populate with templates for direct access
for (const [key, t] of Object.entries(STORE_TEMPLATES)) {
  const slug = t.defaultSubdomain.split(".")[0];
  if (!storeRegistry.has(slug)) {
    storeRegistry.set(slug, {
      id: `store-${slug}`,
      businessType: t.type,
      storeName: t.title,
      subdomain: t.defaultSubdomain,
      subdomainSlug: slug,
      previewUrl: `/store/${slug}`,
      customDomain: `${slug}.com`,
      primaryColor: t.primaryColor,
      accentColor: t.accentColor,
      bannerImage: t.bannerImage,
      tagline: t.tagline,
      trustBadge: t.trustBadge,
      logoUrl: "",
      contactPhone: "+91 98765 43210",
      createdAt: new Date().toISOString(),
      features: [
        "✅ Dedicated Subdomain with SSL Encryption",
        "✅ PostgreSQL ACID Orders & Inventory Database",
        "✅ OpenSearch Sub-Second Product Search",
        "✅ Kafka Real-Time Dispatch Streaming",
        "✅ UPI / Cards / COD Instant Checkout",
      ],
      catalog: t.sampleCatalog.map((item, index) => ({
        id: `gen-${slug}-${index + 1}`,
        name: item.name,
        price: item.price,
        stock: item.stock,
        category: item.category,
        imageUrl: item.imageUrl,
      })),
    });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const subdomain = searchParams.get("subdomain");
  const vertical = searchParams.get("vertical");

  if (subdomain) {
    const clean = subdomain.toLowerCase().replace(/[^a-z0-9]/g, "");
    const existing = storeRegistry.get(clean);
    if (existing) {
      return NextResponse.json(existing);
    }

    // Auto-synthesize on-demand using vertical param or slug keywords
    let matchedType: keyof typeof STORE_TEMPLATES = "Pharmacy";
    if (vertical && vertical in STORE_TEMPLATES) {
      matchedType = vertical as keyof typeof STORE_TEMPLATES;
    } else if (clean.includes("med") || clean.includes("care") || clean.includes("pharmacy") || clean.includes("health") || clean.includes("pill") || clean.includes("cure")) {
      matchedType = "Pharmacy";
    } else if (clean.includes("fresh") || clean.includes("grocery") || clean.includes("mart") || clean.includes("farm") || clean.includes("bazaar")) {
      matchedType = "Grocery";
    } else if (clean.includes("fashion") || clean.includes("wear") || clean.includes("style") || clean.includes("cloth") || clean.includes("aura")) {
      matchedType = "Fashion";
    } else if (clean.includes("tech") || clean.includes("volt") || clean.includes("gadget") || clean.includes("elect")) {
      matchedType = "Electronics";
    } else if (clean.includes("food") || clean.includes("kitchen") || clean.includes("cafe") || clean.includes("dish") || clean.includes("biryani")) {
      matchedType = "Restaurant";
    } else if (clean.includes("home") || clean.includes("wood") || clean.includes("furn") || clean.includes("living")) {
      matchedType = "Furniture";
    }

    const template = STORE_TEMPLATES[matchedType];
    const formattedName = clean.charAt(0).toUpperCase() + clean.slice(1);

    const synthesizedStore = {
      id: `store-${clean}`,
      businessType: template.type,
      storeName: `${formattedName} ${template.type === "Pharmacy" ? "Meds & Healthcare" : template.type}`,
      subdomain: `${clean}.retailx.ai`,
      subdomainSlug: clean,
      previewUrl: `/store/${clean}`,
      customDomain: `${clean}.com`,
      primaryColor: template.primaryColor,
      accentColor: template.accentColor,
      bannerImage: template.bannerImage,
      tagline: template.tagline,
      trustBadge: template.trustBadge,
      logoUrl: "",
      contactPhone: "+91 98765 43210",
      createdAt: new Date().toISOString(),
      features: [
        "✅ Dedicated Subdomain with SSL Encryption",
        "✅ PostgreSQL ACID Orders & Inventory Database",
        "✅ OpenSearch Sub-Second Product Search",
        "✅ Kafka Real-Time Dispatch Streaming",
        "✅ UPI / Cards / COD Instant Checkout",
      ],
      catalog: template.sampleCatalog.map((item, index) => ({
        id: `gen-${clean}-${index + 1}`,
        name: item.name,
        price: item.price,
        stock: item.stock,
        category: item.category,
        imageUrl: item.imageUrl,
      })),
    };

    storeRegistry.set(clean, synthesizedStore);
    return NextResponse.json(synthesizedStore);
  }

  return NextResponse.json({ templates: STORE_TEMPLATES });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { businessType, storeName, primaryColor, logoUrl, contactPhone } = body;

    const baseTemplate: StoreTemplate = STORE_TEMPLATES[businessType] || STORE_TEMPLATES.Pharmacy;
    const cleanSubdomain = (storeName || "mystore")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .substring(0, 20) || "mystore";

    const generatedStore = {
      id: `store-${Date.now().toString(36)}`,
      businessType: baseTemplate.type,
      storeName: storeName || baseTemplate.title,
      subdomain: `${cleanSubdomain}.retailx.ai`,
      subdomainSlug: cleanSubdomain,
      previewUrl: `/store/${cleanSubdomain}?vertical=${baseTemplate.type}`,
      customDomain: `${cleanSubdomain}.com`,
      primaryColor: primaryColor || baseTemplate.primaryColor,
      accentColor: baseTemplate.accentColor,
      bannerImage: baseTemplate.bannerImage,
      tagline: baseTemplate.tagline,
      trustBadge: baseTemplate.trustBadge,
      logoUrl: logoUrl || "",
      contactPhone: contactPhone || "+91 98765 43210",
      createdAt: new Date().toISOString(),
      features: [
        "✅ Dedicated Subdomain with SSL Encryption",
        "✅ PostgreSQL ACID Orders & Inventory Database",
        "✅ OpenSearch Sub-Second Product Search",
        "✅ Kafka Real-Time Dispatch Streaming",
        "✅ UPI / Cards / COD Instant Checkout",
      ],
      catalog: baseTemplate.sampleCatalog.map((item, index) => ({
        id: `gen-${cleanSubdomain}-${index + 1}`,
        name: item.name,
        price: item.price,
        stock: item.stock,
        category: item.category,
        imageUrl: item.imageUrl,
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
