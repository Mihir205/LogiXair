/**
 * Server-side brute-force lockout (replaces the client-enforced version).
 *
 * The counter now lives behind the Admin SDK, so a tampered browser can no
 * longer skip recording a failure or clear its own lock. This route is
 * necessarily PRE-AUTH (it runs during failed logins, before a session
 * exists), so it takes no ID token — abuse is bounded by:
 *   - edge rate limiting (middleware, /api/auth tier)
 *   - the lockout itself (5 tries → 15 min)
 *   - Admin-SDK-only writes to loginAttempts (Firestore rules deny clients)
 *
 * Actions (POST body): { action: "check" | "fail" | "reset", email }
 */
import { NextResponse } from "next/server";
import { adminFirestore } from "@/lib/firebaseAdmin";
import { Timestamp, FieldValue } from "firebase-admin/firestore";

const MAX_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;
const COLLECTION = "loginAttempts";

type LockoutStatus = {
  email: string;
  failed_attempts: number;
  attempts_remaining: number;
  max_attempts: number;
  is_locked: boolean;
  lock_seconds_remaining: number;
};

function keyFor(email: string): string {
  return email.trim().toLowerCase();
}

function secondsUntil(ts: Timestamp | null | undefined): number {
  if (!ts) return 0;
  const ms = ts.toMillis() - Date.now();
  return Math.max(0, Math.floor(ms / 1000));
}

function statusFrom(id: string, data: FirebaseFirestore.DocumentData | undefined): LockoutStatus {
  const failed = (data?.failed_attempts as number) ?? 0;
  const lockedUntil = (data?.locked_until as Timestamp | null) ?? null;
  const remaining = secondsUntil(lockedUntil);
  return {
    email: id,
    failed_attempts: failed,
    attempts_remaining: Math.max(0, MAX_ATTEMPTS - failed),
    max_attempts: MAX_ATTEMPTS,
    is_locked: remaining > 0,
    lock_seconds_remaining: remaining,
  };
}

// Accept only plausible emails; never echo anything back that leaks state.
function validEmail(v: unknown): v is string {
  return typeof v === "string" && v.length <= 254 && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v.trim());
}

export async function POST(req: Request) {
  let body: { action?: string; email?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { action, email } = body;
  if (!validEmail(email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }
  const id = keyFor(email);
  const ref = adminFirestore.collection(COLLECTION).doc(id);

  try {
    if (action === "check") {
      const snap = await ref.get();
      return NextResponse.json(statusFrom(id, snap.data()));
    }

    if (action === "fail") {
      // Atomic increment so concurrent attempts can't race the counter.
      const result = await adminFirestore.runTransaction(async (tx) => {
        const snap = await tx.get(ref);
        const attempts = ((snap.data()?.failed_attempts as number) ?? 0) + 1;
        const patch: FirebaseFirestore.DocumentData = {
          email: id,
          failed_attempts: attempts,
          updated_at: FieldValue.serverTimestamp(),
        };
        if (attempts >= MAX_ATTEMPTS) {
          patch.locked_until = Timestamp.fromMillis(Date.now() + LOCKOUT_MINUTES * 60 * 1000);
        }
        tx.set(ref, patch, { merge: true });
        return { attempts, locked: attempts >= MAX_ATTEMPTS };
      });
      const snap = await ref.get();
      return NextResponse.json(statusFrom(id, snap.data()));
    }

    if (action === "reset") {
      await ref.set(
        {
          email: id,
          failed_attempts: 0,
          locked_until: null,
          updated_at: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch {
    // Never leak internals; fail safe by reporting not-locked so a backend
    // hiccup can't permanently wedge a legitimate user out.
    return NextResponse.json(
      { email: id, failed_attempts: 0, attempts_remaining: MAX_ATTEMPTS, max_attempts: MAX_ATTEMPTS, is_locked: false, lock_seconds_remaining: 0 },
      { status: 200 },
    );
  }
}
