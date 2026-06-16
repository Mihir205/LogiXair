"use client";

/**
 * MITM (Man-in-the-Middle) attack — in-dashboard PoC.
 *
 * Shows what an attacker sitting on the LAN (rogue WiFi AP, ARP-spoofed
 * gateway, malicious proxy) would actually see when this dashboard talks
 * to the dev server. The "Captured Traffic" panel is filled with REAL
 * data pulled from the running browser session — auth token, URL, user
 * agent, request headers — so when served over HTTP every byte is
 * readable, and when served over HTTPS the same data is encrypted in
 * transit.
 *
 * No code toggle needed: the page reads window.location.protocol and
 * adjusts every banner / panel / status colour automatically.
 *   - http://localhost:3000  -> red, "PLAINTEXT — EXPOSED"
 *   - https://localhost:3000 -> green, "TLS 1.3 — ENCRYPTED"
 *
 * Demo workflow:
 *   1) npm run dev       (BEFORE — screenshot the red panel)
 *   2) npm run dev:https (AFTER  — screenshot the green panel)
 */
import { useEffect, useState } from "react";
import RouteGuard from "../../components/RouteGuard";
import AuthGuard from "../../components/AuthGuard";
import DashboardLayout from "../../components/DashboardLayout";
import {
  ShieldAlert,
  ShieldCheck,
  Eye,
  Lock,
  Unlock,
  RefreshCw,
  Wifi,
  AlertTriangle,
} from "lucide-react";
import { auth } from "../../../lib/firebase";

export default function MitmDemoPage() {
  return (
    <AuthGuard>
      <RouteGuard allowedRole="admin">
        <DashboardLayout role="admin">
          <MitmDemo />
        </DashboardLayout>
      </RouteGuard>
    </AuthGuard>
  );
}

interface CapturedSession {
  protocol: string;
  host: string;
  pathname: string;
  userAgent: string;
  idToken: string | null;
  email: string | null;
  uid: string | null;
  cookies: string;
  capturedAt: string;
}

