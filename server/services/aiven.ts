import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Client } from "@opensearch-project/opensearch";
import { Kafka } from "kafkajs";
import { PrismaClient } from "@prisma/client";

const databaseUrl = process.env.DATABASE_URL;
if (databaseUrl) {
  const parsedDatabaseUrl = new URL(databaseUrl);
  if (!parsedDatabaseUrl.searchParams.has("connection_limit")) {
    parsedDatabaseUrl.searchParams.set("connection_limit", "5");
    process.env.DATABASE_URL = parsedDatabaseUrl.toString();
  }
}
const kafkaBrokers = process.env.KAFKA_BROKERS?.split(",").map((broker) => broker.trim()).filter(Boolean) ?? [];
const kafkaSaslMechanism = (process.env.KAFKA_SASL_MECHANISM || "SCRAM-SHA-256").toLowerCase();
const kafkaCaPath = process.env.KAFKA_CA_CERT_PATH;
const openSearchNode = process.env.OPENSEARCH_NODE;
const openSearchCaPath = process.env.OPENSEARCH_CA_CERT_PATH;
const openSearchCa = openSearchCaPath && existsSync(resolve(openSearchCaPath))
  ? readFileSync(resolve(openSearchCaPath))
  : undefined;

export const servicesConfigured = {
  postgres: Boolean(databaseUrl),
  kafka: Boolean(kafkaBrokers.length && process.env.KAFKA_USERNAME && process.env.KAFKA_PASSWORD),
  openSearch: Boolean(openSearchNode && process.env.OPENSEARCH_USERNAME && process.env.OPENSEARCH_PASSWORD),
};

export const prisma = new PrismaClient();

function kafkaSasl() {
  const credentials = { username: process.env.KAFKA_USERNAME!, password: process.env.KAFKA_PASSWORD! };
  switch (kafkaSaslMechanism) {
    case "plain": return { mechanism: "plain" as const, ...credentials };
    case "scram-sha-512": return { mechanism: "scram-sha-512" as const, ...credentials };
    case "scram-sha-256": return { mechanism: "scram-sha-256" as const, ...credentials };
    default: throw new Error("KAFKA_SASL_MECHANISM must be PLAIN, SCRAM-SHA-256, or SCRAM-SHA-512.");
  }
}

export const kafka = servicesConfigured.kafka
  ? new Kafka({
      clientId: "retailx-commerce",
      brokers: kafkaBrokers,
      ssl: process.env.KAFKA_SSL === "false"
        ? false
        : {
            rejectUnauthorized: true,
            ...(kafkaCaPath ? { ca: [readFileSync(resolve(kafkaCaPath))] } : {}),
          },
      sasl: kafkaSasl(),
      connectionTimeout: 8000,
      requestTimeout: 10000,
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
        rejectUnauthorized: process.env.OPENSEARCH_TLS_REJECT_UNAUTHORIZED !== "false",
        ...(openSearchCa ? { ca: openSearchCa } : {}),
      },
    })
  : null;

export const productIndex = process.env.OPENSEARCH_INDEX || "products";

export async function ensureProductIndex() {
  if (!searchClient) return;
  const exists = await searchClient.indices.exists({ index: productIndex });
  if (exists.body) return;

  await searchClient.indices.create({
    index: productIndex,
    body: {
      settings: {
        analysis: {
          analyzer: {
            autocomplete: {
              type: "custom",
              tokenizer: "autocomplete_tokenizer",
              filter: ["lowercase"],
            },
          },
          tokenizer: {
            autocomplete_tokenizer: {
              type: "edge_ngram",
              min_gram: 2,
              max_gram: 20,
              token_chars: ["letter", "digit"],
            },
          },
        },
      },
      mappings: {
        properties: {
          productId: { type: "keyword" },
          name: {
            type: "text",
            fields: {
              keyword: { type: "keyword" },
              autocomplete: { type: "text", analyzer: "autocomplete", search_analyzer: "standard" },
            },
          },
          description: { type: "text" },
          category: { type: "keyword" },
          price: { type: "float" },
          rating: { type: "float" },
          popularity: { type: "integer" },
          imageUrl: { type: "keyword", index: false },
          stock: { type: "integer" },
          cities: { type: "keyword" },
          createdAt: { type: "date" },
        },
      },
    },
  });
}