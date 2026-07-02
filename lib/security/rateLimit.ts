/**
 * In-memory sliding-window rate limiter (Edge-runtime safe — no Node APIs).
 *
 * HONEST SCOPE: state lives per serverless instance, so on Vercel this is
 * per-instance, not globally consistent. It still meaningfully blunts floods
 * and scripted abuse from a single source hitting a warm instance. For
 * globally-consistent limits, back this with Upstash Redis later — the call
 * sites won't change. This is Layer 1 of defense-in-depth, not the only layer.
 */

type Bucket = { count: number; resetAt: number };
const store = new Map<string, Bucket>();

// Opportunistic sweep so the Map can't grow unbounded on a long-lived instance.
let lastSweep = 0;
function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [k, b] of store) {
    if (b.resetAt <= now) store.delete(k);
  }
}

export type RateVerdict = {
  allowed: boolean;
  remaining: number;
  limit: number;
  retryAfterSec: number;
};

/**
 * @param key     unique bucket id (e.g. `${ip}:${routeClass}`)
 * @param limit   max requests per window
 * @param windowMs window length in ms
 */
export function rateLimit(key: string, limit: number, windowMs: number): RateVerdict {
  const now = Date.now();
  sweep(now);

  const b = store.get(key);
  if (!b || b.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, limit, retryAfterSec: 0 };
  }

  if (b.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      limit,
      retryAfterSec: Math.max(1, Math.ceil((b.resetAt - now) / 1000)),
    };
  }

  b.count += 1;
  return { allowed: true, remaining: limit - b.count, limit, retryAfterSec: 0 };
}
