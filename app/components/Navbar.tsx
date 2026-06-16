// components/Navbar.tsx
"use client";

import { Bell, UserCircle, LogOut, Sun, Moon, Lock, ShieldOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function Navbar() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevents hydration UI mismatches on the toggle icon
  const [isHttps, setIsHttps] = useState(false);
  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      setIsHttps(window.location.protocol === "https:");
    }
  }, []);

  const handleLogout = () => {
    try {
      router.push("/");
    } catch (error) {
      console.error("Authentication Session Termination Error:", error);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border-b border-slate-200/60 dark:border-slate-800 px-8 py-4 flex justify-between items-center sticky top-0 z-50 transition-colors duration-200">
      
      {/* LEFT AREA */}
      <div>
        <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Weather Intelligence Dashboard
        </h2>
      </div>

      {/* RIGHT AREA */}
      <div className="flex items-center gap-5">

        {/* TLS / MITM-protection badge — driven by window.location.protocol */}
        {mounted && (
          <span
            title={isHttps ? "Transport: TLS 1.3 (HTTPS)" : "Transport: PLAINTEXT (HTTP) — vulnerable to MITM"}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wider uppercase border ${
              isHttps
                ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/40"
                : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/40"
            }`}
          >
            {isHttps ? <Lock size={11} /> : <ShieldOff size={11} />}
            {isHttps ? "TLS Secured" : "Plain HTTP"}
          </span>
        )}

        {/* THEME TOGGLE BUTTON */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl transition-all duration-200 cursor-pointer shadow-sm"
          title="Toggle Theme Mode"
        >
          {mounted && theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="p-2 text-slate-400 hover:text-rose-600 bg-white dark:bg-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-700/50 border border-slate-200 dark:border-slate-700 rounded-xl transition-all duration-200 cursor-pointer shadow-sm"
          title="Log Out"
        >
          <LogOut size={18} />
        </button>

        <div className="h-6 w-px bg-slate-200 dark:bg-slate-700" />

        {/* User Profile */}
        <div className="flex items-center gap-3 pl-1 cursor-default group select-none">
          <div className="p-0.5 border border-slate-200 dark:border-slate-700 rounded-full bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 transition-transform duration-200 group-hover:scale-105">
            <UserCircle size={26} className="rounded-full" />
          </div>

          <div className="flex flex-col text-left">
            <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Mihir
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
              Logged In
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}