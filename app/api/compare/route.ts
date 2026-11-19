import { NextRequest, NextResponse } from "next/server";
import { memoryStore } from "@/lib/services/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const idsParam = searchParams.get("ids") || "";
  const ids = idsParam.split(",").map((id) => id.trim()).filter(Boolean);

  if (ids.length === 0) {
    return NextResponse.json({ products: [] });
  }

  const products = memoryStore.products
    .filter((p) => ids.includes(p.id))
    .map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      price: p.price,
      rating: p.rating,
      popularity: p.popularity,
      imageUrl: p.imageUrl,
      description: p.description,
      stock: p.stock,
      specs: p.specs || {},
      highlights: p.highlights || [],
      cities: p.cities,
    }));

  return NextResponse.json({ products });
}
