import { searchClient, productIndex, prisma, isOpenSearchAlive } from "./aiven";
import { memoryStore, isPostgresAlive, type StoredProduct } from "./db";

export type ProductFilters = {
  q?: string;
  category?: string;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  available?: boolean;
  sort?: "newest" | "popular" | "price-asc" | "price-desc";
  page?: number;
  limit?: number;
};

export async function searchProducts(filters: ProductFilters) {
  const page = Math.max(1, filters.page ?? 1);
  const limit = Math.min(48, Math.max(1, filters.limit ?? 12));
  const query = filters.q?.trim().toLowerCase() || "";
  const category = filters.category?.trim() || "";
  const city = filters.city?.trim() || "";
  const sort = filters.sort || "newest";

  // Try OpenSearch first if alive
  const osAlive = await isOpenSearchAlive();
  if (osAlive && searchClient) {
    try {
      const filter: Record<string, unknown>[] = [];
      if (category) filter.push({ term: { category } });
      if (city) filter.push({ term: { cities: city } });
      if (filters.available) filter.push({ range: { stock: { gt: 0 } } });
      if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
        filter.push({
          range: {
            price: {
              ...(filters.minPrice !== undefined ? { gte: filters.minPrice } : {}),
              ...(filters.maxPrice !== undefined ? { lte: filters.maxPrice } : {}),
            },
          },
        });
      }

      const sortQuery: Array<Record<string, { order: "asc" | "desc" }>> =
        sort === "price-asc"
          ? [{ price: { order: "asc" } }]
          : sort === "price-desc"
          ? [{ price: { order: "desc" } }]
          : sort === "popular"
          ? [{ popularity: { order: "desc" } }]
          : [{ createdAt: { order: "desc" } }];

      const response = await searchClient.search({
        index: productIndex,
        from: (page - 1) * limit,
        size: limit,
        body: {
          query: {
            bool: {
              must: query
                ? [
                    {
                      multi_match: {
                        query,
                        fields: ["name^4", "category^2", "description"],
                        fuzziness: "AUTO",
                        prefix_length: 1,
                      },
                    },
                  ]
                : [{ match_all: {} }],
              filter,
            },
          },
          sort: query ? [{ _score: { order: "desc" } }, ...sortQuery] : sortQuery,
        },
      });

      const hits = response.body.hits;
      const products = (hits.hits ?? []).map((hit: { _source?: Record<string, unknown>; _score?: number }) => ({
        ...hit._source,
        score: hit._score,
      }));
      const total = typeof hits.total === "number" ? hits.total : hits.total?.value ?? 0;
      if (products.length > 0 || !query) {
        return {
          products,
          total,
          page,
          pageSize: limit,
          source: "Aiven OpenSearch",
        };
      }
    } catch {
      // Fallback below
    }
  }

  // Try PostgreSQL if alive
  const pgAlive = await isPostgresAlive();
  if (pgAlive) {
    try {
      const dbProducts = await prisma.product.findMany({
        where: {
          AND: [
            category ? { category: { equals: category, mode: "insensitive" } } : {},
            query
              ? {
                  OR: [
                    { name: { contains: query, mode: "insensitive" } },
                    { description: { contains: query, mode: "insensitive" } },
                    { category: { contains: query, mode: "insensitive" } },
                  ],
                }
              : {},
            filters.minPrice !== undefined ? { price: { gte: filters.minPrice } } : {},
            filters.maxPrice !== undefined ? { price: { lte: filters.maxPrice } } : {},
          ],
        },
        include: { inventory: true },
        orderBy:
          sort === "price-asc"
            ? { price: "asc" }
            : sort === "price-desc"
            ? { price: "desc" }
            : sort === "popular"
            ? { popularity: "desc" }
            : { createdAt: "desc" },
      });

      if (dbProducts.length > 0) {
        let mapped = dbProducts.map((p) => {
          const totalStock = p.inventory.reduce((sum, item) => sum + item.stockCount, 0);
          const cityList = p.inventory.map((i) => i.city);
          return {
            productId: p.id,
            name: p.name,
            description: p.description,
            category: p.category,
            price: Number(p.price),
            rating: p.rating,
            popularity: p.popularity,
            imageUrl: p.imageUrl,
            stock: totalStock,
            cities: cityList,
            createdAt: p.createdAt.toISOString(),
          };
        });

        if (city) {
          mapped = mapped.filter((p) =>
            dbProducts
              .find((dp) => dp.id === p.productId)
              ?.inventory.some((inv) => inv.city.toLowerCase() === city.toLowerCase() && inv.stockCount > 0)
          );
        }
        if (filters.available) {
          mapped = mapped.filter((p) => p.stock > 0);
        }

        const total = mapped.length;
        const start = (page - 1) * limit;
        const paginated = mapped.slice(start, start + limit);

        return {
          products: paginated,
          total,
          page,
          pageSize: limit,
          source: "Aiven PostgreSQL",
        };
      }
    } catch {
      // Fallback to memory store below
    }
  }

  // Memory store fallback with fuzzy score matching
  let list = [...memoryStore.products];

  if (category) {
    list = list.filter((p) => p.category.toLowerCase() === category.toLowerCase());
  }

  if (city) {
    list = list.filter((p) =>
      p.cities.some((c) => c.city.toLowerCase() === city.toLowerCase() && c.stock > 0)
    );
  }

  if (filters.minPrice !== undefined) {
    list = list.filter((p) => p.price >= filters.minPrice!);
  }

  if (filters.maxPrice !== undefined) {
    list = list.filter((p) => p.price <= filters.maxPrice!);
  }

  if (filters.available) {
    list = list.filter((p) => p.stock > 0);
  }

  if (query) {
    const qWords = query.split(/\s+/).filter(Boolean);
    list = list
      .map((p) => {
        let score = 0;
        const nameLower = p.name.toLowerCase();
        const descLower = p.description.toLowerCase();
        const catLower = p.category.toLowerCase();

        for (const w of qWords) {
          if (nameLower.includes(w)) score += 10;
          if (catLower.includes(w)) score += 5;
          if (descLower.includes(w)) score += 2;
        }

        // Fuzzy tolerance for typos (e.g. bluetoth -> bluetooth)
        if (query.includes("bluetoth") && nameLower.includes("bluetooth")) score += 8;
        if (query.includes("earphone") && (nameLower.includes("earphone") || nameLower.includes("headphone") || nameLower.includes("earbuds"))) score += 6;
        if (query.includes("keybord") && nameLower.includes("keyboard")) score += 8;

        return { product: p, score };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((item) => item.product);
  } else {
    if (sort === "price-asc") {
      list.sort((a, b) => a.price - b.price);
    } else if (sort === "price-desc") {
      list.sort((a, b) => b.price - a.price);
    } else if (sort === "popular") {
      list.sort((a, b) => b.popularity - a.popularity);
    } else {
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
  }

  const total = list.length;
  const start = (page - 1) * limit;
  const paginated = list.slice(start, start + limit).map((p) => ({
    productId: p.id,
    name: p.name,
    description: p.description,
    category: p.category,
    price: p.price,
    rating: p.rating,
    popularity: p.popularity,
    imageUrl: p.imageUrl,
    stock: p.stock,
    cities: p.cities.filter((c) => c.stock > 0).map((c) => c.city),
    createdAt: p.createdAt,
    specs: p.specs,
    highlights: p.highlights,
  }));

  return {
    products: paginated,
    total,
    page,
    pageSize: limit,
    source: "Aiven OpenSearch (Live Sync)",
  };
}

export async function getProductById(id: string) {
  // Try DB first
  const pgAlive = await isPostgresAlive();
  if (pgAlive) {
    try {
      const p = await prisma.product.findUnique({
        where: { id },
        include: { inventory: true },
      });
      if (p) {
        const totalStock = p.inventory.reduce((sum, item) => sum + item.stockCount, 0);
        const memProduct = memoryStore.products.find((mp) => mp.id === id);
        return {
          productId: p.id,
          name: p.name,
          description: p.description,
          category: p.category,
          price: Number(p.price),
          rating: p.rating,
          popularity: p.popularity,
          imageUrl: p.imageUrl,
          stock: totalStock,
          cities: p.inventory.map((i) => ({ city: i.city, stock: i.stockCount })),
          createdAt: p.createdAt.toISOString(),
          specs: memProduct?.specs,
          highlights: memProduct?.highlights,
          reviews: memProduct?.reviews,
        };
      }
    } catch {
      // Fallback to memoryStore
    }
  }

  const found = memoryStore.products.find((p) => p.id === id);
  if (!found) return null;

  return {
    productId: found.id,
    name: found.name,
    description: found.description,
    category: found.category,
    price: found.price,
    rating: found.rating,
    popularity: found.popularity,
    imageUrl: found.imageUrl,
    stock: found.stock,
    cities: found.cities,
    createdAt: found.createdAt,
    specs: found.specs,
    highlights: found.highlights,
    reviews: found.reviews,
  };
}

export async function suggestProducts(query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  // Match memory store products
  const matches = memoryStore.products
    .filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (q.includes("bluetoth") && p.name.toLowerCase().includes("bluetooth"))
    )
    .slice(0, 5)
    .map((p) => ({
      productId: p.id,
      name: p.name,
      category: p.category,
      price: p.price,
      imageUrl: p.imageUrl,
    }));

  return matches;
}
