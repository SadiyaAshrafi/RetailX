import "dotenv/config";
import cors from "cors";
import express from "express";
import { kafka, prisma, searchClient, servicesConfigured } from "./services/aiven";
import { startEventPipeline, isKafkaReady } from "./services/events";
import { adminRouter } from "./routes/admin";
import { catalogRouter } from "./routes/catalog";
import { commerceRouter } from "./routes/commerce";
import { sessionRouter } from "./routes/session";
import { isAdminAuthenticated } from "./services/admin-auth";

const app = express();
const port = Number(process.env.API_PORT || 4000);

app.use(cors({ origin: process.env.CORS_ORIGIN?.split(",") ?? false }));
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", async (_request, response) => {
  let postgres = "not_configured";
  let openSearch = "not_configured";
  if (servicesConfigured.postgres) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      postgres = "connected";
    } catch {
      postgres = "unavailable";
    }
  }
  if (searchClient) {
    try {
      await searchClient.ping();
      openSearch = "connected";
    } catch {
      openSearch = "unavailable";
    }
  }
  response.json({
    services: {
      postgres,
      kafka: !kafka ? "not_configured" : isKafkaReady() ? "connected" : "unavailable",
      openSearch,
    },
    searchIndex: process.env.OPENSEARCH_INDEX || "products",
  });
});

app.use("/api", catalogRouter);
app.use("/api", commerceRouter);
app.use("/api/admin", sessionRouter);
app.use("/api/admin", (request, response, next) => {
  if (isAdminAuthenticated(request)) return next();
  response.status(401).json({ error: "Admin sign-in is required." });
});
app.use("/api/admin", (_request, response, next) => {
  if (!servicesConfigured.postgres) return response.status(503).json({ error: "Aiven PostgreSQL is not configured." });
  next();
});
app.use("/api/admin", adminRouter);

app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
  const message = error instanceof Error ? error.message : "Unexpected server error.";
  const status = message.includes("not configured") ? 503 : 500;
  response.status(status).json({ error: message });
});

app.listen(port, () => {
  console.log(`RetailX API listening on http://localhost:${port}`);
  if (!servicesConfigured.postgres || !servicesConfigured.kafka || !servicesConfigured.openSearch) {
    console.warn("Aiven services are not fully configured. Set credentials in .env to enable commerce flows.");
  }
  void startEventPipeline().catch((error: unknown) => console.error("Aiven Kafka startup failed:", error));
});