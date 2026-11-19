import { PrismaClient } from "@prisma/client";
import { INITIAL_CATALOG, CITIES, type CatalogItem } from "./catalog-data";

// Prisma client singleton for serverless / Next.js
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// In-memory resilient state for zero-downtime demo resilience
export type StoredProduct = CatalogItem & {
  stock: number;
  cities: { city: string; stock: number }[];
  createdAt: string;
};

// Global in-memory cache to ensure state survives across hot-reloads and handles offline fallback
type GlobalStore = {
  products: StoredProduct[];
  carts: Map<string, { id: string; items: { id: string; productId: string; quantity: number }[] }>;
  orders: Map<string, {
    id: string;
    userId: string;
    totalAmount: number;
    status: string;
    shippingAddress: string;
    createdAt: string;
    user: { name: string; email: string; phone?: string };
    items: { productId: string; quantity: number; unitPrice: number; product: { name: string; imageUrl: string } }[];
  }>;
  events: Array<{
    id: string;
    eventType: string;
    entityId: string;
    topic: string;
    status: string;
    occurredAt: string;
    receivedAt: string;
    payload: Record<string, unknown>;
  }>;
};

const globalForStore = globalThis as unknown as { store: GlobalStore | undefined };

if (!globalForStore.store) {
  const products: StoredProduct[] = INITIAL_CATALOG.map((item, position) => {
    const cityStock = CITIES.map((city, cityIndex) => ({
      city,
      stock: Math.max(0, 6 + ((position * 7 + cityIndex * 5) % 18)),
    }));
    return {
      ...item,
      stock: cityStock.reduce((sum, c) => sum + c.stock, 0),
      cities: cityStock,
      createdAt: new Date(Date.now() - position * 3600000 * 24).toISOString(),
    };
  });

  const sampleEvents = [
    {
      id: "evt-init-1",
      eventType: "SEARCH_SYNCED",
      entityId: "rx-bluetooth-earphones",
      topic: "search-sync",
      status: "processed",
      occurredAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      receivedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      payload: { productId: "rx-bluetooth-earphones", index: "products", action: "BOOTSTRAP" },
    },
    {
      id: "evt-init-2",
      eventType: "INVENTORY_UPDATED",
      entityId: "rx-soundcore-q30",
      topic: "inventory-updated",
      status: "processed",
      occurredAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      receivedAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      payload: { productId: "rx-soundcore-q30", city: "Bengaluru", stock: 18 },
    },
    {
      id: "evt-init-3",
      eventType: "ORDER_CREATED",
      entityId: "order-demo-1",
      topic: "order-created",
      status: "processed",
      occurredAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      receivedAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      payload: { orderId: "order-demo-1", totalAmount: 7999, itemCount: 1 },
    },
  ];

  globalForStore.store = {
    products,
    carts: new Map(),
    orders: new Map(),
    events: sampleEvents,
  };
}

export const memoryStore = globalForStore.store;

export async function isPostgresAlive(): Promise<boolean> {
  if (!process.env.DATABASE_URL) return false;
  let timer: NodeJS.Timeout | undefined;
  try {
    const timeoutPromise = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error("DB Timeout")), 2000);
      timer.unref?.();
    });
    await Promise.race([prisma.$queryRaw`SELECT 1`, timeoutPromise]);
    return true;
  } catch {
    return false;
  } finally {
    if (timer) clearTimeout(timer);
  }
}
