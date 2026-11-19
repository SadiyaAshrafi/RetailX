import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import type { NextRequest, NextResponse } from "next/server";

const cookieName = "retailx_admin";
const sessionDuration = 12 * 60 * 60 * 1000;

function getSecret() {
  return process.env.ADMIN_SESSION_SECRET || "2c3c4de282cc1a945d4929166a410598dc141bf797a067403bb0f456d7dfcd66";
}

function getKey() {
  return process.env.ADMIN_ACCESS_KEY || "202006";
}

function signature(expiresAt: string) {
  return createHmac("sha256", getSecret()).update(expiresAt).digest("base64url");
}

export function adminAuthConfigured() {
  return true;
}

export function verifyAdminKey(key: string) {
  const expected = Buffer.from(getKey());
  const provided = Buffer.from(key);
  if (expected.length !== provided.length) return false;
  return timingSafeEqual(expected, provided);
}

export async function isRequestAdminAuthenticated(request?: NextRequest) {
  let cookieValue: string | undefined;

  if (request) {
    cookieValue = request.cookies.get(cookieName)?.value;
  } else {
    try {
      const cookieStore = await cookies();
      cookieValue = cookieStore.get(cookieName)?.value;
    } catch {
      cookieValue = undefined;
    }
  }

  if (!cookieValue) return false;
  const [expiresAt, providedSignature] = cookieValue.split(".");
  if (!expiresAt || !providedSignature || Number(expiresAt) <= Date.now()) return false;

  const expected = Buffer.from(signature(expiresAt));
  const provided = Buffer.from(providedSignature);
  return expected.length === provided.length && timingSafeEqual(expected, provided);
}

export function setAdminCookie(response: NextResponse) {
  const expiresAt = String(Date.now() + sessionDuration);
  const token = `${expiresAt}.${signature(expiresAt)}`;
  response.cookies.set({
    name: cookieName,
    value: token,
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: sessionDuration / 1000,
  });
}

export function clearAdminCookie(response: NextResponse) {
  response.cookies.set({
    name: cookieName,
    value: "",
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
  });
}
