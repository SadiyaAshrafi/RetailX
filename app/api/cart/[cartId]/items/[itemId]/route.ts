import { NextRequest, NextResponse } from "next/server";
import { updateCartItemQuantity } from "@/lib/services/commerce";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ cartId: string; itemId: string }> }
) {
  try {
    const { cartId, itemId } = await params;
    const body = await request.json().catch(() => ({}));
    const { quantity } = body;

    if (typeof quantity !== "number" || quantity < 0 || quantity > 50) {
      return NextResponse.json({ error: "Quantity must be between 0 and 50." }, { status: 400 });
    }

    const cart = await updateCartItemQuantity(cartId, itemId, quantity);
    return NextResponse.json(cart);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update item";
    const status = message.includes("above current stock") ? 409 : message.includes("not found") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
