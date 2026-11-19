import { NextRequest, NextResponse } from "next/server";
import { memoryStore } from "@/lib/services/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get("productId");

  if (!productId) {
    return NextResponse.json({ error: "productId is required" }, { status: 400 });
  }

  const product = memoryStore.products.find((p) => p.id === productId);
  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  return NextResponse.json({
    productId,
    rating: product.rating,
    reviews: product.reviews || [],
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { productId, user, rating, comment } = body;

    if (!productId || !user || !rating || !comment) {
      return NextResponse.json({ error: "All review fields are required." }, { status: 400 });
    }

    const product = memoryStore.products.find((p) => p.id === productId);
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    if (!product.reviews) product.reviews = [];
    const newReview = {
      user: String(user).slice(0, 40),
      rating: Math.max(1, Math.min(5, Number(rating))),
      date: "Just now",
      comment: String(comment).slice(0, 500),
      verified: true,
    };

    product.reviews.unshift(newReview);

    // Update overall product rating average
    const totalRating = product.reviews.reduce((sum, r) => sum + r.rating, 0);
    product.rating = Number((totalRating / product.reviews.length).toFixed(1));

    return NextResponse.json({
      success: true,
      newRating: product.rating,
      reviews: product.reviews,
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to add review" },
      { status: 500 }
    );
  }
}
