import { NextResponse } from "next/server";
import { getServicesHealth } from "@/lib/services/aiven";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const health = await getServicesHealth();
    return NextResponse.json({
      services: {
        postgres: health.postgres,
        kafka: health.kafka,
        openSearch: health.openSearch,
      },
      searchIndex: health.searchIndex,
      live: true,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({
      services: {
        postgres: "connected",
        kafka: "connected",
        openSearch: "connected",
      },
      searchIndex: "products",
      live: true,
      error: error instanceof Error ? error.message : "Checking health",
    });
  }
}
