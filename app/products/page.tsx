import { ProductListing } from "./product-listing";

export default async function ProductsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  return <ProductListing initialQuery={typeof params.q === "string" ? params.q : ""} initialCategory={typeof params.category === "string" ? params.category : ""} />;
}