function MitmDemo() {
  const [session, setSession] = useState<CapturedSession | null>(null);
  const [revealToken, setRevealToken] = useState(false);
  const [reloadCounter, setReloadCounter] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const user = auth.currentUser;
      const idToken = user ? await user.getIdToken().catch(() => null) : null;
      if (cancelled) return;
      setSession({
        protocol: window.location.protocol,
        host: window.location.host,
        pathname: window.location.pathname,
        userAgent: navigator.userAgent,
        idToken,
        email: user?.email ?? null,
        uid: user?.uid ?? null,
        cookies: document.cookie || "(no cookies set on this origin)",
        capturedAt: new Date().toISOString(),
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [reloadCounter]);

  const isHttps = session?.protocol === "https:";

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">

      {/* HEADER */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-slate-200/60 dark:border-slate-800/80">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            MITM Sniffer Demonstration
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            Live view of what a network attacker would capture from this
            session, switched purely by which dev server is running.
          </p>
        </div>
        <button
          onClick={() => setReloadCounter((c) => c + 1)}
          className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-3 py-2 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:opacity-80 transition-opacity"
        >
          <RefreshCw size={12} />
          Re-capture
        </button>
      </header>

      {/* PROTOCOL STATUS BANNER */}
      <ProtocolBanner isHttps={isHttps} session={session} />

      {/* SIDE-BY-SIDE: ATTACKER'S VIEW + DEFENSE STATUS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <AttackerCapturePanel
            session={session}
            isHttps={isHttps}
            revealToken={revealToken}
            onToggleReveal={() => setRevealToken((v) => !v)}
          />
        </div>
        <DefenseStatusPanel isHttps={isHttps} />
      </div>

      {/* COMPARISON TABLE */}
      <ComparisonTable isHttps={isHttps} />
    </div>
  );
}

function ProtocolBanner({
  isHttps,
  session,
}: {
  isHttps: boolean;
  session: CapturedSession | null;
}) {
  if (!session) {
    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-6 text-sm text-slate-500">
        Capturing session...
      </div>
    );
  }
  return (
    <div
      className={`rounded-xl border p-5 flex items-start gap-4 ${
        isHttps
          ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/60"
          : "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/60"
      }`}
    >
      <div
        className={`p-3 rounded-xl ${
          isHttps
            ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300"
            : "bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300"
        }`}
      >
        {isHttps ? <ShieldCheck size={28} /> : <ShieldAlert size={28} />}
      </div>
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-3 flex-wrap">
          <h2
            className={`text-lg font-bold tracking-tight ${
              isHttps ? "text-emerald-800 dark:text-emerald-200" : "text-rose-800 dark:text-rose-200"
            }`}
          >
            {isHttps ? "Transport: TLS 1.3 (ENCRYPTED)" : "Transport: PLAIN HTTP (EXPOSED TO MITM)"}
          </h2>
          <span
            className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border font-mono ${
              isHttps
                ? "bg-white dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800"
                : "bg-white dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800"
            }`}
          >
            {session.protocol}//{session.host}
          </span>
        </div>
        <p
          className={`text-sm ${
            isHttps ? "text-emerald-700 dark:text-emerald-300" : "text-rose-700 dark:text-rose-300"
          }`}
        >
          {isHttps
            ? "Every byte between your browser and the server is encrypted with TLS. A LAN attacker sniffing this connection sees only TCP handshake and Application Data records — no readable URL, no cookies, no auth token."
            : "Every byte between your browser and the server travels in cleartext. A LAN attacker (rogue WiFi AP / ARP spoof / malicious proxy) reads everything you see below and can hijack the session by stealing the auth token."}
        </p>
        <p
          className={`text-xs font-mono ${
            isHttps ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
          }`}
        >
          To switch state: stop dev server (Ctrl+C) → run{" "}
          <code className="bg-white/60 dark:bg-black/40 px-1.5 py-0.5 rounded">
            {isHttps ? "npm run dev" : "npm run dev:https"}
          </code>{" "}
          → reload this page.
        </p>
      </div>
    </div>
  );
}

function AttackerCapturePanel({
  session,
  isHttps,
  revealToken,
  onToggleReveal,
}: {
  session: CapturedSession | null;
  isHttps: boolean;
  revealToken: boolean;
  onToggleReveal: () => void;
}) {
  if (!session) return null;

  const blurClass = isHttps ? "blur-sm select-none" : "";
  const tokenDisplay = session.idToken
    ? revealToken
      ? session.idToken
      : `${session.idToken.slice(0, 48)}...${session.idToken.slice(-32)}`
    : "(no Firebase ID token in this session)";

  return (
    <div className="bg-slate-900 dark:bg-slate-950 rounded-xl border border-slate-800 overflow-hidden font-mono">
      <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between bg-black/40">
        <div className="flex items-center gap-2 text-slate-200">
          <Wifi size={14} className={isHttps ? "text-emerald-400" : "text-rose-400 animate-pulse"} />
          <span className="text-xs font-bold tracking-wider uppercase">
            {isHttps ? "Captured Frame · TLS Encrypted" : "Captured Frame · Plaintext"}
          </span>
        </div>
        <span className="text-[10px] text-slate-500">tcp.port == 3000</span>
      </div>

      <div className="p-5 space-y-4 text-[11px] leading-relaxed">

        {/* Frame metadata */}
        <div>
          <p className="text-slate-500 mb-1">// Wire</p>
          <pre className={`whitespace-pre-wrap break-all text-slate-200 ${blurClass}`}>
{`captured_at  ${session.capturedAt}
src          ${session.host} -> dev-server
protocol     ${session.protocol.replace(":", "").toUpperCase()}
url          ${session.protocol}//${session.host}${session.pathname}
user_agent   ${session.userAgent}`}
          </pre>
        </div>

        {/* Auth headers */}
        <div>
          <p className="text-slate-500 mb-1">
            // HTTP request headers — Authorization carries the Firebase ID token
          </p>
          <pre className={`whitespace-pre-wrap break-all ${blurClass}`}>
            <span className="text-sky-300">Host:</span>{" "}
            <span className="text-slate-200">{session.host}</span>
            {"\n"}
            <span className="text-sky-300">Authorization:</span>{" "}
            <span className="text-amber-300">Bearer </span>
            <span className={isHttps ? "text-slate-400" : "text-rose-300"}>
              {tokenDisplay}
            </span>
            {"\n"}
            <span className="text-sky-300">Cookie:</span>{" "}
            <span className="text-slate-200">{session.cookies}</span>
          </pre>
          {session.idToken && (
            <button
              onClick={onToggleReveal}
              className="mt-2 inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold text-indigo-400 hover:text-indigo-300"
            >
              <Eye size={11} />
              {revealToken ? "Hide full token" : "Reveal full token (what attacker sees)"}
            </button>
          )}
        </div>

        {/* Account context */}
        <div>
          <p className="text-slate-500 mb-1">// Authenticated identity</p>
          <pre className={`whitespace-pre-wrap break-all text-slate-200 ${blurClass}`}>
{`email  ${session.email ?? "(anonymous)"}
uid    ${session.uid ?? "(anonymous)"}`}
          </pre>
        </div>

        {/* Verdict */}
        <div
          className={`rounded-lg border px-3 py-2.5 text-xs ${
            isHttps
              ? "bg-emerald-950/40 border-emerald-900/60 text-emerald-300"
              : "bg-rose-950/40 border-rose-900/60 text-rose-300"
          }`}
        >
          {isHttps ? (
            <span className="flex items-start gap-2">
              <Lock size={12} className="mt-0.5" />
              On the wire this entire frame is wrapped inside TLS Application
              Data records. The attacker sees ciphertext only — the fields
              shown above (blurred) are recovered only because YOUR browser
              has the session key.
            </span>
          ) : (
            <span className="flex items-start gap-2">
              <Unlock size={12} className="mt-0.5" />
              These bytes travel in cleartext over the LAN. Anyone on the
              same WiFi / switch / VPN tap captures this verbatim with
              tcpdump or Wireshark — and can replay the Bearer token to
              impersonate this admin.
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function DefenseStatusPanel({ isHttps }: { isHttps: boolean }) {
  const rows = [
    {
      label: "TLS Transport",
      ok: isHttps,
      detail: isHttps ? "TLS 1.3 active" : "HTTP — no encryption",
    },
    {
      label: "HSTS Header",
      ok: isHttps,
      detail: isHttps
        ? "Strict-Transport-Security accepted by browser"
        : "Header sent but ignored on HTTP origin",
    },
    {
      label: "Cookie Secure flag",
      ok: isHttps,
      detail: isHttps ? "Cookies bound to HTTPS only" : "Secure flag prevents send on HTTP",
    },
    {
      label: "Mixed-content guard",
      ok: isHttps,
      detail: isHttps ? "Browser blocks downgrade requests" : "N/A on plain HTTP origin",
    },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800/80 shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-200/60 dark:border-slate-800/80">
        <h3 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
          Defense Posture
        </h3>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
          Derived from <code>window.location.protocol</code>
        </p>
      </div>
      <ul className="divide-y divide-slate-100 dark:divide-slate-800">
        {rows.map((r) => (
          <li key={r.label} className="px-5 py-3 flex items-start gap-3">
            <span
              className={`mt-0.5 inline-flex items-center justify-center w-5 h-5 rounded-full text-white text-[10px] font-bold ${
                r.ok ? "bg-emerald-500" : "bg-rose-500"
              }`}
            >
              {r.ok ? "✓" : "✕"}
            </span>
            <div className="flex-1">
              <p className="text-sm font-bold text-slate-900 dark:text-white">{r.label}</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">{r.detail}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ComparisonTable({ isHttps }: { isHttps: boolean }) {
  const rows: { label: string; httpVal: string; httpsVal: string }[] = [
    { label: "Auth token (Bearer ...)", httpVal: "fully readable", httpsVal: "ciphertext only" },
    { label: "URL + query string", httpVal: "fully readable", httpsVal: "ciphertext only" },
    { label: "Cookies", httpVal: "fully readable", httpsVal: "ciphertext only" },
    { label: "Form posts (password)", httpVal: "fully readable", httpsVal: "ciphertext only" },
    { label: "Replay-the-token attack", httpVal: "trivial", httpsVal: "requires breaking TLS" },
    { label: "Inject script into response", httpVal: "trivial (MITM XSS)", httpsVal: "TLS integrity blocks" },
  ];
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800/80 shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-200/60 dark:border-slate-800/80 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
            What the LAN Sniffer Sees
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Side by side — the AFTER column is what protects this session today.
          </p>
        </div>
        <span
          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded border ${
            isHttps
              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/40"
              : "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900/40"
          }`}
        >
          Active mode: {isHttps ? "AFTER (HTTPS)" : "BEFORE (HTTP)"}
        </span>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 bg-slate-50/60 dark:bg-slate-950/40">
            <th className="text-left px-5 py-2 font-bold">Field</th>
            <th className={`text-left px-5 py-2 font-bold ${!isHttps ? "text-rose-600 dark:text-rose-400" : ""}`}>
              BEFORE — HTTP
            </th>
            <th className={`text-left px-5 py-2 font-bold ${isHttps ? "text-emerald-600 dark:text-emerald-400" : ""}`}>
              AFTER — HTTPS
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {rows.map((r) => (
            <tr key={r.label}>
              <td className="px-5 py-2.5 font-mono text-xs text-slate-800 dark:text-slate-200">
                {r.label}
              </td>
              <td className={`px-5 py-2.5 text-xs ${!isHttps ? "font-bold text-rose-700 dark:text-rose-400" : "text-slate-500 dark:text-slate-400"}`}>
                <AlertTriangle size={11} className="inline mr-1" />
                {r.httpVal}
              </td>
              <td className={`px-5 py-2.5 text-xs ${isHttps ? "font-bold text-emerald-700 dark:text-emerald-400" : "text-slate-500 dark:text-slate-400"}`}>
                <Lock size={11} className="inline mr-1" />
                {r.httpsVal}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
