"use client";

import { MapPin, Radio } from "lucide-react";
import StatusBadge from "./StatusBadge";

interface StationCardProps {
  station: string;
  location: string;
  status: "Online" | "Offline" | "Warning";
}

export default function StationCard({
  station,
  location,
  status,
}: StationCardProps) {
  return (
    <div className="bg-slate-900/60 backdrop-blur-sm rounded-xl border border-slate-800/80 p-5 flex flex-col justify-between transition-all duration-200 hover:border-slate-700/60 hover:bg-slate-800/40 group">
      <div>
        {/* Card Header Label Area */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h3 className="font-semibold text-base text-slate-100 group-hover:text-white transition-colors duration-200 tracking-tight">
              {station}
            </h3>
            
            {/* Geographic Metadata Subtext */}
            <div className="flex items-center gap-1.5 text-slate-400 text-xs">
              <MapPin size={13} className="text-slate-500 shrink-0" />
              <p className="truncate tracking-wide">{location}</p>
            </div>
          </div>

          {/* Infrastructure Decorative Visual Node */}
          <div className="p-2 bg-slate-800/40 rounded-lg border border-slate-800 group-hover:border-slate-700/60 group-hover:bg-slate-800/80 transition-all duration-200">
            <Radio size={16} className="text-slate-400 group-hover:text-indigo-400 transition-colors duration-200" />
          </div>
        </div>
      </div>

      {/* Component Footer Layer */}
      <div className="mt-5 pt-3 border-t border-slate-800/60 flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
          System Status
        </span>
        <StatusBadge status={status} />
      </div>
    </div>
  );
}