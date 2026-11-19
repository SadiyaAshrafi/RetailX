import { NextRequest, NextResponse } from "next/server";
import {
  adminAuthConfigured,
  clearAdminCookie,
  isRequestAdminAuthenticated,
  setAdminCookie,
  verifyAdminKey,
} from "@/lib/services/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const configured = adminAuthConfigured();
  const authenticated = await isRequestAdminAuthenticated(request);
  return NextResponse.json({ configured, authenticated });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { key } = body;

    if (!key || typeof key !== "string") {
      return NextResponse.json({ error: "Enter the admin access key." }, { status: 400 });
    }

    if (!verifyAdminKey(key)) {
      return NextResponse.json({ error: "That access key is not valid." }, { status: 401 });
    }

    const response = NextResponse.json({ authenticated: true });
    setAdminCookie(response);
    return response;
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Sign-in error" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const response = new NextResponse(null, { status: 204 });
  clearAdminCookie(response);
  return response;
}
