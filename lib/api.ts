export type ServiceState = "connected" | "unavailable" | "not_configured";

export type Product = {
  productId: string;
  name: string;
  description: string;
  category: string;
  price: number;
  rating: number;
  popularity: number;
  imageUrl: string;
  stock: number;
  cities: (string | { city: string; stock: number })[];
  createdAt: string;
};

export type SearchResult = {
  products: Product[];
  total: number;
  page: number;
  pageSize: number;
  source: string;
};

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...init,
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Request failed (${response.status})`);
  return data as T;
}

export function cartId() {
  const key = "retailx-cart-id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

export function money(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function notifyCartChanged() {
  window.dispatchEvent(new Event("retailx-cart-changed"));
}