import { NextRequest, NextResponse } from "next/server";
import { processCheckout } from "@/lib/services/commerce";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { cartId, name, email, phone, address } = body;

    if (!cartId || !name || !email || !phone || !address) {
      return NextResponse.json({ error: "Please complete every checkout field." }, { status: 400 });
    }

    const result = await processCheckout({
      cartId,
      name,
      email,
      phone,
      address,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Checkout failed";
    const status = message.includes("empty") || message.includes("not enough stock") ? 409 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
