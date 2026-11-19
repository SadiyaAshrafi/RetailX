import { NextRequest, NextResponse } from "next/server";
import { isRequestAdminAuthenticated } from "@/lib/services/admin-auth";
import { memoryStore } from "@/lib/services/db";
import { randomUUID } from "node:crypto";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const authenticated = await isRequestAdminAuthenticated(request);
  if (!authenticated) {
    return NextResponse.json({ error: "Admin sign-in is required." }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const type = body.type || "ORDER_CREATED";
  const now = new Date().toISOString();

  const sampleProducts = memoryStore.products;
  const targetProduct = sampleProducts[Math.floor(Math.random() * sampleProducts.length)];
  const randomCity = targetProduct.cities[Math.floor(Math.random() * targetProduct.cities.length)]?.city || "Bengaluru";

  let newEvent;
  if (type === "ORDER_CREATED") {
    const simOrderId = `sim-ord-${Math.random().toString(36).substring(2, 8)}`;
    newEvent = {
      id: randomUUID(),
      eventType: "ORDER_CREATED",
      entityId: simOrderId,
      topic: "order-created",
      status: "processed",
      occurredAt: now,
      receivedAt: now,
      payload: {
        orderId: simOrderId,
        totalAmount: targetProduct.price,
        itemCount: 1,
        product: targetProduct.name,
        city: randomCity,
        simulated: true,
      },
    };
  } else if (type === "INVENTORY_UPDATED") {
    newEvent = {
      id: randomUUID(),
      eventType: "INVENTORY_UPDATED",
      entityId: targetProduct.id,
      topic: "inventory-updated",
      status: "processed",
      occurredAt: now,
      receivedAt: now,
      payload: {
        productId: targetProduct.id,
        city: randomCity,
        stock: targetProduct.stock,
        action: "WAREHOUSE_RESTOCK",
        simulated: true,
      },
    };
  } else {
    newEvent = {
      id: randomUUID(),
      eventType: "SEARCH_SYNCED",
      entityId: targetProduct.id,
      topic: "search-sync",
      status: "processed",
      occurredAt: now,
      receivedAt: now,
      payload: {
        productId: targetProduct.id,
        index: "products",
        latencyMs: 14,
        simulated: true,
      },
    };
  }

  memoryStore.events.unshift(newEvent);
  return NextResponse.json({ success: true, event: newEvent });
}
