import { NextRequest, NextResponse } from "next/server";
import { isRequestAdminAuthenticated } from "@/lib/services/admin-auth";
import { prisma, isPostgresAlive, memoryStore } from "@/lib/services/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authenticated = await isRequestAdminAuthenticated(request);
  if (!authenticated) {
    return NextResponse.json({ error: "Admin sign-in is required." }, { status: 401 });
  }

  const pgAlive = await isPostgresAlive();
  if (pgAlive) {
    try {
      const inventory = await prisma.inventory.findMany({
        include: { product: true },
        orderBy: [{ city: "asc" }, { product: { name: "asc" } }],
      });
      if (inventory.length > 0) return NextResponse.json(inventory);
    } catch {
      // Fallback
    }
  }

  const list: Array<{
    id: string;
    productId: string;
    city: string;
    stockCount: number;
    updatedAt: string;
    product: { id: string; name: string; category: string; price: number; imageUrl: string };
  }> = [];

  for (const product of memoryStore.products) {
    for (const city of product.cities) {
      list.push({
        id: `inv-${product.id}-${city.city}`,
        productId: product.id,
        city: city.city,
        stockCount: city.stock,
        updatedAt: new Date().toISOString(),
        product: {
          id: product.id,
          name: product.name,
          category: product.category,
          price: product.price,
          imageUrl: product.imageUrl,
        },
      });
    }
  }

  list.sort((a, b) => a.city.localeCompare(b.city) || a.product.name.localeCompare(b.product.name));
  return NextResponse.json(list);
}
