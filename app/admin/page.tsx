"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { supabase } from "../../lib/supabase";

interface Station {
  id: number;
  station_name: string;
  location: string;
  status: string;
  battery: number;
  last_seen: string;
}

export default function AdminPage() {
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStations();
  }, []);

  async function fetchStations() {
    const { data, error } = await supabase
      .from("stations")
      .select("*");

    if (error) {
      console.error("Error fetching telemetry fleet data:", error);
      return;
    }

    setStations(data || []);
    setLoading(false);
  }

  const totalStations = stations.length;
  const activeStations = stations.filter((s) => s.status === "Online").length;
  const offlineStations = stations.filter((s) => s.status === "Offline").length;
  const warningStations = stations.filter((s) => s.status === "Warning").length;

  // Helper to determine battery health bar hue dynamically
  const getBatteryColor = (level: number) => {
    if (level > 50) return "bg-emerald-500";
    if (level > 20) return "bg-amber-500";
    return "bg-rose-500";
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-[1600px] mx-auto p-4 md:p-6 animate-fade-in">
        
        {/* Top Operational Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Admin Control Center
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Real-time hardware operational metrics and system node configuration.
            </p>
          </div>
          
          {/* Inline Primary Quick Action */}
          <button className="inline-flex items-center justify-center bg-slate-900 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-800 transition shadow-xs focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 cursor-pointer">
            <span className="mr-1.5 font-semibold">+</span> Add New Station
          </button>
        </div>

        {/* Scaled Minimal System Overview Counters */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { label: "Total Asset Fleet", val: totalStations, style: "text-slate-900" },
            { label: "Active Nodes", val: activeStations, style: "text-emerald-600" },
            { label: "Offline Nodes", val: offlineStations, style: "text-rose-600" },
            { label: "Diagnostics Warnings", val: warningStations, style: "text-amber-600" }
          ].map((card, idx) => (
            <div key={idx} className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                {card.label}
              </p>
              <h2 className={`text-3xl font-bold mt-2 tracking-tight ${card.style}`}>
                {loading ? "—" : card.val}
              </h2>
            </div>
          ))}
        </div>

        {/* Configuration Utilities Panel */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
            System Administration Tools
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button className="inline-flex items-center justify-center bg-white border border-slate-200 text-slate-700 p-3 rounded-lg text-sm font-medium hover:bg-slate-50 hover:text-slate-900 transition shadow-xs cursor-pointer">
              Provision Operator Access
            </button>
            <button className="inline-flex items-center justify-center bg-white border border-slate-200 text-slate-700 p-3 rounded-lg text-sm font-medium hover:bg-slate-50 hover:text-slate-900 transition shadow-xs cursor-pointer">
              Configure End-User Access
            </button>
            <button className="inline-flex items-center justify-center bg-white border border-slate-200 text-slate-700 p-3 rounded-lg text-sm font-medium hover:bg-slate-50 hover:text-slate-900 transition shadow-xs cursor-pointer">
              Export Network Topology Report
            </button>
          </div>
        </div>

        {/* Fleet Deployment Layout */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">
              Station Overview
            </h2>
            <span className="text-xs text-slate-400 font-medium">
              {!loading && `${stations.length} hardware targets active`}
            </span>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12 text-slate-400 text-sm">
                <span className="animate-pulse">Querying cloud registry...</span>
              </div>
            ) : stations.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm">
                No active stations found in this deployment group.
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {stations.map((station) => (
                  <div
                    key={station.id}
                    className="group bg-slate-50/50 border border-slate-200/60 rounded-xl p-5 hover:border-slate-300 hover:bg-white transition-all duration-200"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h3 className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors text-base">
                          {station.station_name}
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {station.location}
                        </p>
                      </div>

                      {/* Monochromatic Status Indicators */}
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium tracking-wide ${
                        station.status === "Online" ? "bg-emerald-50 text-emerald-700 border border-emerald-200/50" :
                        station.status === "Offline" ? "bg-rose-50 text-rose-700 border border-rose-200/50" :
                        "bg-amber-50 text-amber-700 border border-amber-200/50"
                      }`}>
                        {station.status}
                      </span>
                    </div>

                    {/* Hardware Telemetry Parameters */}
                    <div className="mt-6 space-y-4">
                      <div>
                        <div className="flex justify-between text-xs font-medium text-slate-400 mb-1">
                          <span>Battery Level</span>
                          <span className="text-slate-700 font-mono">{station.battery}%</span>
                        </div>
                        <div className="w-full bg-slate-200/70 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-1.5 rounded-full transition-all duration-500 ${getBatteryColor(station.battery)}`}
                            style={{ width: `${station.battery}%` }}
                          />
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-200/40 flex justify-between items-center text-xs">
                        <span className="text-slate-400 font-medium">Last Broadcast</span>
                        <span className="text-slate-600 font-mono">
                          {new Date(station.last_seen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Real-Time Platform Event Feed */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-6">
          <h2 className="text-base font-semibold text-slate-900 mb-4">
            Recent System Ingestion Activity
          </h2>

          <div className="divide-y divide-slate-100 text-sm">
            {[
              { status: "emerald", txt: "Station-01 established stable cellular socket attachment via LTE-M." },
              { status: "slate", txt: "Operator profile created for credential tier [FIELD_TECH_LEVEL_2]." },
              { status: "rose", txt: "Station-03 missed keepalive threshold window. Flagging node as Offline." },
              { status: "amber", txt: "Station-04 reports anomalous solar panel voltage dip (Low Irradiance conversion)." }
            ].map((act, i) => (
              <div key={i} className="py-3 flex items-start gap-3 first:pt-0 last:pb-0">
                <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                  act.status === "emerald" ? "bg-emerald-500" :
                  act.status === "rose" ? "bg-rose-500" :
                  act.status === "amber" ? "bg-amber-500" : "bg-slate-400"
                }`} />
                <p className="text-slate-600 font-normal tracking-tight">{act.txt}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}