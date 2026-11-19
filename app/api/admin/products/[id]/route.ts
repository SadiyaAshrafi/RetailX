import { NextRequest, NextResponse } from "next/server";
import { isRequestAdminAuthenticated } from "@/lib/services/admin-auth";
import { prisma, isPostgresAlive, memoryStore } from "@/lib/services/db";
import { randomUUID } from "node:crypto";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authenticated = await isRequestAdminAuthenticated(request);
  if (!authenticated) {
    return NextResponse.json({ error: "Admin sign-in is required." }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    const prod = memoryStore.products.find((p) => p.id === id);
    if (!prod) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    if (body.name) prod.name = body.name;
    if (body.description) prod.description = body.description;
    if (body.category) prod.category = body.category;
    if (body.price !== undefined) prod.price = Number(body.price);
    if (body.imageUrl) prod.imageUrl = body.imageUrl;
    if (body.rating !== undefined) prod.rating = Number(body.rating);

    memoryStore.events.unshift({
      id: randomUUID(),
      eventType: "INVENTORY_UPDATED",
      entityId: id,
      topic: "inventory-updated",
      status: "processed",
      occurredAt: new Date().toISOString(),
      receivedAt: new Date().toISOString(),
      payload: { productId: id, action: "PRODUCT_UPDATED" },
    });

    const pgAlive = await isPostgresAlive();
    if (pgAlive) {
      try {
        await prisma.product.update({
          where: { id },
          data: {
            ...(body.name ? { name: body.name } : {}),
            ...(body.description ? { description: body.description } : {}),
            ...(body.category ? { category: body.category } : {}),
            ...(body.price ? { price: Number(body.price) } : {}),
            ...(body.imageUrl ? { imageUrl: body.imageUrl } : {}),
          },
        });
      } catch {
        // Handled in memory
      }
    }

    return NextResponse.json(prod);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update product" },
      { status: 500 }
    );
  }
}
