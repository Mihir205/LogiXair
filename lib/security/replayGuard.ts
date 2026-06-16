/**
 * LoRa anti-replay guard (Cyberattack #6).
 *
 * IMPORTANT: this guard runs ENTIRELY IN MEMORY. It does NOT write to
 * Firestore at all — that prevents the demo from burning quota or
 * polluting real telemetry data. The trade-off is that the dedupe cache
 * resets on every server restart and is not shared across replicas; for
 * a single-node dev/demo backend that is exactly the right shape.
 *
 * Production hardening path: swap _cache for a Redis SET-with-EX of 120s.
 * The exported signature (checkReplay) stays identical.
 *
 *   1. Reject packets whose timestamp falls outside +/-REPLAY_WINDOW_SEC
 *      of server time -> blocks captured-and-replayed-later attacks.
 *   2. Reject packets whose (device_id, nonce) tuple has already been
 *      seen within the window -> blocks captured-and-replayed-immediately
 *      attacks (the textbook PoC).
 */

// FLIP FOR BEFORE/AFTER LoRa-replay SCREENSHOTS.
export const REPLAY_GUARD_ENABLED = true;

export const REPLAY_WINDOW_SEC = 60;
const MAX_CACHE_ENTRIES = 2048; // soft cap; oldest evicted on overflow

type CacheEntry = { seenAt: number };

/**
 * Module-level Map persists between requests because the Next.js dev /
 * production server holds onto this module after first import. No
 * external state.
 */
const _cache = new Map<string, CacheEntry>();

function _evictExpired(nowSec: number): void {
    if (_cache.size < MAX_CACHE_ENTRIES) return;
    for (const [k, v] of _cache) {
        if (nowSec - v.seenAt > REPLAY_WINDOW_SEC) {
            _cache.delete(k);
        }
    }
    // If still over, drop the oldest entry to bound memory.
    if (_cache.size >= MAX_CACHE_ENTRIES) {
        const oldestKey = _cache.keys().next().value;
        if (oldestKey !== undefined) _cache.delete(oldestKey);
    }
}

export type ReplayDecision =
    | { accepted: true; reason: "ok" | "no_guard_disabled" }
    | { accepted: false; reason: "stale_timestamp" | "duplicate_nonce"; detail: string };

export function checkReplay(
    device_id: string,
    timestamp: number,
    nonce: number | string,
): ReplayDecision {
    if (!REPLAY_GUARD_ENABLED) {
        return { accepted: true, reason: "no_guard_disabled" };
    }

    const now = Math.floor(Date.now() / 1000);

    const driftSec = Math.abs(now - timestamp);
    if (driftSec > REPLAY_WINDOW_SEC) {
        return {
            accepted: false,
            reason: "stale_timestamp",
            detail: `Timestamp ${timestamp} drifts ${driftSec}s from server (window +/-${REPLAY_WINDOW_SEC}s).`,
        };
    }

    const cacheId = `${device_id}__${nonce}`;
    const hit = _cache.get(cacheId);
    if (hit && now - hit.seenAt <= REPLAY_WINDOW_SEC) {
        return {
            accepted: false,
            reason: "duplicate_nonce",
            detail: `(device=${device_id}, nonce=${nonce}) already seen ${now - hit.seenAt}s ago.`,
        };
    }

    _evictExpired(now);
    _cache.set(cacheId, { seenAt: now });
    return { accepted: true, reason: "ok" };
}

/** For diagnostics page — read-only, never mutates Firestore. */
export function replayCacheStats() {
    return { entries: _cache.size, window_seconds: REPLAY_WINDOW_SEC, guard_enabled: REPLAY_GUARD_ENABLED };
}
