import { searchClient, productIndex, prisma } from "./aiven";

export type ProductDocument = {
  productId: string;
  name: string;
  description: string;
  category: string;
  price: number;
  rating: number;
  popularity: number;
  imageUrl: string;
  stock: number;
  cities: string[];
  createdAt: string;
};

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

export async function productDocument(productId: string): Promise<ProductDocument | null> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { inventory: true },
  });
  if (!product) return null;

  const stock = product.inventory.reduce((sum, item) => sum + item.stockCount, 0);
  return {
    productId: product.id,
    name: product.name,
    description: product.description,
    category: product.category,
    price: Number(product.price),
    rating: product.rating,
    popularity: product.popularity,
    imageUrl: product.imageUrl,
    stock,
    cities: product.inventory.filter((item) => item.stockCount > 0).map((item) => item.city),
    createdAt: product.createdAt.toISOString(),
  };
}

export async function indexProduct(productId: string) {
  if (!searchClient) throw new Error("Aiven OpenSearch is not configured.");
  const product = await productDocument(productId);
  if (!product) {
    await searchClient.delete({ index: productIndex, id: productId, refresh: true }).catch(() => undefined);
    return;
  }
  await searchClient.index({
    index: productIndex,
    id: productId,
    body: product,
    refresh: true,
  });
}

export async function searchProducts(filters: ProductFilters) {
  if (!searchClient) throw new Error("Aiven OpenSearch is not configured.");

  const page = Math.max(1, filters.page ?? 1);
  const limit = Math.min(48, Math.max(1, filters.limit ?? 12));
  const filter: Record<string, unknown>[] = [];
  if (filters.category) filter.push({ term: { category: filters.category } });
  if (filters.city) filter.push({ term: { cities: filters.city } });
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

  const sort: Array<Record<string, { order: "asc" | "desc" }>> = filters.sort === "price-asc"
    ? [{ price: { order: "asc" } }]
    : filters.sort === "price-desc"
      ? [{ price: { order: "desc" } }]
      : filters.sort === "popular"
        ? [{ popularity: { order: "desc" } }]
        : [{ createdAt: { order: "desc" } }];

  const response = await searchClient.search({
    index: productIndex,
    from: (page - 1) * limit,
    size: limit,
    body: {
      query: {
        bool: {
          must: filters.q
            ? [{
                multi_match: {
                  query: filters.q,
                  fields: ["name^4", "category^2", "description"],
                  fuzziness: "AUTO",
                  prefix_length: 1,
                },
              }]
            : [{ match_all: {} }],
          filter,
        },
      },
      sort: filters.q ? [{ _score: { order: "desc" } }, ...sort] : sort,
    },
  });

  const hits = response.body.hits;
  return {
    products: (hits.hits ?? []).map((hit: { _source?: ProductDocument; _score?: number }) => ({
      ...hit._source,
      score: hit._score,
    })),
    total: typeof hits.total === "number" ? hits.total : hits.total?.value ?? 0,
    page,
    pageSize: limit,
    source: "Aiven OpenSearch",
  };
}

export async function suggestProducts(query: string) {
  if (!searchClient) throw new Error("Aiven OpenSearch is not configured.");
  const response = await searchClient.search({
    index: productIndex,
    size: 5,
    body: {
      query: {
        multi_match: {
          query,
          type: "bool_prefix",
          fields: ["name.autocomplete"],
        },
      },
      _source: ["productId", "name", "category", "price", "imageUrl"],
    },
  });
  return (response.body.hits.hits ?? []).map((hit: { _source?: ProductDocument }) => hit._source);
}