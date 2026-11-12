import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import type { Consumer, Producer } from "kafkajs";
import { kafka, prisma } from "./aiven";
import { indexProduct } from "./search";

type CommerceEvent = {
  eventId: string;
  eventType: "ORDER_CREATED" | "INVENTORY_UPDATED" | "SEARCH_SYNCED";
  entityId: string;
  occurredAt: string;
  topic?: string;
  payload: Record<string, unknown>;
};

let producer: Producer | null = null;
let consumer: Consumer | null = null;
let pipelineReady = false;

export function isKafkaReady() {
  return pipelineReady;
}

async function publish(topic: string, event: CommerceEvent) {
  if (!producer) throw new Error("Aiven Kafka is not connected.");
  const message = {
    key: event.entityId,
    value: JSON.stringify({ ...event, topic }),
    timestamp: new Date(event.occurredAt).getTime().toString(),
  };
  await producer.send({ topic, messages: [message] });
  if (topic !== "admin-events") {
    await producer.send({ topic: "admin-events", messages: [message] });
  }
}

async function dispatchOutbox() {
  if (!producer) return;
  const events = await prisma.outboxEvent.findMany({
    where: { publishedAt: null },
    orderBy: { createdAt: "asc" },
    take: 25,
  });
  for (const outbox of events) {
    const payload = outbox.payload as Record<string, unknown>;
    const event: CommerceEvent = {
      eventId: outbox.id,
      eventType: outbox.eventType as CommerceEvent["eventType"],
      entityId: String(payload.orderId ?? payload.productId ?? outbox.id),
      occurredAt: outbox.createdAt.toISOString(),
      payload,
    };
    await publish(outbox.topic, event);
    await prisma.outboxEvent.update({
      where: { id: outbox.id },
      data: { publishedAt: new Date() },
    });
  }
}

async function processCreatedOrder(event: CommerceEvent) {
  const orderId = String(event.payload.orderId ?? event.entityId);
  return prisma.$transaction(async (transaction) => {
    const order = await transaction.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order || order.inventoryProcessedAt || order.status !== "PROCESSING") return;

    for (const item of order.items) {
      let remaining = item.quantity;
      const locations = await transaction.inventory.findMany({
        where: { productId: item.productId, stockCount: { gt: 0 } },
        orderBy: { stockCount: "desc" },
      });
      for (const location of locations) {
        if (remaining === 0) break;
        const quantity = Math.min(remaining, location.stockCount);
        const updated = await transaction.inventory.updateMany({
          where: { id: location.id, stockCount: { gte: quantity } },
          data: { stockCount: { decrement: quantity } },
        });
        if (updated.count) remaining -= quantity;
      }
      if (remaining > 0) throw new Error(`Insufficient stock for product ${item.productId}`);
      await transaction.product.update({
        where: { id: item.productId },
        data: { popularity: { increment: item.quantity } },
      });
    }

    await transaction.order.update({
      where: { id: order.id },
      data: { status: "CONFIRMED", inventoryProcessedAt: new Date() },
    });

    for (const productId of new Set(order.items.map((item) => item.productId))) {
      const inventory = await transaction.inventory.findMany({ where: { productId } });
      await transaction.outboxEvent.create({
        data: {
          eventType: "INVENTORY_UPDATED",
          topic: "inventory-updated",
          payload: {
            productId,
            orderId,
            stock: inventory.reduce((sum, item) => sum + item.stockCount, 0),
            cities: inventory.map((item) => ({ city: item.city, stock: item.stockCount })),
          },
        },
      });
    }
  });
}

async function handleMessage(topic: string, event: CommerceEvent) {
  if (topic === "order-created") {
    try {
      await processCreatedOrder(event);
    } catch (error) {
      const orderId = String(event.payload.orderId ?? event.entityId);
      await prisma.order.updateMany({
        where: { id: orderId, status: "PROCESSING" },
        data: { status: "CANCELLED", inventoryProcessedAt: new Date() },
      });
      console.error("Order inventory processing failed:", error);
    }
  }

  if (topic === "inventory-updated") {
    const productId = String(event.payload.productId ?? "");
    if (productId) {
      await indexProduct(productId);
      await publish("search-sync", {
        eventId: randomUUID(),
        eventType: "SEARCH_SYNCED",
        entityId: productId,
        occurredAt: new Date().toISOString(),
        payload: {
          productId,
          ...(event.payload.orderId ? { orderId: event.payload.orderId } : {}),
          index: process.env.OPENSEARCH_INDEX || "products",
        },
      });
    }
  }

  if (topic === "admin-events") {
    await prisma.eventLog.upsert({
      where: { id: event.eventId },
      create: {
        id: event.eventId,
        eventType: event.eventType,
        entityId: event.entityId,
        topic: event.topic ?? topic,
        occurredAt: new Date(event.occurredAt),
        payload: event.payload as Prisma.InputJsonValue,
      },
      update: {},
    });
  }
}

export async function startEventPipeline() {
  if (!kafka) return;
  const admin = kafka.admin();
  await admin.connect();
  await admin.createTopics({
    topics: ["order-created", "inventory-updated", "search-sync", "admin-events"].map((topic) => ({
      topic,
      numPartitions: 1,
      replicationFactor: 1,
    })),
  });
  await admin.disconnect();
  producer = kafka.producer({ allowAutoTopicCreation: false, idempotent: true });
  await producer.connect();
  consumer = kafka.consumer({ groupId: "retailx-commerce-v1" });
  await consumer.connect();
  await consumer.subscribe({ topics: ["order-created", "inventory-updated", "admin-events"], fromBeginning: false });
  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      if (message.value) await handleMessage(topic, JSON.parse(message.value.toString()) as CommerceEvent);
    },
  });
  pipelineReady = true;
  const timer = setInterval(() => {
    void dispatchOutbox().catch((error: unknown) => console.error("Kafka outbox dispatch failed:", error));
  }, 750);
  timer.unref();
}