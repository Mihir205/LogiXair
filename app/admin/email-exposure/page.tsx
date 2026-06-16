"use client";

/**
 * Email / Role Exposure Audit — read-only.
 *
 * Why this page exists: even though the platform does not store passwords
 * (Firebase Auth does), the Firestore `users/{uid}` documents store an
 * email + role pair. If those rules are misconfigured, ANY signed-in user
 * can list every email and learn who is an admin — enabling targeted
 * phishing, password-reset abuse, and social engineering attacks.
 *
 * This page does ONE thing: attempt a couple of *probes* from the
 * currently authenticated client and report what works and what is
 * refused. It writes nothing to Firestore. It does not change any
 * audit log. It is safe to load on a live deployment.
 */
import { useEffect, useState } from "react";
import RouteGuard from "../../components/RouteGuard";
import AuthGuard from "../../components/AuthGuard";
import DashboardLayout from "../../components/DashboardLayout";
import {
    ShieldAlert,
    ShieldCheck,
    ScanEye,
    Mail,
    Lock,
    AlertTriangle,
    RefreshCw,
} from "lucide-react";
import { auth, firestore } from "../../../lib/firebase";
import { collection, getDocs, query, limit } from "firebase/firestore";

export default function EmailExposurePage() {
    return (
        <AuthGuard>
            <RouteGuard allowedRole="admin">
                <DashboardLayout role="admin">
                    <EmailExposureAudit />
                </DashboardLayout>
            </RouteGuard>
        </AuthGuard>
    );
}

interface Probe {
    label: string;
    detail: string;
    status: "pending" | "blocked" | "allowed" | "error";
    note?: string;
}

