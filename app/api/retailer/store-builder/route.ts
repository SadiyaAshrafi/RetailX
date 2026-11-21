import { NextRequest, NextResponse } from "next/server";
import { STORE_TEMPLATES, type StoreTemplate } from "@/lib/services/retailer-ai";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ templates: STORE_TEMPLATES });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { businessType, storeName, primaryColor, logoUrl, contactPhone } = body;

    const baseTemplate: StoreTemplate = STORE_TEMPLATES[businessType] || STORE_TEMPLATES.Grocery;
    const cleanSubdomain = (storeName || "mystore")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .substring(0, 20);

    const generatedStore = {
      id: `store-${Date.now().toString(36)}`,
      businessType: businessType || baseTemplate.type,
      storeName: storeName || baseTemplate.title,
      subdomain: `${cleanSubdomain}.retailx.ai`,
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

    return NextResponse.json(generatedStore, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate store" },
      { status: 500 }
    );
  }
}
