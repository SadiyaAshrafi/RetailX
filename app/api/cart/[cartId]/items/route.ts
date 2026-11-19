import { NextRequest, NextResponse } from "next/server";
import { addItemToCart } from "@/lib/services/commerce";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ cartId: string }> }
) {
  try {
    const { cartId } = await params;
    const body = await request.json().catch(() => ({}));
    const { productId, quantity = 1 } = body;

    if (!productId || typeof quantity !== "number" || quantity < 1) {
      return NextResponse.json({ error: "Enter a valid product and quantity." }, { status: 400 });
    }

    const cart = await addItemToCart(cartId, productId, quantity);
    return NextResponse.json(cart, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to add item to bag";
    const status = message.includes("above current stock") ? 409 : message.includes("not found") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
