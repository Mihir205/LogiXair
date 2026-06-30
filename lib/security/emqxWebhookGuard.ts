/**
 * EMQX webhook signature guard (Cyberattack M11 — webhook spoofing).
 *
 * Threat: anyone who learns the public URL of /api/emqx-webhook can POST
 * arbitrary JSON. With no signature check, the Next.js route writes the
 * attacker's payload straight into Firebase Realtime DB + Firestore,
 * poisoning the dashboard, faking alerts, and corrupting ML training data.
 *
 * Defense: EMQX rule-engine signs every outgoing webhook with HMAC-SHA256
 * over the raw body using a shared secret (env: EMQX_WEBHOOK_SECRET). The
 * signature lands in the X-EMQX-Signature header as "sha256=<hex>".
 * The Next.js route recomputes the same MAC and timingSafeEqual's it.
 * Mismatch -> 401 + audit log.
 *
 * Toggle WEBHOOK_GUARD_ENABLED for BEFORE / AFTER screenshots.
 */
import crypto from "crypto";

// FLIP FOR BEFORE/AFTER webhook-spoofing screenshots.
// Temporarily false while we sort out the EMQX rule-engine HMAC function
// name on Cloud Serverless. Flip back to true once the SQL `... as sig`
// column works in the SQL Tester.
export const WEBHOOK_GUARD_ENABLED = false;

const HEADER_NAME = "x-emqx-signature";
const SIG_PREFIX = "sha256=";

export type WebhookDecision =
    | { accepted: true; reason: "ok" | "guard_disabled" }
    | {
          accepted: false;
          reason:
              | "no_secret_configured"
              | "no_signature_header"
              | "bad_signature_format"
              | "signature_mismatch";
          detail: string;
      };

/**
 * Verify EMQX webhook signature over the EXACT raw request body.
 *
 * The body MUST be passed in as the original UTF-8 text the broker sent
 * (use `await req.text()`, not `await req.json()` then JSON.stringify —
 * any reformatting will break the HMAC).
 */
export function checkWebhookSignature(
    rawBody: string,
    providedSignature: string | null,
): WebhookDecision {
    if (!WEBHOOK_GUARD_ENABLED) {
        return { accepted: true, reason: "guard_disabled" };
    }

    const secret = process.env.EMQX_WEBHOOK_SECRET;
    if (!secret) {
        return {
            accepted: false,
            reason: "no_secret_configured",
            detail:
                "EMQX_WEBHOOK_SECRET env var is unset. Set it in .env.local and " +
                "configure the same value in the EMQX rule-engine webhook action.",
        };
    }

    if (!providedSignature) {
        return {
            accepted: false,
            reason: "no_signature_header",
            detail: `Missing ${HEADER_NAME} header.`,
        };
    }

    if (!providedSignature.startsWith(SIG_PREFIX)) {
        return {
            accepted: false,
            reason: "bad_signature_format",
            detail: `Header must look like '${SIG_PREFIX}<hex>'.`,
        };
    }

    const providedHex = providedSignature.slice(SIG_PREFIX.length);
    const expectedHex = crypto
        .createHmac("sha256", secret)
        .update(rawBody, "utf8")
        .digest("hex");

    let provBuf: Buffer;
    let expBuf: Buffer;
    try {
        provBuf = Buffer.from(providedHex, "hex");
        expBuf = Buffer.from(expectedHex, "hex");
    } catch {
        return {
            accepted: false,
            reason: "bad_signature_format",
            detail: `${HEADER_NAME} is not valid hex.`,
        };
    }

    if (
        provBuf.length !== expBuf.length ||
        !crypto.timingSafeEqual(provBuf, expBuf)
    ) {
        return {
            accepted: false,
            reason: "signature_mismatch",
            detail:
                "HMAC did not match — payload not signed by the configured EMQX_WEBHOOK_SECRET.",
        };
    }

    return { accepted: true, reason: "ok" };
}

/** Convenience: build the header value a publisher would send. Used by demo runner. */
export function signWebhookBody(rawBody: string, secret: string): string {
    const hex = crypto.createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
    return `${SIG_PREFIX}${hex}`;
}
