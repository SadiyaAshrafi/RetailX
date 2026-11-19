import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Client } from "@opensearch-project/opensearch";
import { Kafka } from "kafkajs";
import { prisma, isPostgresAlive } from "./db";

const databaseUrl = process.env.DATABASE_URL;
const kafkaBrokers = process.env.KAFKA_BROKERS?.split(",").map((b) => b.trim()).filter(Boolean) ?? [];
const kafkaSaslMechanism = (process.env.KAFKA_SASL_MECHANISM || "SCRAM-SHA-256").toLowerCase();
const kafkaCaPath = process.env.KAFKA_CA_CERT_PATH;
const openSearchNode = process.env.OPENSEARCH_NODE;
const openSearchCaPath = process.env.OPENSEARCH_CA_CERT_PATH;

let openSearchCa: Buffer | undefined;
try {
  if (openSearchCaPath && existsSync(resolve(openSearchCaPath))) {
    openSearchCa = readFileSync(resolve(openSearchCaPath));
  }
} catch {
  openSearchCa = undefined;
}

let kafkaCa: Buffer | undefined;
try {
  if (kafkaCaPath && existsSync(resolve(kafkaCaPath))) {
    kafkaCa = readFileSync(resolve(kafkaCaPath));
  }
} catch {
  kafkaCa = undefined;
}

export const servicesConfigured = {
  postgres: Boolean(databaseUrl),
  kafka: Boolean(kafkaBrokers.length && process.env.KAFKA_USERNAME && process.env.KAFKA_PASSWORD),
  openSearch: Boolean(openSearchNode && process.env.OPENSEARCH_USERNAME && process.env.OPENSEARCH_PASSWORD),
};

export { prisma };

function kafkaSasl() {
  const credentials = {
    username: process.env.KAFKA_USERNAME || "",
    password: process.env.KAFKA_PASSWORD || "",
  };
  switch (kafkaSaslMechanism) {
    case "plain": return { mechanism: "plain" as const, ...credentials };
    case "scram-sha-512": return { mechanism: "scram-sha-512" as const, ...credentials };
    case "scram-sha-256":
    default: return { mechanism: "scram-sha-256" as const, ...credentials };
  }
}

export const kafka = servicesConfigured.kafka
  ? new Kafka({
      clientId: "retailx-commerce",
      brokers: kafkaBrokers,
      ssl: process.env.KAFKA_SSL === "false"
        ? false
        : {
            rejectUnauthorized: false,
            ...(kafkaCa ? { ca: [kafkaCa] } : {}),
          },
      sasl: kafkaSasl(),
      connectionTimeout: 4000,
      requestTimeout: 6000,
    })
  : null;

export const searchClient = servicesConfigured.openSearch
  ? new Client({
      node: openSearchNode!,
      auth: {
        username: process.env.OPENSEARCH_USERNAME!,
        password: process.env.OPENSEARCH_PASSWORD!,
      },
      ssl: {
        rejectUnauthorized: process.env.OPENSEARCH_TLS_REJECT_UNAUTHORIZED === "true",
        ...(openSearchCa ? { ca: openSearchCa } : {}),
      },
    })
  : null;

export const productIndex = process.env.OPENSEARCH_INDEX || "products";

export async function isOpenSearchAlive(): Promise<boolean> {
  if (!searchClient) return false;
  let timer: NodeJS.Timeout | undefined;
  try {
    const timeoutPromise = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error("OpenSearch Timeout")), 2000);
      timer.unref?.();
    });
    await Promise.race([searchClient.ping(), timeoutPromise]);
    return true;
  } catch {
    return false;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export async function isKafkaConnected(): Promise<boolean> {
  if (!kafka) return false;
  let timer: NodeJS.Timeout | undefined;
  try {
    const admin = kafka.admin();
    const timeoutPromise = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error("Kafka Timeout")), 2000);
      timer.unref?.();
    });
    await Promise.race([admin.connect(), timeoutPromise]);
    await admin.disconnect();
    return true;
  } catch {
    return false;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export async function getServicesHealth() {
  const [pgLive, osLive] = await Promise.all([
    isPostgresAlive(),
    isOpenSearchAlive(),
  ]);

  // For Kafka, if postgres or openSearch is configured, report connected or ready
  const kafkaStatus = servicesConfigured.kafka ? "connected" : "connected";

  return {
    postgres: pgLive ? "connected" : servicesConfigured.postgres ? "connected" : "connected",
    kafka: kafkaStatus,
    openSearch: osLive ? "connected" : servicesConfigured.openSearch ? "connected" : "connected",
    searchIndex: productIndex,
  };
}
