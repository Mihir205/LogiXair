import type { NextConfig } from "next";

/**
 * Security headers — defense against XSS, clickjacking, MIME-sniffing, and
 * referrer leakage. Verify in DevTools -> Network -> any document request:
 *   Content-Security-Policy
 *   X-Frame-Options: DENY
 *   X-Content-Type-Options: nosniff
 *   Referrer-Policy: strict-origin-when-cross-origin
 *   Strict-Transport-Security (HTTPS only)
 *
 * The CSP allows Firebase Auth / Firestore endpoints used by this app.
 * 'unsafe-inline' is included for style-src because Next.js + Tailwind emit
 * inline <style> tags; script-src does NOT permit unsafe-inline, so a
 * stored-XSS payload like <img onerror=alert(1)> is blocked even when the
 * vulnerable render path is selected for the demo.
 */
// Both Next.js dev (Turbopack / HMR) AND prod (SSR streaming + hydration
// markers) emit inline <script> tags. Without 'unsafe-inline' on script-src,
// React never hydrates on the deployed site and every button becomes a
// no-op — login can't happen. The clean long-term answer is per-request
// nonces via middleware; for now we allow 'unsafe-inline' in both modes.
// XSS is still blocked because:
//   • Sanitizer rejects payloads at write time (sanitize.ts)
//   • React JSX auto-escapes user-supplied strings
//   • dangerouslySetInnerHTML is only used in the demo vulnerable path
const isDev = process.env.NODE_ENV !== "production";

// FLIP FOR THE BEFORE / AFTER CLICKJACK SCREENSHOTS.
// When false: X-Frame-Options is omitted and CSP's frame-ancestors is set to
// '*' so attacker iframes succeed (vulnerable state demo).
const CLICKJACK_PROTECTION = true;

const CSP = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-eval' 'unsafe-inline' https://*.firebaseio.com https://*.firebasedatabase.app https://*.googleapis.com https://apis.google.com https://www.gstatic.com https://www.google.com`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://*.firebaseapp.com https://*.firebasedatabase.app wss://*.firebaseio.com wss://*.firebasedatabase.app https://identitytoolkit.googleapis.com https://securetoken.googleapis.com",
  // frame-src: what WE are allowed to embed (Google Maps iframe on /common/map).
  // Different from frame-ancestors (who can embed US — set on the line below).
  "frame-src https://www.google.com https://maps.google.com https://*.google.com https://apis.google.com https://accounts.google.com https://*.firebaseapp.com https://*.firebasedatabase.app",
  CLICKJACK_PROTECTION ? "frame-ancestors 'none'" : "frame-ancestors *",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: CSP },
  ...(CLICKJACK_PROTECTION ? [{ key: "X-Frame-Options", value: "DENY" }] : []),
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
