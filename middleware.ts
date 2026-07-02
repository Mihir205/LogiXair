import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "./lib/security/rateLimit";

/**
 * LAYER 1 — Edge perimeter. Runs before any API route on every request.
 *
 * Responsibilities:
 *   1. Per-IP rate limiting, tiered by route sensitivity.
 *   2. Oversized-body rejection (cheap DoS guard before route parsing).
 *   3. Baseline hardening headers on API responses.
 *
 * Deliberately does NOT touch page/document requests — the matcher scopes it
 * to /api/* so SSR hydration and static assets are untouched (avoids the
 * nonce/CSP hydration pitfalls). Auth + role checks stay in the routes
 * (Layer 2); data rules stay in Firebase (Layer 3).
 */

// Requests / window(60s), by route class. Telemetry ingest is generous so a
// chatty station is never throttled; auth-sensitive writes are tight.
const LIMITS: { test: (p: string) => boolean; limit: number; cls: string }[] = [
  { cls: "ingest", limit: 240, test: (p) => p.startsWith("/api/emqx-webhook") || p.startsWith("/api/sensors/ingest") || p.startsWith("/api/weather-ingest") },
  // Auth/lockout is pre-session; keep it tight to blunt credential stuffing
  // (the lockout itself trips at 5, so 30/min/IP is generous headroom).
  { cls: "auth", limit: 30, test: (p) => p.startsWith("/api/auth/") },
  { cls: "adminwrite", limit: 30, test: (p) => p.startsWith("/api/admin/") || p.startsWith("/api/station-config") || p.startsWith("/api/security/") },
  { cls: "geocode", limit: 40, test: (p) => p.startsWith("/api/geocode") },
];
const DEFAULT = { limit: 60, cls: "default" };
const WINDOW_MS = 60_000;
const MAX_BODY_BYTES = 32 * 1024; // 32 KB ceiling for any API request

function clientIp(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Oversized body guard (Content-Length is set by Vercel's proxy).
  const len = Number(req.headers.get("content-length") ?? "0");
  if (len > MAX_BODY_BYTES) {
    return NextResponse.json(
      { error: "Payload too large" },
      { status: 413 },
    );
  }

  // 2. Tiered rate limiting.
  const rule = LIMITS.find((r) => r.test(pathname)) ?? DEFAULT;
  const ip = clientIp(req);
  const verdict = rateLimit(`${ip}:${rule.cls}`, rule.limit, WINDOW_MS);

  if (!verdict.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      {
        status: 429,
        headers: {
          "Retry-After": String(verdict.retryAfterSec),
          "X-RateLimit-Limit": String(verdict.limit),
          "X-RateLimit-Remaining": "0",
        },
      },
    );
  }

  // 3. Pass through with rate headers + baseline hardening.
  const res = NextResponse.next();
  res.headers.set("X-RateLimit-Limit", String(verdict.limit));
  res.headers.set("X-RateLimit-Remaining", String(verdict.remaining));
  res.headers.set("X-Content-Type-Options", "nosniff");
  return res;
}

// Scope strictly to API routes.
export const config = {
  matcher: ["/api/:path*"],
};
