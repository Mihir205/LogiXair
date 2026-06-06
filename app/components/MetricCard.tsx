"use client";

interface MetricCardProps {
  title: string;
  value: string | number;
  unit: string;
}

export default function MetricCard({
  title,
  value,
  unit,
}: MetricCardProps) {
  return (
    <div className="bg-slate-900/60 backdrop-blur-sm rounded-xl border border-slate-800/80 p-5 flex flex-col justify-between transition-all duration-200 hover:border-slate-700/60 hover:bg-slate-800/40 group">
      {/* Label and Subdued Header Context */}
      <div>
        <h3 className="text-slate-400 text-xs font-semibold tracking-wider uppercase">
          {title}
        </h3>
      </div>

      {/* Primary Telemetry Value Display */}
      <div className="mt-3 flex items-baseline gap-1.5">
        <span className="text-3xl font-bold tracking-tight text-white group-hover:text-indigo-400 transition-colors duration-200">
          {value}
        </span>
        
        {/* Unit Measure Layout */}
        {unit && (
          <span className="text-sm font-medium text-slate-500 tracking-normal">
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}