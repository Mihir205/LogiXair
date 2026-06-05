"use client";

import {
  Activity,
  Radio,
  Thermometer,
  Wind,
  Droplets,
  AlertTriangle,
  Cpu,
  MapPinned,
} from "lucide-react";

export default function OperatorPage() {
  return (

    <div className="min-h-screen bg-gradient-to-br from-[#eef4ff] to-[#f8fbff] flex">

      {/* SIDEBAR */}

      <div className="w-[260px] bg-white border-r border-gray-200 shadow-sm flex flex-col">

        <div className="h-24 border-b border-gray-100 flex flex-col justify-center px-6">

          <h1 className="text-4xl font-black text-blue-600">
            LogiXair
          </h1>

          <p className="text-sm text-gray-400 mt-1">
            Operator Control Panel
          </p>

        </div>

        <div className="flex flex-col gap-2 p-4">

          <button className="bg-blue-100 text-blue-700 rounded-2xl px-5 py-4 text-left font-semibold">
            Dashboard
          </button>

          <button className="hover:bg-blue-50 hover:text-blue-600 rounded-2xl px-5 py-4 text-left transition">
            Live Stations
          </button>

          <button className="hover:bg-blue-50 hover:text-blue-600 rounded-2xl px-5 py-4 text-left transition">
            Sensor Feed
          </button>

          <button className="hover:bg-blue-50 hover:text-blue-600 rounded-2xl px-5 py-4 text-left transition">
            Alerts
          </button>

          <button className="hover:bg-blue-50 hover:text-blue-600 rounded-2xl px-5 py-4 text-left transition">
            Maintenance
          </button>

          <button className="hover:bg-blue-50 hover:text-blue-600 rounded-2xl px-5 py-4 text-left transition">
            Station Map
          </button>

        </div>

        <div className="mt-auto p-4">

          <div className="bg-gradient-to-r from-blue-600 to-cyan-500 rounded-3xl p-5 text-white shadow-xl">

            <p className="text-sm opacity-80">
              NETWORK STATUS
            </p>

            <h2 className="text-3xl font-black mt-2">
              STABLE
            </h2>

            <p className="mt-3 text-sm opacity-90">
              All sensor streams operational.
            </p>

          </div>

        </div>

      </div>

      {/* MAIN */}

      <div className="flex-1 flex flex-col">

        {/* TOPBAR */}

        <div className="h-24 bg-[#0c5a8f]/95 backdrop-blur-xl px-10 flex items-center justify-between shadow-md">

          <div>

            <h1 className="text-4xl font-black text-white">
              Operator Dashboard
            </h1>

            <p className="text-blue-100 mt-1">
              Live telemetry & operational controls
            </p>

          </div>

          <div className="bg-white text-[#0c5a8f] px-6 py-3 rounded-2xl font-bold shadow-md">
            Operator
          </div>

        </div>

        {/* CONTENT */}

        <div className="p-8 space-y-8">

          {/* HERO */}

          <div className="bg-gradient-to-r from-[#0c5a8f] via-blue-600 to-cyan-500 rounded-[40px] p-10 text-white shadow-2xl">

            <div className="flex justify-between items-center">

              <div>

                <p className="uppercase tracking-[4px] text-sm opacity-80">
                  LIVE OPERATIONS
                </p>

                <h1 className="text-6xl font-black mt-5">
                  ESP32 Weather Station
                </h1>

                <p className="mt-5 text-blue-100 text-lg">
                  Monitoring live sensor telemetry and environmental conditions.
                </p>

              </div>

              <div className="bg-white/20 backdrop-blur-md rounded-3xl px-8 py-6">

                <p className="text-sm opacity-80">
                  STATUS
                </p>

                <h2 className="text-4xl font-black mt-2">
                  ONLINE
                </h2>

              </div>

            </div>

          </div>

          {/* LIVE METRICS */}

          <div className="grid grid-cols-4 gap-6">

            <div className="bg-white rounded-[30px] p-7 shadow-md">

              <div className="flex justify-between">

                <div>

                  <p className="text-gray-400">
                    Temperature
                  </p>

                  <h1 className="text-5xl font-black mt-4">
                    27°C
                  </h1>

                  <p className="text-green-500 mt-3">
                    Stable conditions
                  </p>

                </div>

                <Thermometer className="text-red-400" />

              </div>

            </div>

            <div className="bg-white rounded-[30px] p-7 shadow-md">

              <div className="flex justify-between">

                <div>

                  <p className="text-gray-400">
                    Humidity
                  </p>

                  <h1 className="text-5xl font-black mt-4">
                    65%
                  </h1>

                  <p className="text-blue-500 mt-3">
                    Moderate moisture
                  </p>

                </div>

                <Droplets className="text-blue-400" />

              </div>

            </div>

            <div className="bg-white rounded-[30px] p-7 shadow-md">

              <div className="flex justify-between">

                <div>

                  <p className="text-gray-400">
                    Wind Speed
                  </p>

                  <h1 className="text-5xl font-black mt-4">
                    6 km/h
                  </h1>

                  <p className="text-cyan-500 mt-3">
                    Light breeze
                  </p>

                </div>

                <Wind className="text-cyan-400" />

              </div>

            </div>

            <div className="bg-white rounded-[30px] p-7 shadow-md">

              <div className="flex justify-between">

                <div>

                  <p className="text-gray-400">
                    Active Sensors
                  </p>

                  <h1 className="text-5xl font-black mt-4">
                    12
                  </h1>

                  <p className="text-green-500 mt-3">
                    Fully operational
                  </p>

                </div>

                <Cpu className="text-green-500" />

              </div>

            </div>

          </div>

          {/* LOWER SECTION */}

          <div className="grid grid-cols-2 gap-8">

            {/* SENSOR FEED */}

            <div className="bg-white rounded-[35px] p-8 shadow-xl">

              <div className="flex justify-between items-center mb-8">

                <h2 className="text-4xl font-black">
                  Sensor Feed
                </h2>

                <Activity className="text-green-500" />

              </div>

              <div className="space-y-5">

                <div className="bg-gray-50 rounded-3xl p-6 flex justify-between">

                  <div>

                    <h3 className="font-bold text-xl">
                      Pressure Sensor
                    </h3>

                    <p className="text-gray-500 mt-1">
                      Last update: 2 sec ago
                    </p>

                  </div>

                  <h1 className="text-3xl font-black">
                    907 hPa
                  </h1>

                </div>

                <div className="bg-gray-50 rounded-3xl p-6 flex justify-between">

                  <div>

                    <h3 className="font-bold text-xl">
                      Rainfall Sensor
                    </h3>

                    <p className="text-gray-500 mt-1">
                      Last update: 5 sec ago
                    </p>

                  </div>

                  <h1 className="text-3xl font-black">
                    1 mm
                  </h1>

                </div>

                <div className="bg-gray-50 rounded-3xl p-6 flex justify-between">

                  <div>

                    <h3 className="font-bold text-xl">
                      Irradiance Sensor
                    </h3>

                    <p className="text-gray-500 mt-1">
                      Last update: 1 sec ago
                    </p>

                  </div>

                  <h1 className="text-3xl font-black">
                    1 W/m²
                  </h1>

                </div>

              </div>

            </div>

            {/* ALERTS + MAP */}

            <div className="space-y-8">

              {/* ALERTS */}

              <div className="bg-white rounded-[35px] p-8 shadow-xl">

                <div className="flex justify-between items-center mb-8">

                  <h2 className="text-4xl font-black">
                    Live Alerts
                  </h2>

                  <AlertTriangle className="text-red-500" />

                </div>

                <div className="space-y-4">

                  <div className="bg-red-50 border-l-4 border-red-500 rounded-2xl p-5">

                    <h3 className="font-bold text-xl">
                      Communication delay detected
                    </h3>

                    <p className="text-gray-500 mt-2">
                      Node Alpha • 2 mins ago
                    </p>

                  </div>

                  <div className="bg-yellow-50 border-l-4 border-yellow-500 rounded-2xl p-5">

                    <h3 className="font-bold text-xl">
                      Battery fluctuation warning
                    </h3>

                    <p className="text-gray-500 mt-2">
                      Solar Unit • 12 mins ago
                    </p>

                  </div>

                </div>

              </div>

              {/* MAP */}

              <div className="bg-white rounded-[35px] p-8 shadow-xl">

                <div className="flex justify-between items-center mb-8">

                  <h2 className="text-4xl font-black">
                    Station Map
                  </h2>

                  <MapPinned className="text-blue-500" />

                </div>

                <div className="rounded-[30px] overflow-hidden h-[300px] shadow-lg">

                  <iframe
                    src="https://maps.google.com/maps?q=hyderabad&t=&z=5&ie=UTF8&iwloc=&output=embed"
                    className="w-full h-full border-0"
                  />

                </div>

              </div>

            </div>

          </div>

        </div>

      </div>

    </div>

  );
}