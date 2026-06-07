"use client";

import { Bell, UserCircle, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "../../lib/firebase";
import useUserRole from "../../lib/useUserRole";

export default function Navbar() {
  const router = useRouter();

  const { role, loading } = useUserRole();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace("/");
    } catch (error) {
      console.error(
        "Authentication Session Termination Error:",
        error
      );
    }
  };

  return (
    <div className="bg-white border-b border-slate-200/60 px-8 py-4 flex justify-between items-center sticky top-0 z-50 transition-all duration-200">

      {/* LEFT AREA */}
      <div>
        <h2 className="text-lg font-bold tracking-tight text-slate-900">
          Weather Intelligence Dashboard
        </h2>
      </div>

      {/* RIGHT AREA */}
      <div className="flex items-center gap-5">

        {/* Notifications */}
        <button className="p-2 text-slate-400 hover:text-indigo-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all duration-200 relative group cursor-pointer shadow-sm">
          <Bell
            size={18}
            className="transition-transform duration-200 group-hover:scale-105"
          />
          <span className="absolute top-2 right-2 w-2 h-2 bg-indigo-600 rounded-full ring-2 ring-white animate-pulse" />
        </button>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="p-2 text-slate-400 hover:text-rose-600 bg-white hover:bg-rose-50/50 border border-slate-200 rounded-xl transition-all duration-200 cursor-pointer shadow-sm"
          title="Log Out"
        >
          <LogOut size={18} />
        </button>

        {/* Divider */}
        <div className="h-6 w-px bg-slate-200" />

        {/* Profile */}
        <div className="flex items-center gap-3 pl-1 cursor-default group select-none">
          <div className="p-0.5 border border-slate-200 rounded-full bg-slate-50 text-slate-500 transition-transform duration-200 group-hover:scale-105">
            <UserCircle
              size={26}
              className="rounded-full"
            />
          </div>

          <div className="flex flex-col text-left">
            <span className="text-sm font-bold text-slate-800 capitalize">
              {loading ? "Loading..." : role}
            </span>

            <span className="text-xs text-slate-400 font-medium">
              Logged In
            </span>
          </div>
        </div>

      </div>

    </div>
  );
}