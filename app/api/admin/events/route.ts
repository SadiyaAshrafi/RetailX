import { NextRequest, NextResponse } from "next/server";
import { isRequestAdminAuthenticated } from "@/lib/services/admin-auth";
import { prisma, isPostgresAlive, memoryStore } from "@/lib/services/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authenticated = await isRequestAdminAuthenticated(request);
  if (!authenticated) {
    return NextResponse.json({ error: "Admin sign-in is required." }, { status: 401 });
  }

  const pgAlive = await isPostgresAlive();
  if (pgAlive) {
    try {
      const events = await prisma.eventLog.findMany({
        take: 60,
        orderBy: { receivedAt: "desc" },
      });
      if (events.length > 0) {
        return NextResponse.json({ events, connected: true });
      }
    } catch {
      // Fallback
    }
  }

  return NextResponse.json({
    events: memoryStore.events.slice(0, 60),
    connected: true,
  });
}
