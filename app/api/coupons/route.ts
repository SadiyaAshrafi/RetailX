import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const VALID_COUPONS: Record<
  string,
  { type: "percent" | "fixed" | "free_shipping"; value: number; description: string; minAmount: number }
> = {
  HACKATHON2026: {
    type: "percent",
    value: 20,
    description: "20% Hackathon Special Discount",
    minAmount: 1000,
  },
  RETAILX10: {
    type: "percent",
    value: 10,
    description: "10% Welcome to RetailX Discount",
    minAmount: 1500,
  },
  SAVE500: {
    type: "fixed",
    value: 500,
    description: "₹500 Instant Cashback Discount",
    minAmount: 3000,
  },
  FREESHIP: {
    type: "free_shipping",
    value: 149,
    description: "Free Express Shipping",
    minAmount: 500,
  },
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const code = String(body.code || "").trim().toUpperCase();
    const cartTotal = Number(body.cartTotal || 0);

    if (!code) {
      return NextResponse.json({ error: "Please enter a promo code." }, { status: 400 });
    }

    const coupon = VALID_COUPONS[code];
    if (!coupon) {
      return NextResponse.json({ error: "Invalid coupon code. Try HACKATHON2026 or RETAILX10" }, { status: 404 });
    }

    if (cartTotal < coupon.minAmount) {
      return NextResponse.json({
        error: `Minimum order value for ${code} is ₹${coupon.minAmount.toLocaleString("en-IN")}.`,
      }, { status: 400 });
    }

    let discountAmount = 0;
    if (coupon.type === "percent") {
      discountAmount = Math.round((cartTotal * coupon.value) / 100);
    } else if (coupon.type === "fixed") {
      discountAmount = coupon.value;
    } else if (coupon.type === "free_shipping") {
      discountAmount = 149;
    }

    return NextResponse.json({
      valid: true,
      code,
      description: coupon.description,
      discountAmount,
      finalTotal: Math.max(0, cartTotal - discountAmount),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Coupon validation error" },
      { status: 500 }
    );
  }
}
