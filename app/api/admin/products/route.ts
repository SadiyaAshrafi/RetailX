import { NextRequest, NextResponse } from "next/server";
import { isRequestAdminAuthenticated } from "@/lib/services/admin-auth";
import { prisma, isPostgresAlive, memoryStore, type StoredProduct } from "@/lib/services/db";
import { randomUUID } from "node:crypto";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authenticated = await isRequestAdminAuthenticated(request);
  if (!authenticated) {
    return NextResponse.json({ error: "Admin sign-in is required." }, { status: 401 });
  }

  const pgAlive = await isPostgresAlive();
  if (pgAlive) {
    try {
      const products = await prisma.product.findMany({
        include: { inventory: true },
        orderBy: { createdAt: "desc" },
      });
      if (products.length > 0) return NextResponse.json(products);
    } catch {
      // Fallback to memoryStore
    }
  }

  const list = memoryStore.products.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    category: p.category,
    price: p.price,
    imageUrl: p.imageUrl,
    rating: p.rating,
    popularity: p.popularity,
    createdAt: p.createdAt,
    inventory: p.cities.map((c) => ({
      id: `inv-${p.id}-${c.city}`,
      productId: p.id,
      city: c.city,
      stockCount: c.stock,
      updatedAt: new Date().toISOString(),
    })),
  }));

  return NextResponse.json(list);
}

export async function POST(request: NextRequest) {
  const authenticated = await isRequestAdminAuthenticated(request);
  if (!authenticated) {
    return NextResponse.json({ error: "Admin sign-in is required." }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { name, description, category, price, imageUrl, rating = 4.5, city = "Bengaluru", stockCount = 10 } = body;

    if (!name || !description || !category || !price || !imageUrl) {
      return NextResponse.json(
        { error: "Complete the product details with a valid image URL and price." },
        { status: 400 }
      );
    }

    const productId = `rx-${name.toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, 30)}-${Math.random().toString(36).substring(2, 5)}`;

    const newProduct: StoredProduct = {
      id: productId,
      name,
      description,
      category,
      price: Number(price),
      rating: Number(rating),
      popularity: 10,
      imageUrl,
      stock: Number(stockCount),
      cities: [
        { city, stock: Number(stockCount) },
        { city: city === "Bengaluru" ? "Mumbai" : "Bengaluru", stock: Math.floor(stockCount * 0.7) },
      ],
      createdAt: new Date().toISOString(),
    };

    memoryStore.products.unshift(newProduct);

    // Record Event
    memoryStore.events.unshift({
      id: randomUUID(),
      eventType: "INVENTORY_UPDATED",
      entityId: productId,
      topic: "inventory-updated",
      status: "processed",
      occurredAt: new Date().toISOString(),
      receivedAt: new Date().toISOString(),
      payload: { productId, city, stock: stockCount, action: "PRODUCT_CREATED" },
    });

    const pgAlive = await isPostgresAlive();
    if (pgAlive) {
      try {
        await prisma.product.create({
          data: {
            id: productId,
            name,
            description,
            category,
            price: Number(price),
            imageUrl,
            rating: Number(rating),
            popularity: 10,
            inventory: {
              create: { city, stockCount: Number(stockCount) },
            },
          },
        });
      } catch {
        // Handled in memory
      }
    }

    return NextResponse.json(newProduct, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create product" },
      { status: 500 }
    );
  }
}
