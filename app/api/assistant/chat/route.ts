import { NextRequest, NextResponse } from "next/server";
import { searchProducts } from "@/lib/services/search";
import { memoryStore } from "@/lib/services/db";

export const dynamic = "force-dynamic";

const CITIES = ["Bengaluru", "Mumbai", "Delhi", "Hyderabad"];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const message = (body.message || "").trim();

    if (!message) {
      return NextResponse.json({ error: "Please enter a question or query." }, { status: 400 });
    }

    const lower = message.toLowerCase();

    // Extract price constraints
    const maxPriceMatch = lower.match(/(?:under|below|less than|budget of)\s*(?:₹|rs\.?\s*)?([\d,]+)/i);
    const maxPrice = maxPriceMatch ? parseInt(maxPriceMatch[1].replace(/,/g, ""), 10) : undefined;

    const minPriceMatch = lower.match(/(?:above|over|more than)\s*(?:₹|rs\.?\s*)?([\d,]+)/i);
    const minPrice = minPriceMatch ? parseInt(minPriceMatch[1].replace(/,/g, ""), 10) : undefined;

    // Extract city
    const matchedCity = CITIES.find((c) => lower.includes(c.toLowerCase()));

    // Extract category
    let category: string | undefined;
    if (/(?:audio|sound|headphone|earphone|music|earbud|speaker)/i.test(lower)) category = "Audio";
    else if (/(?:gaming|game|controller|mouse|fps|play)/i.test(lower)) category = "Gaming";
    else if (/(?:keyboard|laptop|computer|display|screen|monitor|desk)/i.test(lower)) category = "Computing";
    else if (/(?:watch|wearable|fitness|tracker)/i.test(lower)) category = "Wearables";
    else if (/(?:camera|photo|lens|shoot|video)/i.test(lower)) category = "Photography";
    else if (/(?:lamp|light|chair|decor|home)/i.test(lower)) category = "Home";

    // Clean search keywords
    const cleanQuery = lower
      .replace(/(?:under|below|less than|above|over|more than|budget of)\s*(?:₹|rs\.?\s*)?[\d,]+/gi, " ")
      .replace(/\b(?:best|find|recommend|suggest|show|give|me|i|want|need|looking|for|the|some|a|an|in|at|available|stock)\b/gi, " ")
      .replace(new RegExp(CITIES.join("|"), "gi"), " ")
      .replace(/[^\w\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    // Query catalog
    const searchResult = await searchProducts({
      q: cleanQuery || category || undefined,
      category,
      city: matchedCity,
      maxPrice,
      minPrice,
      limit: 4,
    });

    let explanation = "";
    if (searchResult.products.length > 0) {
      const topProduct = searchResult.products[0] as { name?: string; price?: number };
      const topName = topProduct.name || "Top Pick";
      const topPrice = topProduct.price || 0;

      if (maxPrice && matchedCity) {
        explanation = `I scanned live inventory in ${matchedCity} under ₹${topPrice ? topPrice.toLocaleString("en-IN") : maxPrice.toLocaleString("en-IN")}. The **${topName}** is in stock right now and matches your exact budget.`;
      } else if (maxPrice) {
        explanation = `Looking for gear under ₹${maxPrice.toLocaleString("en-IN")}, the **${topName}** (₹${topPrice.toLocaleString("en-IN")}) is our top-rated pick with excellent performance and verified customer feedback.`;
      } else if (matchedCity) {
        explanation = `Here are the top-rated products with verified live inventory in **${matchedCity}**. Everything shown is ready for immediate dispatch.`;
      } else {
        explanation = `Based on your request, I found ${searchResult.total} top match${searchResult.total === 1 ? "" : "es"} in our live catalog. Here are the most relevant recommendations:`;
      }
    } else {
      explanation = `I couldn't find an exact item matching "${message}". Try increasing your budget or choosing another city (Bengaluru, Mumbai, Delhi, Hyderabad). Here are trending picks from our collection instead:`;
      const fallback = memoryStore.products.slice(0, 3);
      searchResult.products = fallback.map((p) => ({
        productId: p.id,
        name: p.name,
        description: p.description,
        category: p.category,
        price: p.price,
        rating: p.rating,
        popularity: p.popularity,
        imageUrl: p.imageUrl,
        stock: p.stock,
        cities: p.cities.map((c) => c.city),
        createdAt: p.createdAt,
      }));
    }

    // Generate smart recommended bundle / combo
    let recommendedBundle = null;
    if (category === "Computing" || cleanQuery.includes("keyboard")) {
      const kb = memoryStore.products.find((p) => p.id === "rx-mechanical-keyboard");
      const stand = memoryStore.products.find((p) => p.id === "rx-laptop-stand");
      if (kb && stand) {
        recommendedBundle = {
          title: "Ultimate Clean Desk Bundle",
          savings: "Save ₹1,500",
          items: [kb, stand],
          bundlePrice: kb.price + stand.price - 1500,
        };
      }
    } else if (category === "Gaming" || cleanQuery.includes("mouse")) {
      const mouse = memoryStore.products.find((p) => p.id === "rx-gaming-mouse");
      const controller = memoryStore.products.find((p) => p.id === "rx-controller");
      if (mouse && controller) {
        recommendedBundle = {
          title: "Competitive Esports Pack",
          savings: "Save ₹1,200",
          items: [mouse, controller],
          bundlePrice: mouse.price + controller.price - 1200,
        };
      }
    }

    return NextResponse.json({
      answer: explanation,
      products: searchResult.products,
      bundle: recommendedBundle,
      filtersApplied: {
        category,
        city: matchedCity,
        maxPrice,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Assistant error" },
      { status: 500 }
    );
  }
}
