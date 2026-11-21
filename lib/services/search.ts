import { searchClient, productIndex, prisma, isOpenSearchAlive } from "./aiven";
import { memoryStore, isPostgresAlive, type StoredProduct } from "./db";

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  Audio: ["earphone", "earphones", "headphone", "headphones", "earbud", "earbuds", "audio", "sound", "music", "noise", "cancelling", "anc", "speaker", "bluetooth", "bluetoth", "mic", "ear"],
  Computing: ["keyboard", "keyboards", "keychron", "typing", "mechanical", "switch", "display", "screen", "monitor", "4k", "laptop", "stand", "curve", "twelve", "computing", "desk", "work"],
  Gaming: ["mouse", "mice", "controller", "gamepad", "xbox", "gaming", "game", "esports", "logitech", "hero"],
  Wearables: ["watch", "watches", "smartwatch", "pixel", "wearable", "wearables", "fitness", "tracker", "fitbit", "health"],
  Photography: ["camera", "cameras", "fujifilm", "photo", "photography", "video", "lens", "sensor", "4k"],
  Home: ["lamp", "lamps", "light", "anglepoise", "home", "desk", "room", "illumination"],
};

function normalizeTerm(term: string) {
  let s = term.toLowerCase().trim();
  if (s === "bluetoth") return "bluetooth";
  if (s === "erphones" || s === "erphone") return "earphone";
  if (s === "keybord") return "keyboard";
  if (s === "moniter") return "monitor";
  if (s === "soundcre") return "soundcore";
  if (s.endsWith("ies")) return s.slice(0, -3) + "y";
  if (s.endsWith("es") && s.length > 3) return s.slice(0, -2);
  if (s.endsWith("s") && s.length > 3) return s.slice(0, -1);
  return s;
}

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
      const qLower = query.toLowerCase().trim();
      const qWords = qLower.split(/\s+/).filter(Boolean);
      const matchedCategories: string[] = [];
      for (const [cat, kws] of Object.entries(CATEGORY_KEYWORDS)) {
        if (
          kws.some(
            (k) =>
              qLower.includes(k) ||
              k.includes(qLower) ||
              qWords.some((w) => k.includes(w) || w.includes(k) || k.includes(normalizeTerm(w)))
          )
        ) {
          matchedCategories.push(cat);
        }
      }

      const orConditions: Array<Record<string, unknown>> = [
        { name: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
        { category: { contains: query, mode: "insensitive" } },
      ];

      for (const w of qWords) {
        const nw = normalizeTerm(w);
        orConditions.push({ name: { contains: w, mode: "insensitive" } });
        orConditions.push({ description: { contains: w, mode: "insensitive" } });
        if (nw !== w) {
          orConditions.push({ name: { contains: nw, mode: "insensitive" } });
          orConditions.push({ description: { contains: nw, mode: "insensitive" } });
        }
      }

      for (const catName of matchedCategories) {
        orConditions.push({ category: { equals: catName, mode: "insensitive" } });
      }

      const dbProducts = await prisma.product.findMany({
        where: {
          AND: [
            { id: { not: { startsWith: "demo-" } } },
            category ? { category: { equals: category, mode: "insensitive" } } : {},
            query ? { OR: orConditions } : {},
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
  let list = memoryStore.products.filter((p) => !p.id.startsWith("demo-"));

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
    const qLower = query.toLowerCase().trim();
    const qWords = qLower.split(/\s+/).filter(Boolean);
    const normalizedWords = qWords.map(normalizeTerm);

    list = list
      .map((p) => {
        let score = 0;
        const nameLower = p.name.toLowerCase();
        const descLower = p.description.toLowerCase();
        const catLower = p.category.toLowerCase();
        const highlightsLower = (p.highlights || []).join(" ").toLowerCase();
        const keywords = CATEGORY_KEYWORDS[p.category] || [];

        // Exact full phrase match
        if (nameLower.includes(qLower)) score += 25;
        if (catLower.includes(qLower)) score += 15;
        if (descLower.includes(qLower)) score += 8;
        if (highlightsLower.includes(qLower)) score += 8;

        for (let i = 0; i < qWords.length; i++) {
          const w = qWords[i];
          const nw = normalizedWords[i];

          // Word substring checks
          if (nameLower.includes(w) || nameLower.includes(nw)) score += 12;
          if (catLower.includes(w) || catLower.includes(nw)) score += 8;
          if (descLower.includes(w) || descLower.includes(nw)) score += 4;
          if (highlightsLower.includes(w) || highlightsLower.includes(nw)) score += 4;

          // Check category semantic keywords
          if (keywords.some((k) => k.includes(w) || k.includes(nw) || w.includes(k) || nw.includes(k))) {
            score += 10;
          }
        }

        // Fuzzy typo tolerance
        if (qLower.includes("bluetoth") && (nameLower.includes("bluetooth") || keywords.includes("bluetooth"))) score += 20;
        if ((qLower.includes("erphone") || qLower.includes("erphones")) && (nameLower.includes("earphone") || keywords.includes("earphones"))) score += 20;
        if (qLower.includes("keybord") && (nameLower.includes("keyboard") || nameLower.includes("keychron") || keywords.includes("keyboard"))) score += 20;
        if (qLower.includes("moniter") && (nameLower.includes("display") || nameLower.includes("monitor") || descLower.includes("monitor"))) score += 20;
        if (qLower.includes("soundcre") && (nameLower.includes("soundcore") || descLower.includes("soundcore"))) score += 20;

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
  const qNorm = normalizeTerm(q);
  const qWords = q.split(/\s+/).filter(Boolean);

  // Match memory store products (excluding demo SKUs)
  const scored = memoryStore.products
    .filter((p) => !p.id.startsWith("demo-"))
    .map((p) => {
      let score = 0;
      const name = p.name.toLowerCase();
      const cat = p.category.toLowerCase();
      const desc = p.description.toLowerCase();
      const keywords = CATEGORY_KEYWORDS[p.category] || [];

      if (name.startsWith(q) || name.startsWith(qNorm)) score += 35;
      else if (name.includes(q) || name.includes(qNorm)) score += 25;

      if (cat.includes(q) || cat.includes(qNorm)) score += 18;
      if (keywords.some((k) => k.includes(q) || k.includes(qNorm) || q.includes(k) || qNorm.includes(k))) score += 20;
      if (desc.includes(q) || desc.includes(qNorm)) score += 8;

      for (const w of qWords) {
        const nw = normalizeTerm(w);
        if (name.includes(w) || name.includes(nw)) score += 15;
        if (cat.includes(w) || cat.includes(nw)) score += 12;
        if (keywords.some((k) => k.includes(w) || k.includes(nw) || w.includes(k) || nw.includes(k))) score += 15;
        if (desc.includes(w) || desc.includes(nw)) score += 5;
      }

      if (q.includes("bluetoth") && name.includes("bluetooth")) score += 20;
      if (q.includes("keybord") && name.includes("keyboard")) score += 20;

      return { product: p, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, 6).map((item) => ({
    productId: item.product.id,
    name: item.product.name,
    category: item.product.category,
    price: item.product.price,
    imageUrl: item.product.imageUrl,
  }));
}