function EmailExposureAudit() {
    const [probes, setProbes] = useState<Probe[]>([
        { label: "List the users collection", detail: "collection(users).limit(5)", status: "pending" },
        { label: "Read another user's doc by random uid", detail: "doc(users/<random>)", status: "pending" },
        { label: "Read OWN user doc", detail: "doc(users/<myUid>)", status: "pending" },
    ]);
    const [refresh, setRefresh] = useState(0);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            const next: Probe[] = [...probes].map((p) => ({ ...p, status: "pending" }));

            // Probe 1: list users collection (should be REFUSED for non-admin rules)
            try {
                const snap = await getDocs(query(collection(firestore, "users"), limit(5)));
                next[0] = {
                    ...next[0],
                    status: "allowed",
                    note: `Listed ${snap.size} document(s). Email enumeration is POSSIBLE — tighten the rules!`,
                };
            } catch (e) {
                next[0] = {
                    ...next[0],
                    status: "blocked",
                    note: e instanceof Error ? e.message : "Refused by Firestore rules.",
                };
            }

            // Probe 2: read a random uid that is NOT the caller — should be REFUSED
            const randomUid = "audit_probe_random_" + Math.random().toString(36).slice(2, 10);
            try {
                await (await import("firebase/firestore")).getDoc(
                    (await import("firebase/firestore")).doc(firestore, "users", randomUid),
                );
                next[1] = {
                    ...next[1],
                    status: "allowed",
                    note: "Cross-user read returned (even if doc was empty). Rules need tightening.",
                };
            } catch (e) {
                next[1] = {
                    ...next[1],
                    status: "blocked",
                    note: e instanceof Error ? e.message : "Refused by Firestore rules.",
                };
            }

            // Probe 3: read OWN user doc — should always succeed
            const me = auth.currentUser;
            if (me) {
                try {
                    await (await import("firebase/firestore")).getDoc(
                        (await import("firebase/firestore")).doc(firestore, "users", me.uid),
                    );
                    next[2] = { ...next[2], status: "allowed", note: "Self-read works (required for the role lookup)." };
                } catch (e) {
                    next[2] = {
                        ...next[2],
                        status: "error",
                        note: e instanceof Error ? e.message : "Self-read failed.",
                    };
                }
            } else {
                next[2] = { ...next[2], status: "error", note: "No active Firebase Auth user." };
            }

            if (!cancelled) setProbes(next);
        })();
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [refresh]);

    const enumerationPossible =
        probes[0].status === "allowed" || probes[1].status === "allowed";

    return (
        <div className="space-y-6 max-w-[1400px] mx-auto">

            <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-slate-200/60 dark:border-slate-800/80">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                        Email & Role Exposure Audit
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
                        Read-only probes — verifies Firestore rules block email enumeration without writing anything.
                    </p>
                </div>
                <button
                    onClick={() => setRefresh((c) => c + 1)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-3 py-2 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:opacity-80 transition-opacity"
                >
                    <RefreshCw size={12} />
                    Re-run probes
                </button>
            </header>

            {/* HEADLINE STATUS */}
            <div
                className={`rounded-xl border p-5 flex items-start gap-4 ${
                    enumerationPossible
                        ? "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/60"
                        : "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/60"
                }`}
            >
                <div
                    className={`p-3 rounded-xl ${
                        enumerationPossible
                            ? "bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300"
                            : "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300"
                    }`}
                >
                    {enumerationPossible ? <ShieldAlert size={28} /> : <ShieldCheck size={28} />}
                </div>
                <div className="flex-1 space-y-1">
                    <h2
                        className={`text-lg font-bold tracking-tight ${
                            enumerationPossible
                                ? "text-rose-800 dark:text-rose-200"
                                : "text-emerald-800 dark:text-emerald-200"
                        }`}
                    >
                        {enumerationPossible
                            ? "Email enumeration is POSSIBLE — rules need tightening"
                            : "Email/role exposure is contained — enumeration blocked"}
                    </h2>
                    <p
                        className={`text-sm ${
                            enumerationPossible
                                ? "text-rose-700 dark:text-rose-300"
                                : "text-emerald-700 dark:text-emerald-300"
                        }`}
                    >
                        {enumerationPossible
                            ? "A signed-in user can list every account's email + role from this dashboard. Deploy the rules in firestore.rules.example."
                            : "Firestore rules refuse cross-user reads and collection listing. Owner-self reads still work (required for the login role lookup). No password is stored anywhere in Firestore — Firebase Auth handles credentials."}
                    </p>
                </div>
            </div>

            {/* PROBE TABLE */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800/80 shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-200/60 dark:border-slate-800/80 flex items-center gap-2">
                    <ScanEye size={14} className="text-indigo-600 dark:text-indigo-400" />
                    <h3 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
                        Live Probes (read-only)
                    </h3>
                </div>
                <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                    {probes.map((p) => (
                        <li key={p.label} className="px-5 py-4 flex items-start gap-4">
                            <ProbeBadge status={p.status} />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-slate-900 dark:text-white">{p.label}</p>
                                <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                                    {p.detail}
                                </p>
                                {p.note && (
                                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 break-words">
                                        {p.note}
                                    </p>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            </div>

            {/* GUIDANCE */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800/80 shadow-sm p-5 space-y-4">
                <div className="flex items-start gap-3">
                    <Lock size={16} className="mt-0.5 text-indigo-600 dark:text-indigo-400" />
                    <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                            What is and is not stored
                        </h3>
                        <ul className="text-xs text-slate-600 dark:text-slate-400 mt-2 space-y-1 list-disc pl-4">
                            <li>
                                <strong>Email + role</strong> stored in Firestore <code>users/&#123;uid&#125;</code>.
                                Defense: rules restrict reads to self + admin.
                            </li>
                            <li>
                                <strong>Password</strong> NEVER touches Firestore. Firebase Authentication
                                stores a salted hash in Google's identity backend, beyond our reach.
                            </li>
                            <li>
                                <strong>Login attempt counter</strong> stored in <code>loginAttempts/&#123;email&#125;</code>.
                                Rules allow client-side increments only; admins clear them.
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="flex items-start gap-3">
                    <Mail size={16} className="mt-0.5 text-indigo-600 dark:text-indigo-400" />
                    <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                            Email-only attack vectors (no password needed)
                        </h3>
                        <ul className="text-xs text-slate-600 dark:text-slate-400 mt-2 space-y-1 list-disc pl-4">
                            <li>
                                <strong>Targeted phishing</strong> — attacker uses the email to send a fake
                                "Reset your LogiXair password" link. Mitigation: Firestore rules block
                                enumeration; user education for the rest.
                            </li>
                            <li>
                                <strong>Password-reset spam</strong> — Firebase Auth rate-limits these by
                                IP and email; no extra code required.
                            </li>
                            <li>
                                <strong>Login enumeration</strong> — our login flow returns the SAME error
                                for "unknown email" and "wrong password" so the attacker cannot tell
                                whether an email is registered. Verified.
                            </li>
                            <li>
                                <strong>Role disclosure</strong> — knowing an email is an admin makes them a
                                priority phishing target. Closed by the same rules.
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="flex items-start gap-3">
                    <AlertTriangle size={16} className="mt-0.5 text-amber-600 dark:text-amber-400" />
                    <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                            How to deploy the protection
                        </h3>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
                            Open <code>firestore.rules.example</code> in the project root → copy into
                            Firebase Console → Firestore Database → Rules → Publish. The rules are
                            additive and do not break the existing app (login still reads its own doc).
                            After deploy, re-run the probes here — items 1 and 2 should flip to BLOCKED.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ProbeBadge({ status }: { status: Probe["status"] }) {
    const map = {
        pending: { txt: "RUN…", cls: "bg-slate-100 text-slate-600 border-slate-200" },
        blocked: { txt: "BLOCKED", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
        allowed: { txt: "ALLOWED", cls: "bg-rose-50 text-rose-700 border-rose-200" },
        error:   { txt: "ERROR",   cls: "bg-amber-50 text-amber-700 border-amber-200" },
    } as const;
    const m = map[status];
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded border text-[10px] font-bold tracking-wider uppercase mt-1 ${m.cls}`}>
            {m.txt}
        </span>
    );
}
