"use client";

import {
  Cloud,
  CloudRain,
  Wind,
  Droplets,
  Thermometer,
  MapPinned,
} from "lucide-react";

export default function UserPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#eef4ff] to-[#f8fbff] flex">

      {/* SIDEBAR */}

      <div className="w-[260px] bg-white border-r border-gray-200 shadow-sm flex flex-col">

        {/* LOGO */}

        <div className="h-24 border-b border-gray-100 flex flex-col justify-center px-6">
          <h1 className="text-4xl font-black text-blue-600 tracking-tight">
            LogiXair
          </h1>

          <p className="text-sm text-gray-400 mt-1">
            Weather Intelligence Platform
          </p>
        </div>

        {/* MENU */}

        <div className="flex flex-col gap-2 p-4">

          <button className="bg-blue-100 text-blue-700 rounded-2xl px-5 py-4 text-left font-semibold shadow-sm">
            Dashboard
          </button>

          <button className="hover:bg-gray-100 rounded-2xl px-5 py-4 text-left font-medium text-gray-700 transition">
            Forecast
          </button>

          <button className="hover:bg-gray-100 rounded-2xl px-5 py-4 text-left font-medium text-gray-700 transition">
            Stations
          </button>

          <button className="hover:bg-gray-100 rounded-2xl px-5 py-4 text-left font-medium text-gray-700 transition">
            Alerts
          </button>

          <button className="hover:bg-gray-100 rounded-2xl px-5 py-4 text-left font-medium text-gray-700 transition">
            Analytics
          </button>

          <button className="hover:bg-gray-100 rounded-2xl px-5 py-4 text-left font-medium text-gray-700 transition">
            Map
          </button>

        </div>

        {/* BOTTOM */}

        <div className="mt-auto p-4">

          <div className="bg-gradient-to-r from-blue-600 to-cyan-500 rounded-3xl p-5 text-white shadow-xl">

            <p className="text-sm opacity-80">
              SYSTEM STATUS
            </p>

            <h2 className="text-3xl font-black mt-2">
              ONLINE
            </h2>

            <p className="mt-3 text-sm opacity-90">
              All weather services are running normally.
            </p>

          </div>

        </div>

      </div>

      {/* MAIN */}

      <div className="flex-1 flex flex-col">

        {/* TOPBAR */}

        <div className="h-24 bg-[#0c5a8f] px-10 flex items-center justify-between shadow-md">

          <div>

            <h1 className="text-4xl font-black text-white">
              User Dashboard
            </h1>

            <p className="text-blue-100 mt-1">
              Real-time weather intelligence & forecasting
            </p>

          </div>

          <div className="flex items-center gap-4">

            <div className="bg-white/20 backdrop-blur-md px-5 py-3 rounded-2xl text-white font-semibold">
              Hyderabad
            </div>

            <div className="bg-white text-[#0c5a8f] px-6 py-3 rounded-2xl font-bold shadow-md">
              User
            </div>

          </div>

        </div>

        {/* CONTENT */}

        <div className="p-8 space-y-8">

          {/* HERO */}

          <div className="rounded-[40px] overflow-hidden shadow-2xl bg-gradient-to-r from-blue-700 via-cyan-500 to-sky-400 p-10 text-white relative">

            <div className="absolute right-10 top-10 opacity-30">
              <Cloud size={160} />
            </div>

            <p className="uppercase tracking-[4px] text-sm font-semibold opacity-80">
              Current Weather
            </p>

            <h1 className="text-8xl font-black mt-3">
              27°C
            </h1>

            <p className="text-2xl mt-4 font-medium">
              Partly Cloudy • Hyderabad
            </p>

            <div className="flex gap-5 mt-10">

              <div className="bg-white/20 backdrop-blur-md px-6 py-4 rounded-2xl">
                Humidity: 65%
              </div>

              <div className="bg-white/20 backdrop-blur-md px-6 py-4 rounded-2xl">
                Wind: 6 km/h
              </div>

              <div className="bg-white/20 backdrop-blur-md px-6 py-4 rounded-2xl">
                Rain Chance: 20%
              </div>

            </div>

          </div>

          {/* METRICS */}

          <div className="grid grid-cols-4 gap-6">

            <div className="bg-white/80 backdrop-blur-md rounded-3xl p-7 shadow-md hover:shadow-2xl transition-all duration-300">

              <div className="flex justify-between items-center">

                <div>
                  <p className="text-gray-400">
                    Temperature
                  </p>

                  <h1 className="text-5xl font-black mt-4">
                    27°
                  </h1>

                  <p className="text-green-500 mt-3 font-medium">
                    Feels pleasant
                  </p>
                </div>

                <Thermometer className="text-red-400" size={34} />

              </div>

            </div>

            <div className="bg-white/80 backdrop-blur-md rounded-3xl p-7 shadow-md hover:shadow-2xl transition-all duration-300">

              <div className="flex justify-between items-center">

                <div>
                  <p className="text-gray-400">
                    Humidity
                  </p>

                  <h1 className="text-5xl font-black mt-4">
                    65%
                  </h1>

                  <p className="text-blue-500 mt-3 font-medium">
                    Moderate moisture
                  </p>
                </div>

                <Droplets className="text-blue-400" size={34} />

              </div>

            </div>

            <div className="bg-white/80 backdrop-blur-md rounded-3xl p-7 shadow-md hover:shadow-2xl transition-all duration-300">

              <div className="flex justify-between items-center">

                <div>
                  <p className="text-gray-400">
                    Wind Speed
                  </p>

                  <h1 className="text-5xl font-black mt-4">
                    6
                  </h1>

                  <p className="text-cyan-500 mt-3 font-medium">
                    km/h breeze
                  </p>
                </div>

                <Wind className="text-cyan-400" size={34} />

              </div>

            </div>

            <div className="bg-white/80 backdrop-blur-md rounded-3xl p-7 shadow-md hover:shadow-2xl transition-all duration-300">

              <div className="flex justify-between items-center">

                <div>
                  <p className="text-gray-400">
                    Rain Chance
                  </p>

                  <h1 className="text-5xl font-black mt-4">
                    20%
                  </h1>

                  <p className="text-purple-500 mt-3 font-medium">
                    Low probability
                  </p>
                </div>

                <CloudRain className="text-purple-400" size={34} />

              </div>

            </div>

          </div>

          {/* BOTTOM SECTION */}

          <div className="grid grid-cols-2 gap-8">

            {/* FORECAST */}

            <div className="bg-white/80 backdrop-blur-md rounded-[35px] p-8 shadow-xl">

              <div className="flex justify-between items-center mb-8">

                <h2 className="text-4xl font-black">
                  5-Day Forecast
                </h2>

                <div className="bg-blue-100 text-blue-700 px-4 py-2 rounded-2xl font-semibold">
                  Updated Live
                </div>

              </div>

              <div className="space-y-5">

                <div className="bg-gray-50 hover:bg-blue-50 transition rounded-3xl p-6 flex justify-between items-center">

                  <div className="flex items-center gap-4">

                    <Cloud className="text-yellow-500" />

                    <div>
                      <h3 className="font-bold text-xl">
                        Monday
                      </h3>

                      <p className="text-gray-500">
                        Partly Cloudy
                      </p>
                    </div>

                  </div>

                  <h1 className="text-3xl font-black">
                    28°
                  </h1>

                </div>

                <div className="bg-gray-50 hover:bg-blue-50 transition rounded-3xl p-6 flex justify-between items-center">

                  <div className="flex items-center gap-4">

                    <CloudRain className="text-blue-500" />

                    <div>
                      <h3 className="font-bold text-xl">
                        Tuesday
                      </h3>

                      <p className="text-gray-500">
                        Light Rain
                      </p>
                    </div>

                  </div>

                  <h1 className="text-3xl font-black">
                    25°
                  </h1>

                </div>

                <div className="bg-gray-50 hover:bg-blue-50 transition rounded-3xl p-6 flex justify-between items-center">

                  <div className="flex items-center gap-4">

                    <Cloud className="text-orange-500" />

                    <div>
                      <h3 className="font-bold text-xl">
                        Wednesday
                      </h3>

                      <p className="text-gray-500">
                        Sunny
                      </p>
                    </div>

                  </div>

                  <h1 className="text-3xl font-black">
                    31°
                  </h1>

                </div>

              </div>

            </div>

            {/* MAP */}

            <div className="bg-white/80 backdrop-blur-md rounded-[35px] p-8 shadow-xl">

              <div className="flex justify-between items-center mb-8">

                <h2 className="text-4xl font-black">
                  Live Weather Map
                </h2>

                <MapPinned className="text-blue-500" />

              </div>

              <div className="rounded-[30px] overflow-hidden shadow-lg h-[500px]">

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
  );
}