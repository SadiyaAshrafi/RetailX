import { Router } from "express";
import { z } from "zod";
import { prisma, servicesConfigured } from "../services/aiven";
import { isKafkaReady } from "../services/events";

export const commerceRouter = Router();

commerceRouter.use(["/cart", "/checkout", "/orders"], (_request, response, next) => {
  if (!servicesConfigured.postgres) return response.status(503).json({ error: "Aiven PostgreSQL is not configured." });
  next();
});

const cartItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1).max(25),
});

const checkoutSchema = z.object({
  cartId: z.string().min(1),
  name: z.string().min(2),
  email: z.email(),
  phone: z.string().min(8),
  address: z.string().min(8),
});

const cartInclude = { items: { include: { product: { include: { inventory: true } } } } } as const;

commerceRouter.get("/cart/:cartId", async (request, response, next) => {
  try {
    const cart = await prisma.cart.findUnique({ where: { id: request.params.cartId }, include: cartInclude });
    response.json(cart ?? { id: request.params.cartId, items: [] });
  } catch (error) {
    next(error);
  }
});

commerceRouter.post("/cart/:cartId/items", async (request, response, next) => {
  try {
    const parsed = cartItemSchema.safeParse(request.body);
    if (!parsed.success) return response.status(400).json({ error: "Enter a valid product and quantity." });
    const { productId, quantity } = parsed.data;
    const product = await prisma.product.findUnique({ where: { id: productId }, include: { inventory: true } });
    if (!product) return response.status(404).json({ error: "Product not found." });
    const stock = product.inventory.reduce((sum, item) => sum + item.stockCount, 0);
    const cartId = request.params.cartId;
    const existing = await prisma.cartItem.findUnique({ where: { cartId_productId: { cartId, productId } } });
    if (quantity + (existing?.quantity ?? 0) > stock) {
      return response.status(409).json({ error: "Requested quantity is above current stock." });
    }
    await prisma.cart.upsert({ where: { id: cartId }, create: { id: cartId }, update: {} });
    await prisma.cartItem.upsert({
      where: { cartId_productId: { cartId, productId } },
      create: { cartId, productId, quantity },
      update: { quantity: { increment: quantity } },
    });
    response.status(201).json(await prisma.cart.findUnique({ where: { id: cartId }, include: cartInclude }));
  } catch (error) {
    next(error);
  }
});

commerceRouter.patch("/cart/:cartId/items/:itemId", async (request, response, next) => {
  try {
    const parsed = z.object({ quantity: z.number().int().min(0).max(25) }).safeParse(request.body);
    if (!parsed.success) return response.status(400).json({ error: "Quantity must be between 0 and 25." });
    const item = await prisma.cartItem.findFirst({
      where: { id: request.params.itemId, cartId: request.params.cartId },
      include: { product: { include: { inventory: true } } },
    });
    if (!item) return response.status(404).json({ error: "Cart item not found." });
    const stock = item.product.inventory.reduce((sum, location) => sum + location.stockCount, 0);
    if (parsed.data.quantity > stock) return response.status(409).json({ error: "Requested quantity is above current stock." });
    if (parsed.data.quantity === 0) await prisma.cartItem.delete({ where: { id: item.id } });
    else await prisma.cartItem.update({ where: { id: item.id }, data: { quantity: parsed.data.quantity } });
    response.json(await prisma.cart.findUnique({ where: { id: request.params.cartId }, include: cartInclude }));
  } catch (error) {
    next(error);
  }
});

commerceRouter.post("/checkout", async (request, response, next) => {
  try {
    const parsed = checkoutSchema.safeParse(request.body);
    if (!parsed.success) return response.status(400).json({ error: "Please complete every checkout field." });
    const { cartId, name, email, phone, address } = parsed.data;
    const cart = await prisma.cart.findUnique({ where: { id: cartId }, include: cartInclude });
    if (!cart?.items.length) return response.status(409).json({ error: "Your cart is empty." });
    for (const item of cart.items) {
      const stock = item.product.inventory.reduce((sum, location) => sum + location.stockCount, 0);
      if (item.quantity > stock) return response.status(409).json({ error: `${item.product.name} no longer has enough stock.` });
    }
    const itemSubtotal = cart.items.reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0);
    const totalAmount = itemSubtotal + (itemSubtotal >= 2500 ? 0 : 149);
    const order = await prisma.$transaction(async (transaction) => {
      const user = await transaction.user.upsert({
        where: { email },
        create: { name, email, phone },
        update: { name, phone },
      });
      const createdOrder = await transaction.order.create({
        data: {
          userId: user.id,
          totalAmount,
          shippingAddress: address,
          items: {
            create: cart.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.product.price,
            })),
          },
        },
      });
      await transaction.outboxEvent.create({
        data: {
          eventType: "ORDER_CREATED",
          topic: "order-created",
          payload: { orderId: createdOrder.id, totalAmount, itemCount: cart.items.length },
        },
      });
      await transaction.cartItem.deleteMany({ where: { cartId } });
      return createdOrder;
    });
    response.status(201).json({
      orderId: order.id,
      status: order.status,
      totalAmount,
      services: ["Aiven PostgreSQL", "Aiven Kafka", "Aiven OpenSearch"],
    });
  } catch (error) {
    next(error);
  }
});

commerceRouter.get("/orders/:id", async (request, response, next) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: request.params.id },
      select: {
        id: true,
        status: true,
        totalAmount: true,
        createdAt: true,
        items: { select: { productId: true, quantity: true, unitPrice: true, product: { select: { name: true, imageUrl: true } } } },
      },
    });
    if (!order) return response.status(404).json({ error: "Order not found." });
    response.json(order);
  } catch (error) {
    next(error);
  }
});

commerceRouter.get("/orders/:id/workflow", async (request, response, next) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: request.params.id },
      select: { id: true, status: true, items: { select: { productId: true } } },
    });
    if (!order) return response.status(404).json({ error: "Order not found." });
    const productIds = order.items.map((item) => item.productId);
    const events = await prisma.eventLog.findMany({
      where: { eventType: { in: ["ORDER_CREATED", "INVENTORY_UPDATED", "SEARCH_SYNCED"] } },
      orderBy: { receivedAt: "desc" },
      take: 150,
      select: { eventType: true, entityId: true, occurredAt: true, payload: true },
    });
    const related = events.filter((event) => {
      const payload = event.payload as Record<string, unknown>;
      return payload.orderId === order.id || (event.eventType === "SEARCH_SYNCED" && !payload.orderId && productIds.includes(event.entityId));
    });
    response.json({
      connected: isKafkaReady(),
      status: order.status,
      orderCreated: related.some((event) => event.eventType === "ORDER_CREATED"),
      inventoryUpdated: related.some((event) => event.eventType === "INVENTORY_UPDATED"),
      searchSynced: related.some((event) => event.eventType === "SEARCH_SYNCED"),
    });
  } catch (error) {
    next(error);
  }
});