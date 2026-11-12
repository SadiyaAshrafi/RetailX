import { Router } from "express";
import { timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { adminAuthConfigured, clearAdminSession, isAdminAuthenticated, setAdminSession } from "../services/admin-auth";

export const sessionRouter = Router();

sessionRouter.get("/session", (request, response) => {
  response.json({ configured: adminAuthConfigured(), authenticated: isAdminAuthenticated(request) });
});

sessionRouter.post("/session", (request, response) => {
  if (!adminAuthConfigured()) return response.status(503).json({ error: "Configure ADMIN_ACCESS_KEY and a 32-character ADMIN_SESSION_SECRET." });
  const parsed = z.object({ key: z.string().min(1) }).safeParse(request.body);
  if (!parsed.success) return response.status(400).json({ error: "Enter the admin access key." });
  const expected = Buffer.from(process.env.ADMIN_ACCESS_KEY!);
  const provided = Buffer.from(parsed.data.key);
  if (expected.length !== provided.length || !timingSafeEqual(expected, provided)) {
    return response.status(401).json({ error: "That access key is not valid." });
  }
  setAdminSession(response);
  response.json({ authenticated: true });
});

sessionRouter.delete("/session", (_request, response) => {
  clearAdminSession(response);
  response.status(204).end();
});