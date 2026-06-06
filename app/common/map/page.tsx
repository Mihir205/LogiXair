"use client";

// CORRECTION: Switched to relative import path
import DashboardLayout from "../../components/DashboardLayout";
import { MapPinned } from "lucide-react";

export default function UserMapPage() {
  return (
      <div className="space-y-6 max-w-[1400px] mx-auto bg-slate-50 antialiased selection:bg-indigo-600/10 selection:text-indigo-700">
        
        {/* CLASSIC B2B HEADER BLOCK */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-slate-200/60">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Field Station Location
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">
              Geographic tracking and live spatial orchestration of deployed weather infrastructure.
            </p>
          </div>
          
          <div className="inline-flex items-center self-start md:self-auto gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-200/80 shadow-sm">
            <MapPinned size={14} className="text-indigo-600" />
            <span className="text-xs font-semibold tracking-wide text-slate-700">Geo-spatial Overview</span>
          </div>
        </div>

        {/* PREMIUM MAP CONTAINER MODULE */}
        <div className="bg-white p-6 rounded-xl border border-slate-200/60 shadow-sm flex flex-col transition-all duration-200 hover:border-slate-300">
          
          {/* Module Header Context */}
          <div className="pb-4 mb-5 border-b border-slate-100 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold tracking-tight text-slate-900 leading-tight">
                Deployed Node Deployment Grid
              </h2>
              <p className="text-xs text-slate-500 mt-0.5 tracking-tight">Active link: https://maps.google.com/maps?q=hyderabad&t=&z=5&ie=UTF8&iwloc=&output=embed</p>
            </div>
          </div>

          {/* Clinical light-mode map layout */}
          <div className="rounded-lg overflow-hidden border border-slate-200/60 bg-slate-50 relative h-[600px] group">
            
            {/* Subtle Overlay Accent when hovered */}
            <div className="absolute inset-0 bg-slate-900/5 group-hover:bg-transparent pointer-events-none transition-colors duration-300 z-10" />
            
            <iframe
              src="https://maps.google.com/maps?q=hyderabad&t=&z=5&ie=UTF8&iwloc=&output=embed"
              className="w-full h-full border-0 focus:outline-none saturate-[0.8] relative z-0"
              loading="lazy"
              title="Global Node Tracking Map"
            />
          </div>
          
        </div>
      </div>
  );
}