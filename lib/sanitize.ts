/**
 * XSS demo helper for the cybersecurity section.
 *
 * Stored-XSS attack surface: admin-created Station names are rendered on
 * every dashboard (User / Operator / Admin). If those names are dropped into
 * the DOM unescaped (innerHTML / dangerouslySetInnerHTML), a payload like
 *     <img src=x onerror=alert(1)>
 * fires whenever any user views the list.
 *
 * Flip XSS_DEMO_VULNERABLE to capture the "before protection" screenshot,
 * then set it back to false for the "after" screenshot.
 */

// FLIP THIS FLAG FOR THE BEFORE / AFTER SCREENSHOTS
export const XSS_DEMO_VULNERABLE = false;

const FORBIDDEN_PATTERNS: RegExp[] = [
  /<\s*script/i,
  /<\s*iframe/i,
  /<\s*img[^>]*onerror/i,
  /<\s*svg[^>]*onload/i,
  /javascript\s*:/i,
  /on\w+\s*=/i, // any inline event handler
];

export function isXssPayload(input: string): boolean {
  return FORBIDDEN_PATTERNS.some((re) => re.test(input));
}

export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Reject and explain — used on the admin write path so the malicious payload
 * never reaches Firestore in the first place (defense in depth).
 */
export function validateStationName(name: string): { ok: boolean; reason?: string } {
  if (!name || !name.trim()) return { ok: false, reason: "Name is required." };
  if (name.length > 80) return { ok: false, reason: "Name must be ≤ 80 characters." };
  if (isXssPayload(name)) {
    return {
      ok: false,
      reason: "Potential XSS payload detected (script / event handler / javascript URI).",
    };
  }
  return { ok: true };
}
