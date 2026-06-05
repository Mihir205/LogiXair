"use client";

import {
  Activity,
  AlertTriangle,
  Cpu,
  Database,
  Radio,
  ShieldCheck,
} from "lucide-react";

export default function AdminPage() {
  return (

    <div className="min-h-screen bg-gradient-to-br from-[#eef4ff] to-[#f8fbff] flex">

      {/* SIDEBAR */}

      <div className="w-[260px] bg-white border-r border-gray-200 shadow-sm flex flex-col">

        <div className="h-24 border-b border-gray-100 flex flex-col justify-center px-6">

          <h1 className="text-4xl font-black text-blue-600">
            LogiXair
          </h1>

          <p className="text-sm text-gray-400 mt-1">
            Admin Control Center
          </p>

        </div>

        <div className="flex flex-col gap-2 p-4">

          <button className="bg-blue-100 text-blue-700 rounded-2xl px-5 py-4 text-left font-semibold">
            Dashboard
          </button>

          <button className="hover:bg-blue-50 hover:text-blue-600 rounded-2xl px-5 py-4 text-left font-medium transition">
            Stations
          </button>

          <button className="hover:bg-blue-50 hover:text-blue-600 rounded-2xl px-5 py-4 text-left font-medium transition">
            Operators
          </button>

          <button className="hover:bg-blue-50 hover:text-blue-600 rounded-2xl px-5 py-4 text-left font-medium transition">
            Alerts
          </button>

          <button className="hover:bg-blue-50 hover:text-blue-600 rounded-2xl px-5 py-4 text-left font-medium transition">
            Analytics
          </button>

          <button className="hover:bg-blue-50 hover:text-blue-600 rounded-2xl px-5 py-4 text-left font-medium transition">
            Security
          </button>

        </div>

      </div>

      {/* MAIN */}

      <div className="flex-1 flex flex-col">

        {/* TOPBAR */}

        <div className="h-24 bg-[#0c5a8f]/95 backdrop-blur-xl px-10 flex items-center justify-between shadow-md">

          <div>

            <h1 className="text-4xl font-black text-white">
              Admin Dashboard
            </h1>

            <p className="text-blue-100 mt-1">
              Central monitoring & system management
            </p>

          </div>

          <div className="bg-white text-[#0c5a8f] px-6 py-3 rounded-2xl font-bold shadow-md">
            Admin
          </div>

        </div>

        {/* CONTENT */}

        <div className="p-8 space-y-8">

          {/* HERO */}

          <div className="bg-gradient-to-r from-[#0c5a8f] to-cyan-500 rounded-[40px] p-10 text-white shadow-2xl">

            <p className="uppercase tracking-[4px] text-sm opacity-80">
              SYSTEM OVERVIEW
            </p>

            <h1 className="text-6xl font-black mt-5">
              Weather Station Network
            </h1>

            <p className="mt-5 text-blue-100 text-lg max-w-3xl">
              Monitor all deployed IoT weather stations, alerts,
              operational health, analytics, and live telemetry.
            </p>

          </div>

          {/* METRICS */}

          <div className="grid grid-cols-4 gap-6">

            <div className="bg-white rounded-[30px] p-7 shadow-md">
              <div className="flex justify-between">
                <div>
                  <p className="text-gray-400">
                    Total Stations
                  </p>

                  <h1 className="text-5xl font-black mt-4">
                    24
                  </h1>

                  <p className="text-green-500 mt-3">
                    +2 added today
                  </p>
                </div>

                <Radio className="text-blue-500" />
              </div>
            </div>

            <div className="bg-white rounded-[30px] p-7 shadow-md">
              <div className="flex justify-between">
                <div>
                  <p className="text-gray-400">
                    Online Nodes
                  </p>

                  <h1 className="text-5xl font-black mt-4">
                    21
                  </h1>

                  <p className="text-cyan-500 mt-3">
                    Stable network
                  </p>
                </div>

                <Activity className="text-green-500" />
              </div>
            </div>

            <div className="bg-white rounded-[30px] p-7 shadow-md">
              <div className="flex justify-between">
                <div>
                  <p className="text-gray-400">
                    Critical Alerts
                  </p>

                  <h1 className="text-5xl font-black mt-4">
                    3
                  </h1>

                  <p className="text-red-500 mt-3">
                    Needs attention
                  </p>
                </div>

                <AlertTriangle className="text-red-500" />
              </div>
            </div>

            <div className="bg-white rounded-[30px] p-7 shadow-md">
              <div className="flex justify-between">
                <div>
                  <p className="text-gray-400">
                    System Health
                  </p>

                  <h1 className="text-5xl font-black mt-4">
                    98%
                  </h1>

                  <p className="text-green-500 mt-3">
                    Excellent
                  </p>
                </div>

                <ShieldCheck className="text-blue-500" />
              </div>
            </div>

          </div>

          {/* LOWER GRID */}

          <div className="grid grid-cols-2 gap-8">

            {/* STATIONS */}

            <div className="bg-white rounded-[35px] p-8 shadow-xl">

              <div className="flex justify-between items-center mb-8">

                <h2 className="text-4xl font-black">
                  Station Network
                </h2>

                <div className="bg-blue-100 text-blue-700 px-4 py-2 rounded-2xl font-semibold">
                  24 Active
                </div>

              </div>

              <div className="space-y-5">

                <div className="border border-gray-100 rounded-3xl p-6 flex justify-between items-center shadow-sm">

                  <div>
                    <h3 className="text-2xl font-bold">
                      ESP32 Weather Station
                    </h3>

                    <p className="text-gray-500 mt-1">
                      Campus Test Site
                    </p>
                  </div>

                  <div className="bg-green-100 text-green-600 px-5 py-2 rounded-2xl font-bold">
                    ONLINE
                  </div>

                </div>

                <div className="border border-gray-100 rounded-3xl p-6 flex justify-between items-center shadow-sm">

                  <div>
                    <h3 className="text-2xl font-bold">
                      Solar Node Alpha
                    </h3>

                    <p className="text-gray-500 mt-1">
                      Research Block
                    </p>
                  </div>

                  <div className="bg-red-100 text-red-500 px-5 py-2 rounded-2xl font-bold">
                    OFFLINE
                  </div>

                </div>

              </div>

            </div>

            {/* ALERTS */}

            <div className="bg-white rounded-[35px] p-8 shadow-xl">

              <div className="flex justify-between items-center mb-8">

                <h2 className="text-4xl font-black">
                  Recent Alerts
                </h2>

                <AlertTriangle className="text-red-500" />

              </div>

              <div className="space-y-5">

                <div className="bg-red-50 border-l-4 border-red-500 rounded-2xl p-5">
                  <h3 className="font-bold text-xl">
                    Communication failure detected
                  </h3>

                  <p className="text-gray-500 mt-2">
                    ESP32 Station • 5 mins ago
                  </p>
                </div>

                <div className="bg-yellow-50 border-l-4 border-yellow-500 rounded-2xl p-5">
                  <h3 className="font-bold text-xl">
                    Battery below threshold
                  </h3>

                  <p className="text-gray-500 mt-2">
                    Solar Node Alpha • 20 mins ago
                  </p>
                </div>

                <div className="bg-blue-50 border-l-4 border-blue-500 rounded-2xl p-5">
                  <h3 className="font-bold text-xl">
                    Firmware update completed
                  </h3>

                  <p className="text-gray-500 mt-2">
                    Wind Unit • 1 hour ago
                  </p>
                </div>

              </div>

            </div>

          </div>

        </div>

      </div>

    </div>

  );
}