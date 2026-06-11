"use client";

import RouteGuard from "../../components/RouteGuard";
import AuthGuard from "../../components/AuthGuard";
import DashboardLayout from "../../components/DashboardLayout";
import { Settings, RefreshCw, SlidersHorizontal } from "lucide-react";

export default function ControlPage() {
  return (
    <AuthGuard>
      <RouteGuard allowedRole="operator">
        <DashboardLayout role="operator">
          <div className="space-y-6 max-w-[1400px] mx-auto bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased selection:bg-indigo-600/10 selection:text-indigo-700 transition-colors duration-200">
            
            {/* CLASSIC B2B HEADER BLOCK */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-slate-200/60 dark:border-slate-800/80">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Station Control
                </h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
                  Execute low-latency hardware triggers, force data uploads, and override system links.
                </p>
              </div>
              
              <div className="inline-flex items-center self-start md:self-auto gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm transition-colors duration-200">
                <Settings size={14} className="text-indigo-600 dark:text-indigo-400" />
                <span className="text-xs font-semibold tracking-wide text-slate-700 dark:text-slate-300">Hardware Access Unlocked</span>
              </div>
            </div>

            {/* CONTROLS COMPONENT CONTAINER MODULE */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200/60 dark:border-slate-800/80 shadow-sm flex flex-col transition-all duration-200 hover:border-slate-300 dark:hover:border-slate-800">
              <div className="pb-3 border-b border-slate-100 dark:border-slate-800 mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">Direct Command Execution</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Triggers override requests onto the microcontroller hardware network.</p>
                </div>
                <SlidersHorizontal size={15} className="text-slate-400 dark:text-slate-500" />
              </div>

              {/* MODERNIZED B2B PREMIUM BUTTON CONSTRUCTS WITH DARK MODE SUPPORT */}
              <div className="flex flex-wrap gap-4">
                <button className="inline-flex items-center justify-center gap-2 bg-emerald-600 dark:bg-emerald-700 text-white font-semibold text-xs tracking-wide uppercase px-5 py-3 rounded-lg border border-emerald-700 dark:border-emerald-800 shadow-sm transition-all duration-200 hover:bg-emerald-500 dark:hover:bg-emerald-600 focus:outline-none cursor-pointer active:scale-[0.98]">
                  <RefreshCw size={13} className="animate-spin" style={{ animationDuration: '3s' }} />
                  Restart Station
                </button>

                <button className="inline-flex items-center justify-center gap-2 bg-indigo-600 dark:bg-indigo-700 text-white font-semibold text-xs tracking-wide uppercase px-5 py-3 rounded-lg border border-indigo-700 dark:border-indigo-800 shadow-sm transition-all duration-200 hover:bg-indigo-500 dark:hover:bg-indigo-600 focus:outline-none cursor-pointer active:scale-[0.98]">
                  <RefreshCw size={13} />
                  Sync Data
                </button>
              </div>
            </div>

          </div>
        </DashboardLayout>
      </RouteGuard>
    </AuthGuard>
  );
}