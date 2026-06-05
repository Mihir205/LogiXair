"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Shield,
  User,
  Settings,
  CloudSun,
} from "lucide-react";

export default function HomePage() {

  const router = useRouter();

  const [role, setRole] = useState("user");

  const handleLogin = () => {

    if (role === "user") {
      router.push("/user");
    }

    else if (role === "operator") {
      router.push("/operator");
    }

    else if (role === "admin") {
      router.push("/admin");
    }

  };

  return (

    <div className="min-h-screen bg-gradient-to-br from-[#eef4ff] to-[#f7fbff] flex items-center justify-center p-10">

      <div className="w-full max-w-6xl bg-white rounded-[40px] shadow-2xl overflow-hidden grid grid-cols-2">

        {/* LEFT SIDE */}

        <div className="bg-gradient-to-br from-[#0c5a8f] via-blue-600 to-cyan-500 text-white p-14 flex flex-col justify-between relative overflow-hidden">

          <div className="absolute right-[-50px] top-[-50px] opacity-10">
            <CloudSun size={300} />
          </div>

          <div>

            <p className="uppercase tracking-[6px] text-sm opacity-80">
              OFF-GRID IOT WEATHER PLATFORM
            </p>

            <h1 className="text-6xl font-black mt-6 leading-tight">
              Weather Intelligence Platform
            </h1>

            <p className="mt-8 text-blue-100 text-lg leading-relaxed">
              Real-time monitoring, forecasting, analytics,
              station intelligence, alerts, and operational
              weather insights.
            </p>

          </div>

          <div className="flex gap-5">

            <div className="bg-white/20 backdrop-blur-md rounded-3xl px-6 py-5">
              Live Monitoring
            </div>

            <div className="bg-white/20 backdrop-blur-md rounded-3xl px-6 py-5">
              Smart Forecasting
            </div>

          </div>

        </div>

        {/* RIGHT SIDE */}

        <div className="p-16 flex flex-col justify-center">

          <div>

            <h2 className="text-5xl font-black text-gray-800">
              Dashboard Login
            </h2>

            <p className="text-gray-500 mt-4 text-lg">
              Select your access role and continue
            </p>

          </div>

          {/* ROLE SELECT */}

          <div className="grid grid-cols-3 gap-5 mt-12">

            {/* USER */}

            <button
              onClick={() => setRole("user")}
              className={`rounded-3xl border-2 p-6 transition-all duration-300 text-left ${
                role === "user"
                  ? "border-blue-600 bg-blue-50 shadow-lg"
                  : "border-gray-200 hover:border-blue-300"
              }`}
            >

              <User className="text-blue-600" size={34} />

              <h3 className="text-2xl font-bold mt-5">
                User
              </h3>

              <p className="text-gray-500 mt-2">
                Weather monitoring access
              </p>

            </button>

            {/* OPERATOR */}

            <button
              onClick={() => setRole("operator")}
              className={`rounded-3xl border-2 p-6 transition-all duration-300 text-left ${
                role === "operator"
                  ? "border-blue-600 bg-blue-50 shadow-lg"
                  : "border-gray-200 hover:border-blue-300"
              }`}
            >

              <Settings className="text-blue-600" size={34} />

              <h3 className="text-2xl font-bold mt-5">
                Operator
              </h3>

              <p className="text-gray-500 mt-2">
                Station control access
              </p>

            </button>

            {/* ADMIN */}

            <button
              onClick={() => setRole("admin")}
              className={`rounded-3xl border-2 p-6 transition-all duration-300 text-left ${
                role === "admin"
                  ? "border-blue-600 bg-blue-50 shadow-lg"
                  : "border-gray-200 hover:border-blue-300"
              }`}
            >

              <Shield className="text-blue-600" size={34} />

              <h3 className="text-2xl font-bold mt-5">
                Admin
              </h3>

              <p className="text-gray-500 mt-2">
                Full system management
              </p>

            </button>

          </div>

          {/* LOGIN FORM */}

          <div className="mt-12 space-y-6">

            <input
              type="text"
              placeholder="Username"
              className="w-full h-16 rounded-2xl border border-gray-200 px-6 text-lg outline-none focus:border-blue-500"
            />

            <input
              type="password"
              placeholder="Password"
              className="w-full h-16 rounded-2xl border border-gray-200 px-6 text-lg outline-none focus:border-blue-500"
            />

            <button
              onClick={handleLogin}
              className="w-full h-16 rounded-2xl bg-gradient-to-r from-[#0c5a8f] to-cyan-500 text-white text-xl font-bold shadow-xl hover:scale-[1.02] transition-all duration-300"
            >
              Open Dashboard
            </button>

          </div>

        </div>

      </div>

    </div>

  );
}