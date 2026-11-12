import { Router } from "express";
import { z } from "zod";
import { prisma } from "../services/aiven";
import { isKafkaReady } from "../services/events";

export const adminRouter = Router();

const productSchema = z.object({
  name: z.string().min(2),
  description: z.string().min(8),
  category: z.string().min(2),
  price: z.number().positive(),
  imageUrl: z.url(),
  rating: z.number().min(0).max(5),
  city: z.string().min(2).optional(),
  stockCount: z.number().int().min(0).max(100000).optional(),
});

adminRouter.get("/products", async (_request, response, next) => {
  try {
    const products = await prisma.product.findMany({ include: { inventory: true }, orderBy: { createdAt: "desc" } });
    response.json(products);
  } catch (error) {
    next(error);
  }
});

adminRouter.post("/products", async (request, response, next) => {
  try {
    const parsed = productSchema.safeParse(request.body);
    if (!parsed.success) return response.status(400).json({ error: "Complete the product details with a valid image URL and price." });
    const { city = "Bengaluru", stockCount = 0, ...details } = parsed.data;
    const product = await prisma.$transaction(async (transaction) => {
      const created = await transaction.product.create({
        data: { ...details, inventory: { create: { city, stockCount } } },
        include: { inventory: true },
      });
      await transaction.outboxEvent.create({
        data: {
          eventType: "INVENTORY_UPDATED",
          topic: "inventory-updated",
          payload: { productId: created.id, city, stock: stockCount, action: "PRODUCT_CREATED" },
        },
      });
      return created;
    });
    response.status(201).json(product);
  } catch (error) {
    next(error);
  }
});

adminRouter.patch("/products/:id", async (request, response, next) => {
  try {
    const parsed = productSchema.omit({ city: true, stockCount: true }).partial().safeParse(request.body);
    if (!parsed.success || Object.keys(parsed.data ?? {}).length === 0) {
      return response.status(400).json({ error: "Provide at least one valid product detail to update." });
    }
    const product = await prisma.$transaction(async (transaction) => {
      const updated = await transaction.product.update({
        where: { id: request.params.id },
        data: parsed.data,
        include: { inventory: true },
      });
      await transaction.outboxEvent.create({
        data: {
          eventType: "INVENTORY_UPDATED",
          topic: "inventory-updated",
          payload: { productId: updated.id, action: "PRODUCT_UPDATED" },
        },
      });
      return updated;
    });
    response.json(product);
  } catch (error) {
    next(error);
  }
});

adminRouter.get("/overview", async (_request, response, next) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 6);
    weekAgo.setHours(0, 0, 0, 0);
    const [products, orders, todayOrders, revenue, stock, recentOrders, weekOrders] = await Promise.all([
      prisma.product.count(),
      prisma.order.count(),
      prisma.order.count({ where: { createdAt: { gte: startOfToday } } }),
      prisma.order.aggregate({ where: { status: "CONFIRMED" }, _sum: { totalAmount: true } }),
      prisma.inventory.aggregate({ _sum: { stockCount: true } }),
      prisma.order.findMany({ take: 6, orderBy: { createdAt: "desc" }, include: { user: true, items: true } }),
      prisma.order.findMany({ where: { createdAt: { gte: weekAgo } }, select: { createdAt: true, totalAmount: true, status: true } }),
    ]);
    const days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(weekAgo);
      date.setDate(weekAgo.getDate() + index);
      return { date, value: 0, orders: 0 };
    });
    for (const order of weekOrders) {
      const dayIndex = Math.floor((new Date(order.createdAt).setHours(0, 0, 0, 0) - weekAgo.getTime()) / 86400000);
      if (dayIndex >= 0 && dayIndex < days.length) {
        days[dayIndex].orders += 1;
        if (order.status === "CONFIRMED") days[dayIndex].value += Number(order.totalAmount);
      }
    }
    response.json({
      metrics: {
        products,
        orders,
        todayOrders,
        revenue: Number(revenue._sum.totalAmount ?? 0),
        stock: stock._sum.stockCount ?? 0,
      },
      sales: days,
      recentOrders,
    });
  } catch (error) {
    next(error);
  }
});

adminRouter.get("/events", async (_request, response, next) => {
  try {
    const events = await prisma.eventLog.findMany({ take: 50, orderBy: { receivedAt: "desc" } });
    response.json({ events, connected: isKafkaReady() });
  } catch (error) {
    next(error);
  }
});

adminRouter.get("/inventory", async (_request, response, next) => {
  try {
    const inventory = await prisma.inventory.findMany({
      include: { product: true },
      orderBy: [{ city: "asc" }, { product: { name: "asc" } }],
    });
    response.json(inventory);
  } catch (error) {
    next(error);
  }
});

adminRouter.patch("/inventory/:id", async (request, response, next) => {
  try {
    const parsed = z.object({ stockCount: z.number().int().min(0).max(100000) }).safeParse(request.body);
    if (!parsed.success) return response.status(400).json({ error: "Stock must be a non-negative whole number." });
    const inventory = await prisma.$transaction(async (transaction) => {
      const updated = await transaction.inventory.update({
        where: { id: request.params.id },
        data: { stockCount: parsed.data.stockCount },
      });
      await transaction.outboxEvent.create({
        data: {
          eventType: "INVENTORY_UPDATED",
          topic: "inventory-updated",
          payload: { productId: updated.productId, city: updated.city, stock: updated.stockCount },
        },
      });
      return updated;
    });
    response.json(inventory);
  } catch (error) {
    next(error);
  }
});