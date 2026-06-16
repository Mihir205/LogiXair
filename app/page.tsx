"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Shield,
  User,
  Settings,
  CloudSun,
  Lock,
  UserCircle,
  AlertCircle,
} from "lucide-react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, firestore } from "../lib/firebase";

import {
  doc,
  getDoc,
} from "firebase/firestore";

import {
  readLockout,
  recordFailure,
  resetLockout,
  formatRemaining,
  MAX_ATTEMPTS,
} from "../lib/lockout";

export default function HomePage() {
  const router = useRouter();
  const [role, setRole] = useState("user");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Brute-force lockout banner state
  const [errorMsg, setErrorMsg] = useState("");
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);
  const [lockSecondsLeft, setLockSecondsLeft] = useState(0);

  // Live 15-min countdown timer
  useEffect(() => {
    if (lockSecondsLeft <= 0) return;
    const t = setInterval(() => setLockSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [lockSecondsLeft]);

  // Login + lockout enforcement (mirrors FastAPI /auth/login behaviour:
  // 5 wrong attempts -> 15 min lock, auto-unlock when timer expires).
  const handleLogin = async () => {
    setErrorMsg("");
    if (!email || !password) {
      setErrorMsg("Enter email and password.");
      return;
    }
    setLoading(true);
    try {
      // Pre-flight: refuse to even contact Firebase if account is locked.
      const pre = await readLockout(email);
      if (pre.is_locked) {
        setLockSecondsLeft(pre.lock_seconds_remaining);
        setAttemptsRemaining(0);
        setErrorMsg(
          `Account locked. Auto-unlocks in ${formatRemaining(pre.lock_seconds_remaining)}.`
        );
        return;
      }

      try {
        const credential = await signInWithEmailAndPassword(
          auth,
          email.trim(),
          password.trim()
        );

        const uid = credential.user.uid;

        const userRef = doc(firestore, "users", uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          await auth.signOut();
          setErrorMsg("User role record not found. Contact administrator.");
          return;
        }

        const firestoreRole = userSnap.data().role;
        if (firestoreRole !== role) {
          await auth.signOut();
          setErrorMsg(
            `Access denied. Selected role "${role}" does not match account role "${firestoreRole}".`
          );
          return;
        }
        // Successful login -> reset failed-attempt counter.
        await resetLockout(email);
        if (firestoreRole === "admin") {
          router.push("/admin");
        } else if (firestoreRole === "operator") {
          router.push("/operator");
        } else {
          router.push("/user");
        }
      } catch (authErr: any) {
        // Wrong password / unknown user -> log a failed attempt.
        const status = await recordFailure(email);
        setAttemptsRemaining(status.attempts_remaining);
        if (status.is_locked) {
          setLockSecondsLeft(status.lock_seconds_remaining);
          setErrorMsg(
            `Too many failed attempts. Account locked for 15 min. Auto-unlocks in ${formatRemaining(status.lock_seconds_remaining)}.`
          );
        } else {
          setErrorMsg(
            `Invalid credentials — ${status.attempts_remaining} of ${MAX_ATTEMPTS} attempt${status.attempts_remaining === 1 ? "" : "s"} remaining.`
          );
        }
      }
    } catch (outer: any) {
      console.error(outer);
      setErrorMsg(outer?.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 grid grid-cols-1 md:grid-cols-2 antialiased selection:bg-indigo-600/10 selection:text-indigo-700">

      {/* LEFT SIDE: MINIMAL ENTERPRISE HERO */}
      <div className="bg-slate-900 p-12 md:p-16 lg:p-24 flex flex-col justify-between relative overflow-hidden border-r border-slate-800 min-h-screen">
        {/* Subtle background icon asset */}
        <div className="absolute right-[-60px] top-[-60px] text-slate-800/30 pointer-events-none select-none">
          <CloudSun size={320} className="stroke-[1.2]" />
        </div>

        <div className="my-auto relative z-10 max-w-md space-y-4">
          <p className="text-[10px] font-bold tracking-widest text-indigo-400 uppercase">
            Off-Grid IoT Weather platform
          </p>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white leading-tight">
            LogiXair Intelligence Engine
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed font-medium">
            Real-time monitoring, precision forecasting, historical analytics, station hardware health logs, and automated alerts.
          </p>
        </div>

        <div className="relative z-10 text-[11px] font-medium text-slate-500 tracking-wide">
          &copy; LogiXair Operations. Centralized Grid Environment.
        </div>
      </div>

      {/* RIGHT SIDE: CLEAN ACCESS TERMINAL */}
      <div className="flex flex-col justify-center bg-white min-h-screen px-6 py-12 sm:px-12 lg:px-20">
        <div className="w-full max-w-sm mx-auto space-y-8">

          {/* Header */}
          <div className="space-y-1.5 text-left">
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              Dashboard Login
            </h2>
            <p className="text-slate-400 text-xs font-medium">
              Select an account role and authenticate credentials.
            </p>
          </div>

          {/* Role Grid Controls */}
          <div className="grid grid-cols-3 gap-2">
            {/* User */}
            <button
              onClick={() => setRole("user")}
              disabled={loading}
              className={`rounded-lg border p-3.5 transition-all duration-150 text-left flex flex-col justify-between h-24 group ${loading ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
                } ${role === "user"
                  ? "border-indigo-600 bg-indigo-50/40 ring-1 ring-indigo-600/30"
                  : "border-slate-200 bg-white hover:bg-slate-50/80 hover:border-slate-300"
                }`}
            >
              <User className={`transition-colors ${role === "user" ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-500"}`} size={16} />
              <div>
                <h3 className="text-xs font-bold text-slate-800 leading-none">User</h3>
                <p className="text-[10px] text-slate-400 font-medium mt-1 leading-none">Telemetry</p>
              </div>
            </button>

            {/* Operator */}
            <button
              onClick={() => setRole("operator")}
              disabled={loading}
              className={`rounded-lg border p-3.5 transition-all duration-150 text-left flex flex-col justify-between h-24 group ${loading ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
                } ${role === "operator"
                  ? "border-indigo-600 bg-indigo-50/40 ring-1 ring-indigo-600/30"
                  : "border-slate-200 bg-white hover:bg-slate-50/80 hover:border-slate-300"
                }`}
            >
              <Settings className={`transition-colors ${role === "operator" ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-500"}`} size={16} />
              <div>
                <h3 className="text-xs font-bold text-slate-800 leading-none">Operator</h3>
                <p className="text-[10px] text-slate-400 font-medium mt-1 leading-none">Controls</p>
              </div>
            </button>

            {/* Admin */}
            <button
              onClick={() => setRole("admin")}
              disabled={loading}
              className={`rounded-lg border p-3.5 transition-all duration-150 text-left flex flex-col justify-between h-24 group ${loading ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
                } ${role === "admin"
                  ? "border-indigo-600 bg-indigo-50/40 ring-1 ring-indigo-600/30"
                  : "border-slate-200 bg-white hover:bg-slate-50/80 hover:border-slate-300"
                }`}
            >
              <Shield className={`transition-colors ${role === "admin" ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-500"}`} size={16} />
              <div>
                <h3 className="text-xs font-bold text-slate-800 leading-none">Admin</h3>
                <p className="text-[10px] text-slate-400 font-medium mt-1 leading-none">Management</p>
              </div>
            </button>
          </div>

          {/* Brute-force / lockout banner */}
          {(errorMsg || lockSecondsLeft > 0) && (
            <div
              className={`flex items-start gap-2 rounded-lg border px-3 py-2.5 text-xs font-medium ${lockSecondsLeft > 0
                ? "bg-rose-50 border-rose-200 text-rose-700"
                : attemptsRemaining !== null && attemptsRemaining <= 2
                  ? "bg-amber-50 border-amber-200 text-amber-800"
                  : "bg-rose-50 border-rose-200 text-rose-700"
                }`}
              data-testid="lockout-banner"
            >
              <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
              <div className="space-y-0.5">
                <p>
                  {lockSecondsLeft > 0
                    ? `Account locked. Auto-unlocks in ${formatRemaining(lockSecondsLeft)}.`
                    : errorMsg}
                </p>
                {lockSecondsLeft === 0 && attemptsRemaining !== null && attemptsRemaining > 0 && (
                  <p className="text-[10px] opacity-80">
                    {attemptsRemaining} of {MAX_ATTEMPTS} attempts remaining before 15 min lockout.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Form Credentials */}
          <div className="space-y-3">
            {/* Email Input Field */}
            <div className="relative flex items-center">
              <UserCircle size={15} className="absolute left-3.5 text-slate-400 pointer-events-none" />
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                disabled={loading}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleLogin();
                  }
                }}
                className="w-full h-11 rounded-lg border border-slate-200 pl-10 pr-4 text-xs font-medium text-slate-800 bg-slate-50/40 outline-none focus:border-indigo-500 focus:bg-white transition-all placeholder:text-slate-400 disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>

            {/* Password Input Field */}
            <div className="relative flex items-center">
              <Lock size={15} className="absolute left-3.5 text-slate-400 pointer-events-none" />
              <input
                type="password"
                placeholder="Password"
                value={password}
                disabled={loading}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleLogin();
                  }
                }}
                className="w-full h-11 rounded-lg border border-slate-200 pl-10 pr-4 text-xs font-medium text-slate-800 bg-slate-50/40 outline-none focus:border-indigo-500 focus:bg-white transition-all placeholder:text-slate-400 disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>

            {/* Submission Action Control */}
            <button
              onClick={handleLogin}
              disabled={loading || lockSecondsLeft > 0}
              className="w-full h-11 rounded-lg bg-indigo-600 text-white text-xs font-bold tracking-wider uppercase border border-indigo-700 shadow-sm transition-all hover:bg-indigo-500 hover:border-indigo-600 focus:outline-none cursor-pointer active:scale-[0.99] pt-0.5 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : lockSecondsLeft > 0 ? (
                `Locked — ${formatRemaining(lockSecondsLeft)}`
              ) : (
                "Open Workspace"
              )}
            </button>
          </div>

        </div>
      </div>

    </div>
  );
}