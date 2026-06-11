"use client";

import DashboardLayout from "../../components/DashboardLayout";
import { MapPinned } from "lucide-react";
import useUserRole from "../../../lib/useUserRole";
import AuthGuard from "../../components/AuthGuard";
import RouteGuard from "../../components/RouteGuard";

export default function UserMapPage() {
  const { role, loading } = useUserRole();

  if (loading || !role) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-3 bg-white dark:bg-slate-900 px-6 py-4 rounded-xl border border-slate-200/60 dark:border-slate-800 shadow-sm">
          <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium tracking-wide">Initializing Spatial Node Maps...</span>
        </div>
      </div>
    );
  }

  return (
    <AuthGuard>
    <RouteGuard allowedRole={role}>
    <DashboardLayout role={role}>
      <div className="space-y-6 max-w-[1400px] mx-auto bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased transition-colors duration-200">
        
        {/* CLASSIC B2B HEADER BLOCK */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-slate-200/60 dark:border-slate-800/80">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Field Station Location
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
              Geographic tracking and live spatial orchestration of deployed weather infrastructure.
            </p>
          </div>
          
          <div className="inline-flex items-center self-start md:self-auto gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm transition-colors duration-200">
            <MapPinned size={14} className="text-indigo-600 dark:text-indigo-400" />
            <span className="text-xs font-semibold tracking-wide text-slate-700 dark:text-slate-300">Geo-spatial Overview</span>
          </div>
        </div>

        {/* PREMIUM MAP CONTAINER MODULE */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200/60 dark:border-slate-800/80 shadow-sm flex flex-col transition-all duration-200 hover:border-slate-300 dark:hover:border-slate-800">
          
          {/* Module Header Context */}
          <div className="pb-4 mb-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
                Deployed Node Deployment Grid
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 tracking-tight">Active link: https://maps.google.com/maps?q=hyderabad&t=&z=5&ie=UTF8&iwloc=&output=embed</p>
            </div>
          </div>

          {/* Clinical layout map wrapper with theme variant configurations */}
          <div className="rounded-lg overflow-hidden border border-slate-200/60 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 relative h-[600px] group transition-colors duration-200">
            
            {/* Subtle Overlay Accent when hovered */}
            <div className="absolute inset-0 bg-slate-900/5 dark:bg-slate-950/20 group-hover:bg-transparent pointer-events-none transition-colors duration-300 z-10" />
            
            <iframe
              src="https://maps.google.com/maps?q=hyderabad&t=&z=5&ie=UTF8&iwloc=&output=embed"
              className="w-full h-full border-0 focus:outline-none saturate-[0.8] dark:invert dark:hue-rotate-180 dark:opacity-75 relative z-0 transition-all duration-200"
              loading="lazy"
              title="Global Node Tracking Map"
            />
          </div>
          
        </div>
      </div>
    </DashboardLayout>
    </RouteGuard>
    </AuthGuard>
  );
}