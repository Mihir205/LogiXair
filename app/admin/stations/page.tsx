"use client";

import DashboardLayout from "../../components/DashboardLayout";
import { Radio, Plus, Layers, MapPin, Signal } from "lucide-react";

export default function StationsPage() {
  return (
    <DashboardLayout role="admin">
      <div className="space-y-6 max-w-[1400px] mx-auto bg-slate-50 antialiased selection:bg-indigo-600/10 selection:text-indigo-700">
        
        {/* CLASSIC B2B HEADER BLOCK */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-slate-200/60">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Station Management
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">
              Provision remote hardware installations, scale telemetry data frequencies, and handle deployment metadata.
            </p>
          </div>
          
          <button className="inline-flex items-center justify-center gap-1.5 bg-indigo-600 text-white font-semibold text-xs tracking-wide uppercase px-4 py-2.5 rounded-lg border border-indigo-700 shadow-sm transition-all duration-200 hover:bg-indigo-500 hover:border-indigo-600 focus:outline-none cursor-pointer active:scale-[0.98]">
            <Plus size={14} />
            Add Station
          </button>
        </div>

        {/* STATIONS LIST CONTAINER */}
        <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden transition-all duration-200 hover:border-slate-300">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold tracking-tight text-slate-900">Active Deployed Nodes</h2>
              <p className="text-xs text-slate-500 mt-0.5">Physical telemetry broadcast arrays.</p>
            </div>
            <Layers size={15} className="text-slate-400" />
          </div>

          <div className="divide-y divide-slate-100">
            <StationListItem identity="Station-01" regionalMeta="Campus Main Quad Array" nodeState="Optimal Link" />
            <StationListItem identity="Station-02" regionalMeta="Solar Range Test Block" nodeState="Optimal Link" />
            <StationListItem identity="Station-03" regionalMeta="Atmospheric Tower Cluster" nodeState="Optimal Link" />
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}

function StationListItem({ identity, regionalMeta, nodeState }: any) {
  return (
    <div className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:bg-slate-50/50 transition-colors duration-150">
      <div className="flex items-start gap-3.5">
        <div className="p-2 bg-slate-50 rounded-lg border border-slate-200/60 text-slate-600 mt-0.5">
          <Radio size={15} />
        </div>
        <div className="space-y-0.5">
          <h4 className="text-sm font-bold text-slate-800 tracking-tight">{identity}</h4>
          <div className="flex items-center gap-1 text-slate-400 text-xs font-medium">
            <MapPin size={12} className="text-slate-300 shrink-0" />
            <span>{regionalMeta}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 self-start sm:self-auto">
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide bg-emerald-50 text-emerald-700 border border-emerald-100 uppercase">
          <Signal size={10} className="text-emerald-500" />
          {nodeState}
        </span>
      </div>
    </div>
  );
}