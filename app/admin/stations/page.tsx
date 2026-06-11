"use client";

import AuthGuard from "../../components/AuthGuard";
import RouteGuard from "../../components/RouteGuard";
import DashboardLayout from "../../components/DashboardLayout";

import {
  Radio,
  Plus,
  Layers,
  MapPin,
  Signal,
  X,
  Cpu,
} from "lucide-react";

import { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { firestore } from "@/lib/firebase";

type Station = {
  id: string;
  name: string;
  location: string;
  status: string;
};

export default function StationsPage() {
  const [stations, setStations] = useState<Station[]>([]);
  const [openModal, setOpenModal] = useState(false);

  const [stationName, setStationName] = useState("");
  const [location, setLocation] = useState("");

  // Pure state database transactional pipelines - 100% intact
  const fetchStations = async () => {
    try {
      const snap = await getDocs(collection(firestore, "stations"));
      const data = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Station[];

      setStations(data);
    } catch (error) {
      console.error("Error loading stations:", error);
    }
  };

  useEffect(() => {
    fetchStations();
  }, []);

  const createStation = async () => {
    if (!stationName.trim() || !location.trim()) {
      alert("Please fill all fields");
      return;
    }

    try {
      await addDoc(collection(firestore, "stations"), {
        name: stationName,
        location,
        status: "online",
        createdAt: serverTimestamp(),
      });

      setStationName("");
      setLocation("");
      setOpenModal(false);
      fetchStations();
    } catch (error) {
      console.error("Error creating station:", error);
      alert("Failed to create station");
    }
  };

  return (
    <AuthGuard>
      <RouteGuard allowedRole="admin">
        <DashboardLayout role="admin">
          <div className="space-y-6 max-w-[1400px] mx-auto bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased selection:bg-indigo-600/10 selection:text-indigo-700 transition-colors duration-200">

            {/* CLASSIC B2B HEADER BLOCK */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-slate-200/60 dark:border-slate-800/80">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Station Management
                </h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
                  Provision remote hardware installations, scale telemetry data frequencies, and handle deployment metadata.
                </p>
              </div>

              <button
                onClick={() => setOpenModal(true)}
                className="inline-flex items-center justify-center gap-1.5 bg-indigo-600 dark:bg-indigo-700 text-white font-semibold text-xs tracking-wide uppercase px-4 py-2.5 rounded-lg border border-indigo-700 dark:border-indigo-800 shadow-sm transition-all duration-200 hover:bg-indigo-500 dark:hover:bg-indigo-600 focus:outline-none cursor-pointer active:scale-[0.98]"
              >
                <Plus size={14} />
                Add Station
              </button>
            </div>

            {/* STATION LIST OVERVIEW PANEL */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800/80 shadow-sm overflow-hidden transition-all duration-200 hover:border-slate-300 dark:hover:border-slate-800">
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
                    Active Deployed Nodes
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Physical telemetry broadcast arrays.
                  </p>
                </div>
                <Layers size={15} className="text-slate-400 dark:text-slate-500" />
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {stations.length === 0 ? (
                  <div className="p-8 text-center text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider bg-slate-50/20 dark:bg-slate-950/20">
                    No active stations found inside registry
                  </div>
                ) : (
                  stations.map((station) => (
                    <StationListItem
                      key={station.id}
                      identity={station.name}
                      regionalMeta={station.location}
                      nodeState={station.status}
                    />
                  ))
                )}
              </div>
            </div>
          </div>

          {/* THEME MODAL CONTENT OVERLAY */}
          {openModal && (
            <div className="fixed inset-0 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl w-full max-w-md overflow-hidden transform transition-all duration-200 scale-100 mx-4">
                
                {/* Modal header row */}
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-950/40">
                  <div>
                    <h3 className="font-bold text-sm tracking-tight text-slate-900 dark:text-white">Provision Remote Station</h3>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">Initialize a verified hardware telemetry stream node.</p>
                  </div>
                  <button 
                    onClick={() => setOpenModal(false)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                </div>

                {/* Form fields layout container */}
                <div className="p-6 space-y-4">
                  
                  {/* Station name wrapper */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">Station Asset Identifier</label>
                    <div className="relative flex items-center">
                      <Cpu size={14} className="absolute left-3 text-slate-400 dark:text-slate-500 pointer-events-none" />
                      <input
                        type="text"
                        placeholder="e.g., Solar Node Delta-04"
                        value={stationName}
                        onChange={(e) => setStationName(e.target.value)}
                        className="w-full h-10 text-xs font-medium bg-slate-50/50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 rounded-lg pl-9 pr-4 outline-none focus:border-indigo-500 dark:focus:border-indigo-400 focus:bg-white dark:focus:bg-slate-900 text-slate-900 dark:text-slate-100 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                      />
                    </div>
                  </div>

                  {/* Station geographical location wrapper */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">Geographical Coordinates / Deployment Site</label>
                    <div className="relative flex items-center">
                      <MapPin size={14} className="absolute left-3 text-slate-400 dark:text-slate-500 pointer-events-none" />
                      <input
                        type="text"
                        placeholder="e.g., Research Block Sector-B"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="w-full h-10 text-xs font-medium bg-slate-50/50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 rounded-lg pl-9 pr-4 outline-none focus:border-indigo-500 dark:focus:border-indigo-400 focus:bg-white dark:focus:bg-slate-900 text-slate-900 dark:text-slate-100 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                      />
                    </div>
                  </div>

                  {/* Control actionable buttons row */}
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => setOpenModal(false)}
                      className="flex-1 h-10 text-xs font-bold tracking-wide uppercase border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-white transition-all cursor-pointer active:scale-[0.98]"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={createStation}
                      className="flex-1 h-10 text-xs font-bold tracking-wide uppercase bg-indigo-600 dark:bg-indigo-700 text-white border border-indigo-700 dark:border-indigo-800 shadow-sm rounded-lg hover:bg-indigo-500 dark:hover:bg-indigo-600 transition-all cursor-pointer active:scale-[0.98]"
                    >
                      Add Node
                    </button>
                  </div>

                </div>
              </div>
            </div>
          )}
        </DashboardLayout>
      </RouteGuard>
    </AuthGuard>
  );
}

/* ---------- Simplified B2B Sub-components with Theme Adapters ---------- */

function StationListItem({
  identity,
  regionalMeta,
  nodeState,
}: {
  identity: string;
  regionalMeta: string;
  nodeState: string;
}) {
  const isOnline = nodeState?.toLowerCase() === "online";

  return (
    <div className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors duration-150">
      <div className="flex items-start gap-3.5">
        <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200/60 dark:border-slate-700/60 text-slate-600 dark:text-slate-400 mt-0.5 shadow-sm transition-colors duration-200">
          <Radio size={15} />
        </div>

        <div className="space-y-0.5">
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 tracking-tight">
            {identity}
          </h4>

          <div className="flex items-center gap-1 text-slate-400 dark:text-slate-500 text-xs font-medium mt-0.5">
            <MapPin size={12} className="text-slate-300 dark:text-slate-600 shrink-0" />
            <span>{regionalMeta}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 self-start sm:self-auto">
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase border transition-colors duration-200 ${
          isOnline
            ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/40"
            : "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-100 dark:border-rose-900/40"
        }`}>
          <Signal size={10} className={isOnline ? "text-emerald-500 dark:text-emerald-400" : "text-rose-500 dark:text-rose-400"} />
          {nodeState}
        </span>
      </div>
    </div>
  );
}