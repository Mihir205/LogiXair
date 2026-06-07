"use client";
import RouteGuard from "../../components/RouteGuard";
import AuthGuard from "../../components/AuthGuard";
import DashboardLayout from "../../components/DashboardLayout";
import { Cpu, CheckCircle2, BarChart2 } from "lucide-react";

export default function DiagnosticsPage() {
  return (
    <AuthGuard>
    <RouteGuard allowedRole="operator">
    <DashboardLayout role="operator">
      <div className="space-y-6 max-w-[1400px] mx-auto bg-slate-50 antialiased selection:bg-indigo-600/10 selection:text-indigo-700">
        
        {/* CLASSIC B2B HEADER BLOCK */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-slate-200/60">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Diagnostics
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">
              Live calculation matrix, embedded memory mapping, and structural hardware parameters.
            </p>
          </div>
          
          <div className="inline-flex items-center self-start md:self-auto gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-200/80 shadow-sm">
            <Cpu size={14} className="text-indigo-600" />
            <span className="text-xs font-semibold tracking-wide text-slate-700">Core Engine Nominal</span>
          </div>
        </div>

        {/* DIAGNOSTICS CONTAINER MODULE */}
        <div className="bg-white p-6 rounded-xl border border-slate-200/60 shadow-sm flex flex-col justify-between transition-all duration-200 hover:border-slate-300">
          <div>
            <div className="pb-3 border-b border-slate-100 mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold tracking-tight text-slate-900">Computational Status</h2>
                <p className="text-xs text-slate-500 mt-0.5">Microcontroller runtime telemetry metrics.</p>
              </div>
              <BarChart2 size={15} className="text-slate-400" />
            </div>

            <div className="space-y-1.5">
              <DiagnosticMetricRow label="CPU Usage : 34%" details="Core compute workload context" value="34%" loadPercent={34} />
              <DiagnosticMetricRow label="Memory Usage : 40%" details="Dynamic static RAM resource mapping" value="40%" loadPercent={40} />
              <DiagnosticMetricRow label="Sensor Status : OK" details="Peripheral I2C hardware bus verification" value="OK" isStatus={true} />
            </div>
          </div>
        </div>

      </div>
    </DashboardLayout>
    </RouteGuard>
    </AuthGuard>
  );
}

function DiagnosticMetricRow({ label, details, value, loadPercent, isStatus }: any) {
  return (
    <div className="bg-slate-50/40 hover:bg-slate-50 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border border-slate-100 transition-colors duration-150">
      <div className="space-y-1 flex-1">
        <div className="flex items-center gap-2">
          {!isStatus && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />}
          {isStatus && <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />}
          <h4 className="text-sm font-bold text-slate-800 leading-none">{label}</h4>
        </div>
        <p className="text-xs text-slate-400 font-medium pl-3.5 sm:pl-0">{details}</p>
        
        {/* Modern micro progress indicator line for resource loads */}
        {loadPercent && (
          <div className="w-full max-w-xs h-1 bg-slate-200/60 rounded-full overflow-hidden mt-2 ml-3.5 sm:ml-0">
            <div className="bg-indigo-600 h-full transition-all duration-300" style={{ width: `${loadPercent}%` }} />
          </div>
        )}
      </div>
      
      <span className={`text-xs font-bold px-2.5 py-1 rounded border tracking-wide ${
        isStatus ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-white text-slate-700 border-slate-200/60 shadow-sm"
      }`}>
        {value}
      </span>
    </div>
  );
}