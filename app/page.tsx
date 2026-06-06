"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Shield,
  User,
  Settings,
  CloudSun,
  Lock,
  UserCircle,
} from "lucide-react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, firestore } from "../lib/firebase";

import {
  collection,
  getDocs,
} from "firebase/firestore";

export default function HomePage() {
  const router = useRouter();
  const [role, setRole] = useState("user");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const handleLogin = async () => {
    try {
      setLoading(true);

      await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      const snapshot = await getDocs(
        collection(firestore, "users")
      );

      let userRole = "";

      snapshot.forEach((doc) => {
        const data = doc.data();

        if (data.email === email) {
          userRole = data.role;
        }
      });

      if (userRole === "admin") {
        router.push("/admin");
      }

      else if (userRole === "operator") {
        router.push("/operator");
      }

      else if (userRole === "user") {
        router.push("/user");
      }

      else {
        alert("Role not found in Firestore");
      }
    }

    catch (error) {
      console.error(error);
      alert("Invalid email or password");
    }

    finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 grid grid-cols-1 md:grid-cols-2 antialiased selection:bg-indigo-600/10 selection:text-indigo-700">
      
      {/* LEFT SIDE: MINIMAL ENTERPRISE HERO */}
      <div className="bg-slate-900 p-12 md:p-16 lg:p-24 flex flex-col justify-between relative overflow-hidden border-r border-slate-800 min-h-screen">
        {/* Subtle background icon asset */}
        <div className="absolute right-[-60px] top-[-60px] text-slate-800/30 pointer-events-none select-none">
          <CloudSun size={320} className="stroke-[1.2]" />
        </div>

        <div className="my-auto relative z-10 max-w-md space-y-4">
          <p className="text-[10px] font-bold tracking-widest text-indigo-400 uppercase">
            Off-Grid IoT Weather platform
          </p>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white leading-tight">
            LogiXair Intelligence Engine
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed font-medium">
            Real-time monitoring, precision forecasting, historical analytics, station hardware health logs, and automated alerts.
          </p>
        </div>

        <div className="relative z-10 text-[11px] font-medium text-slate-500 tracking-wide">
          &copy; LogiXair Operations. Centralized Grid Environment.
        </div>
      </div>

      {/* RIGHT SIDE: CLEAN ACCESS TERMINAL */}
      <div className="flex flex-col justify-center bg-white min-h-screen px-6 py-12 sm:px-12 lg:px-20">
        <div className="w-full max-w-sm mx-auto space-y-8">
          
          {/* Header */}
          <div className="space-y-1.5 text-left">
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              Dashboard Login
            </h2>
            <p className="text-slate-400 text-xs font-medium">
              Select an account role and authenticate credentials.
            </p>
          </div>

          {/* Role Grid Controls */}
          <div className="grid grid-cols-3 gap-2">
            {/* User */}
            <button
              onClick={() => setRole("user")}
              className={`rounded-lg border p-3.5 transition-all duration-150 text-left flex flex-col justify-between h-24 cursor-pointer group ${
                role === "user"
                  ? "border-indigo-600 bg-indigo-50/40 ring-1 ring-indigo-600/30"
                  : "border-slate-200 bg-white hover:bg-slate-50/80 hover:border-slate-300"
              }`}
            >
              <User className={`transition-colors ${role === "user" ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-500"}`} size={16} />
              <div>
                <h3 className="text-xs font-bold text-slate-800 leading-none">User</h3>
                <p className="text-[10px] text-slate-400 font-medium mt-1 leading-none">Telemetry</p>
              </div>
            </button>

            {/* Operator */}
            <button
              onClick={() => setRole("operator")}
              className={`rounded-lg border p-3.5 transition-all duration-150 text-left flex flex-col justify-between h-24 cursor-pointer group ${
                role === "operator"
                  ? "border-indigo-600 bg-indigo-50/40 ring-1 ring-indigo-600/30"
                  : "border-slate-200 bg-white hover:bg-slate-50/80 hover:border-slate-300"
              }`}
            >
              <Settings className={`transition-colors ${role === "operator" ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-500"}`} size={16} />
              <div>
                <h3 className="text-xs font-bold text-slate-800 leading-none">Operator</h3>
                <p className="text-[10px] text-slate-400 font-medium mt-1 leading-none">Controls</p>
              </div>
            </button>

            {/* Admin */}
            <button
              onClick={() => setRole("admin")}
              className={`rounded-lg border p-3.5 transition-all duration-150 text-left flex flex-col justify-between h-24 cursor-pointer group ${
                role === "admin"
                  ? "border-indigo-600 bg-indigo-50/40 ring-1 ring-indigo-600/30"
                  : "border-slate-200 bg-white hover:bg-slate-50/80 hover:border-slate-300"
              }`}
            >
              <Shield className={`transition-colors ${role === "admin" ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-500"}`} size={16} />
              <div>
                <h3 className="text-xs font-bold text-slate-800 leading-none">Admin</h3>
                <p className="text-[10px] text-slate-400 font-medium mt-1 leading-none">Management</p>
              </div>
            </button>
          </div>

          {/* Form Credentials */}
          <div className="space-y-3">
            <div className="relative flex items-center">
              <UserCircle size={15} className="absolute left-3.5 text-slate-400 pointer-events-none" />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                className="w-full h-11 rounded-lg border border-slate-200 pl-10 pr-4 text-xs font-medium text-slate-800 bg-slate-50/40 outline-none focus:border-indigo-500 focus:bg-white transition-all placeholder:text-slate-400"
              />
            </div>

            <div className="relative flex items-center">
              <Lock size={15} className="absolute left-3.5 text-slate-400 pointer-events-none" />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                className="w-full h-11 rounded-lg border border-slate-200 pl-10 pr-4 text-xs font-medium text-slate-800 bg-slate-50/40 outline-none focus:border-indigo-500 focus:bg-white transition-all placeholder:text-slate-400"
              />
            </div>

            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full h-11 rounded-lg bg-indigo-600 text-white text-xs font-bold tracking-wider uppercase border border-indigo-700 shadow-sm transition-all hover:bg-indigo-500 hover:border-indigo-600 focus:outline-none cursor-pointer active:scale-[0.99] pt-0.5"
            >
              {loading ? "Signing In..." : "Open Workspace"}
            </button>
          </div>

        </div>
      </div>
      
    </div>
  );
}