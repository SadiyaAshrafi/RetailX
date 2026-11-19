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
    const { stockCount } = body;

    if (typeof stockCount !== "number" || stockCount < 0) {
      return NextResponse.json({ error: "Stock must be a non-negative whole number." }, { status: 400 });
    }

    // Check if ID matches `inv-${productId}-${city}`
    const parts = id.split("-");
    let targetProduct = memoryStore.products.find((p) => id.includes(p.id));
    let targetCity = "";

    if (targetProduct) {
      for (const c of targetProduct.cities) {
        if (id.endsWith(c.city)) {
          targetCity = c.city;
          c.stock = stockCount;
          break;
        }
      }
      targetProduct.stock = targetProduct.cities.reduce((sum, c) => sum + c.stock, 0);

      memoryStore.events.unshift({
        id: randomUUID(),
        eventType: "INVENTORY_UPDATED",
        entityId: targetProduct.id,
        topic: "inventory-updated",
        status: "processed",
        occurredAt: new Date().toISOString(),
        receivedAt: new Date().toISOString(),
        payload: { productId: targetProduct.id, city: targetCity, stock: stockCount },
      });
    }

    const pgAlive = await isPostgresAlive();
    if (pgAlive) {
      try {
        const updated = await prisma.inventory.update({
          where: { id },
          data: { stockCount },
        });
        return NextResponse.json(updated);
      } catch {
        // Fallback
      }
    }

    return NextResponse.json({
      id,
      stockCount,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update inventory" },
      { status: 500 }
    );
  }
}
