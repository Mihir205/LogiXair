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
      <div className="space-y-6 max-w-[1400px] mx-auto bg-slate-50 antialiased selection:bg-indigo-600/10 selection:text-indigo-700">
        
        {/* CLASSIC B2B HEADER BLOCK */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-slate-200/60">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Station Control
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">
              Execute low-latency hardware triggers, force data uploads, and override system links.
            </p>
          </div>
          
          <div className="inline-flex items-center self-start md:self-auto gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-200/80 shadow-sm">
            <Settings size={14} className="text-indigo-600" />
            <span className="text-xs font-semibold tracking-wide text-slate-700">Hardware Access Unlocked</span>
          </div>
        </div>

        {/* CONTROLS COMPONENT CONTAINER MODULE */}
        <div className="bg-white p-6 rounded-xl border border-slate-200/60 shadow-sm flex flex-col transition-all duration-200 hover:border-slate-300">
          <div className="pb-3 border-b border-slate-100 mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold tracking-tight text-slate-900">Direct Command Execution</h2>
              <p className="text-xs text-slate-500 mt-0.5">Triggers override requests onto the microcontroller hardware network.</p>
            </div>
            <SlidersHorizontal size={15} className="text-slate-400" />
          </div>

          {/* MODERNIZED B2B PREMIUM BUTTON CONSTRUCTS */}
          <div className="flex flex-wrap gap-4">
            <button className="inline-flex items-center justify-center gap-2 bg-emerald-600 text-white font-semibold text-xs tracking-wide uppercase px-5 py-3 rounded-lg border border-emerald-700 shadow-sm transition-all duration-200 hover:bg-emerald-500 hover:border-emerald-600 focus:outline-none cursor-pointer active:scale-[0.98]">
              <RefreshCw size={13} className="animate-spin-slow" />
              Restart Station
            </button>

            <button className="inline-flex items-center justify-center gap-2 bg-indigo-600 text-white font-semibold text-xs tracking-wide uppercase px-5 py-3 rounded-lg border border-indigo-700 shadow-sm transition-all duration-200 hover:bg-indigo-500 hover:border-indigo-600 focus:outline-none cursor-pointer active:scale-[0.98]">
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