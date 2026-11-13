import { Router } from "express";
import type { Response } from "express";
import { z } from "zod";
import { prisma, searchClient, productIndex, servicesConfigured } from "../services/aiven";
import { searchProducts, suggestProducts } from "../services/search";

export const catalogRouter = Router();

function respondCatalogError(response: Response, error: unknown) {
  const message = error instanceof Error ? error.message : "";
  if (message === "Aiven PostgreSQL is not configured." || message === "Aiven OpenSearch is not configured.") {
    return response.status(503).json({ error: message });
  }
  return response.status(503).json({ error: "Product services are unavailable. Check Aiven PostgreSQL, OpenSearch, and the product index." });
}

catalogRouter.get("/products", async (request, response) => {
  try {
    const parsed = z.object({
      q: z.string().optional(),
      category: z.string().optional(),
      city: z.string().optional(),
      minPrice: z.coerce.number().finite().min(0).optional(),
      maxPrice: z.coerce.number().finite().min(0).optional(),
      available: z.enum(["true", "false"]).optional(),
      sort: z.enum(["newest", "popular", "price-asc", "price-desc"]).default("newest"),
      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce.number().int().min(1).max(48).default(12),
    }).safeParse(request.query);
    if (!parsed.success) return response.status(400).json({ error: "Invalid search filters." });
    const result = await searchProducts({
      ...parsed.data,
      available: parsed.data.available === "true",
    });
    response.json(result);
  } catch (error) {
    return respondCatalogError(response, error);
  }
});

catalogRouter.get("/products/:id", async (request, response) => {
  try {
    if (!searchClient) throw new Error("Aiven OpenSearch is not configured.");
    if (!servicesConfigured.postgres) throw new Error("Aiven PostgreSQL is not configured.");
    const result = await searchClient.get({ index: productIndex, id: request.params.id });
    const product = result.body._source as Record<string, unknown>;
    const inventory = await prisma.inventory.findMany({ where: { productId: request.params.id } });
    response.json({
      ...product,
      stock: inventory.reduce((sum, item) => sum + item.stockCount, 0),
      cities: inventory.filter((item) => item.stockCount > 0).map((item) => ({ city: item.city, stock: item.stockCount })),
    });
  } catch (error) {
    return respondCatalogError(response, error);
  }
});

catalogRouter.get("/suggest", async (request, response) => {
  try {
    const parsed = z.string().trim().max(120).safeParse(request.query.q ?? "");
    if (!parsed.success) return response.status(400).json({ error: "Search suggestions are limited to 120 characters." });
    const query = parsed.data;
    response.json({
      suggestions: query.length >= 2 ? await suggestProducts(query) : [],
      source: "Aiven OpenSearch",
    });
  } catch (error) {
    return respondCatalogError(response, error);
  }
});