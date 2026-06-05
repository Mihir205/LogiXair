"use client";

import Link from "next/link";
import {
  LayoutDashboard,
  Shield,
  Wrench,
  Users,
  BarChart3,
  Settings,
} from "lucide-react";

export default function Sidebar() {
  const menuItems = [
    {
      name: "Dashboard",
      icon: LayoutDashboard,
      path: "/",
    },
    {
      name: "Admin",
      icon: Shield,
      path: "/admin",
    },
    {
      name: "Operator",
      icon: Wrench,
      path: "/operator",
    },
    {
      name: "User",
      icon: Users,
      path: "/user",
    },
    {
      name: "Analytics",
      icon: BarChart3,
      path: "/analytics",
    },
    {
      name: "Settings",
      icon: Settings,
      path: "/settings",
    },
  ];

  return (
    <div className="w-64 bg-slate-900 text-white min-h-screen p-5">
      <h1 className="text-xl font-bold mb-10">
        Weather Platform
      </h1>

      <div className="space-y-3">
        {menuItems.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.path}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800 transition"
            >
              <Icon size={20} />
              {item.name}
            </Link>
          );
        })}
      </div>
    </div>
  );
}