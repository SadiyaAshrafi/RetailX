import { createHmac, timingSafeEqual } from "node:crypto";
import type { Request, Response } from "express";

const cookieName = "retailx_admin";
const sessionDuration = 12 * 60 * 60 * 1000;

function signature(expiresAt: string) {
  return createHmac("sha256", process.env.ADMIN_SESSION_SECRET || "")
    .update(expiresAt)
    .digest("base64url");
}

function sessionCookie(request: Request) {
  const cookies = request.headers.cookie?.split(";") ?? [];
  const value = cookies.map((cookie) => cookie.trim()).find((cookie) => cookie.startsWith(`${cookieName}=`));
  return value?.slice(cookieName.length + 1);
}

export function adminAuthConfigured() {
  return Boolean(process.env.ADMIN_ACCESS_KEY && (process.env.ADMIN_SESSION_SECRET?.length ?? 0) >= 32);
}

export function isAdminAuthenticated(request: Request) {
  if (!adminAuthConfigured()) return false;
  const [expiresAt, providedSignature] = sessionCookie(request)?.split(".") ?? [];
  if (!expiresAt || !providedSignature || Number(expiresAt) <= Date.now()) return false;
  const expected = Buffer.from(signature(expiresAt));
  const provided = Buffer.from(providedSignature);
  return expected.length === provided.length && timingSafeEqual(expected, provided);
}

export function setAdminSession(response: Response) {
  const expiresAt = String(Date.now() + sessionDuration);
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  response.setHeader("Set-Cookie", `${cookieName}=${expiresAt}.${signature(expiresAt)}; Path=/api/admin; HttpOnly; SameSite=Strict; Max-Age=${sessionDuration / 1000}${secure}`);
}

export function clearAdminSession(response: Response) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  response.setHeader("Set-Cookie", `${cookieName}=; Path=/api/admin; HttpOnly; SameSite=Strict; Max-Age=0${secure}`);
}