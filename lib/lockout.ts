/**
 * Brute-force lockout — client shim over the server-enforced counter.
 *
 * The actual counter lives in /api/auth/lockout (Admin SDK), so a tampered
 * browser can no longer skip a failure or clear its own lock. These helpers
 * keep the SAME signatures the login page already imports, so nothing at the
 * call site changed. Firestore rules now deny client writes to loginAttempts.
 */

export const MAX_ATTEMPTS = 5;
export const LOCKOUT_MINUTES = 15;

export interface LockoutStatus {
  email: string;
  failed_attempts: number;
  attempts_remaining: number;
  max_attempts: number;
  is_locked: boolean;
  lock_seconds_remaining: number;
}

const NOT_LOCKED = (email: string): LockoutStatus => ({
  email: email.trim().toLowerCase(),
  failed_attempts: 0,
  attempts_remaining: MAX_ATTEMPTS,
  max_attempts: MAX_ATTEMPTS,
  is_locked: false,
  lock_seconds_remaining: 0,
});

async function call(action: "check" | "fail" | "reset", email: string): Promise<any> {
  const res = await fetch("/api/auth/lockout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, email }),
  });
  return res.json();
}

export async function readLockout(email: string): Promise<LockoutStatus> {
  try {
    const data = await call("check", email);
    return data?.email ? data : NOT_LOCKED(email);
  } catch {
    // Fail open on a network hiccup so a real user is never wedged out.
    return NOT_LOCKED(email);
  }
}

export async function recordFailure(email: string): Promise<LockoutStatus> {
  try {
    const data = await call("fail", email);
    return data?.email ? data : NOT_LOCKED(email);
  } catch {
    return NOT_LOCKED(email);
  }
}

export async function resetLockout(email: string): Promise<void> {
  try {
    await call("reset", email);
  } catch {
    /* non-fatal */
  }
}

export function formatRemaining(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
