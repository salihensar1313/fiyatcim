/**
 * Demo mode admin authentication — HMAC-SHA256 signed tokens
 * Used by middleware (edge) and API route to create/verify admin cookies.
 * This is NOT used in production — Supabase handles real auth.
 */

import { logger } from "@/lib/logger";

const DEMO_SECRET = process.env.DEMO_ADMIN_SECRET;

if (!DEMO_SECRET) {
  logger.warn("demo_admin_secret_missing", { fn: "init", error: "DEMO_ADMIN_SECRET env var is not set. Admin auth will fail in demo mode." });
}

export const DEMO_ADMIN_COOKIE = "fiyatcim_demo_admin";
export const DEMO_COOKIE_MAX_AGE = 60 * 60 * 8; // 8 hours

/** HMAC-SHA256 sign a payload string */
export async function hmacSign(payload: string): Promise<string> {
  if (!DEMO_SECRET) {
    throw new Error("DEMO_ADMIN_SECRET environment variable is required for demo admin auth.");
  }
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(DEMO_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Build a signed token: userId:email:role:hmac */
export async function createAdminToken(userId: string, email: string): Promise<string> {
  const payload = `${userId}|${email}|admin`;
  const signature = await hmacSign(payload);
  return `${payload}|${signature}`;
}

/** Verify a signed admin token. Returns true only if HMAC matches AND role is admin. */
export async function verifyAdminToken(token: string): Promise<boolean> {
  const parts = token.split("|");
  if (parts.length !== 4) return false;

  const [userId, email, role, signature] = parts;
  if (role !== "admin" || !userId || !email) return false;

  const payload = `${userId}|${email}|${role}`;
  const expected = await hmacSign(payload);

  // Constant-time comparison to prevent timing attacks
  if (expected.length !== signature.length) return false;
  let mismatch = 0;
  for (let i = 0; i < expected.length; i++) {
    mismatch |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return mismatch === 0;
}
