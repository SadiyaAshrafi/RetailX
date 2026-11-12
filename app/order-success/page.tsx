import { OrderSuccess } from "./order-success";

export default async function OrderSuccessPage({ searchParams }: { searchParams: Promise<{ order?: string }> }) {
  const params = await searchParams;
  return <OrderSuccess orderId={params.order ?? ""} />;
}