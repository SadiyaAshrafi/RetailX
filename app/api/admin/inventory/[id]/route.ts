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
      return NextResponse.json({ error: "Stock must be a non-negative whole number (0 or higher)." }, { status: 400 });
    }

    let targetProductId = "";
    let targetCity = "";

    // 1. If ID matches synthetic `inv-${productId}-${city}`
    if (id.startsWith("inv-")) {
      for (const p of memoryStore.products) {
        if (id.startsWith(`inv-${p.id}-`)) {
          targetProductId = p.id;
          targetCity = id.replace(`inv-${p.id}-`, "");
          break;
        }
      }
    }

    // 2. Fallback search in memoryStore
    if (!targetProductId) {
      const match = memoryStore.products.find((p) => id.includes(p.id));
      if (match) {
        targetProductId = match.id;
        for (const c of match.cities) {
          if (id.toLowerCase().endsWith(c.city.toLowerCase())) {
            targetCity = c.city;
            break;
          }
        }
      }
    }

    // 3. Update memoryStore directly
    if (targetProductId) {
      const p = memoryStore.products.find((prod) => prod.id === targetProductId);
      if (p) {
        if (targetCity) {
          const cityEntry = p.cities.find((c) => c.city.toLowerCase() === targetCity.toLowerCase());
          if (cityEntry) {
            cityEntry.stock = stockCount;
          }
        } else if (p.cities.length > 0) {
          p.cities[0].stock = stockCount;
        }
        // Recalculate total product stock
        p.stock = p.cities.reduce((sum, c) => sum + c.stock, 0);

        memoryStore.events.unshift({
          id: randomUUID(),
          eventType: "INVENTORY_UPDATED",
          entityId: p.id,
          topic: "inventory-updated",
          status: "processed",
          occurredAt: new Date().toISOString(),
          receivedAt: new Date().toISOString(),
          payload: { productId: p.id, city: targetCity || "All", stock: stockCount, totalStock: p.stock },
        });
      }
    }

    // 4. Update PostgreSQL if alive
    const pgAlive = await isPostgresAlive();
    if (pgAlive) {
      try {
        const updated = await prisma.inventory.update({
          where: { id },
          data: { stockCount },
          include: { product: true },
        });

        if (updated) {
          // Recalculate total stock in PostgreSQL
          const allInvs = await prisma.inventory.findMany({ where: { productId: updated.productId } });
          const newTotal = allInvs.reduce((sum, i) => sum + i.stockCount, 0);

          // Also keep memoryStore in sync
          const memProd = memoryStore.products.find((p) => p.id === updated.productId);
          if (memProd) {
            const cObj = memProd.cities.find((c) => c.city.toLowerCase() === updated.city.toLowerCase());
            if (cObj) cObj.stock = stockCount;
            memProd.stock = newTotal;
          }

          memoryStore.events.unshift({
            id: randomUUID(),
            eventType: "INVENTORY_UPDATED",
            entityId: updated.productId,
            topic: "inventory-updated",
            status: "processed",
            occurredAt: new Date().toISOString(),
            receivedAt: new Date().toISOString(),
            payload: { productId: updated.productId, city: updated.city, stock: stockCount, totalStock: newTotal },
          });

          return NextResponse.json(updated);
        }
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
