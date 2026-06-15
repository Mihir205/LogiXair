"use client";

import Link from "next/link";
import {
  LayoutDashboard,
  CloudSun,
  BarChart3,
  Map,
  Bell,
  Activity,
  Settings,
  Shield,
  ShieldAlert,
  Users,
  Radio,
  Wrench,
  Cpu,
  Stethoscope,
} from "lucide-react";

interface SidebarProps {
  role: "user" | "operator" | "admin";
}

export default function Sidebar({ role }: SidebarProps) {
  const menus = {
    user: [
      {
        title: "Dashboard",
        icon: LayoutDashboard,
        href: "/user",
      },
      {
        title: "Analytics",
        icon: BarChart3,
        href: "/common/analytics",
      },
      {
        title: "Map",
        icon: Map,
        href: "/common/map",
      },
      {
        title: "Alerts",
        icon: Bell,
        href: "/common/alerts",
      },
    ],

    operator: [
      {
        title: "Dashboard",
        icon: LayoutDashboard,
        href: "/operator",
      },
      {
        title: "Analytics",
        icon: BarChart3,
        href: "/common/analytics",
      },
      {
        title: "Map",
        icon: Map,
        href: "/common/map",
      },
      {
        title: "Alerts",
        icon: Bell,
        href: "/common/alerts",
      },
      {
        title: "Health",
        icon: Activity,
        href: "/common/health",
      },
      {
        title: "Control",
        icon: Settings,
        href: "/operator/control",
      },
      {
        title: "Diagnostics",
        icon: Cpu,
        href: "/operator/diagnostics",
      },
      {
        title: "Maintenance",
        icon: Wrench,
        href: "/operator/maintenance",
      },
    ],

    admin: [
      {
        title: "Dashboard",
        icon: LayoutDashboard,
        href: "/admin",
      },
      {
        title: "Station Management",
        icon: Radio,
        href: "/admin/stations",
      },
      {
        title: "User Management",
        icon: Users,
        href: "/admin/users",
      },
      {
        title: "Analytics",
        icon: BarChart3,
        href: "/common/analytics",
      },
      {
        title: "Security",
        icon: Shield,
        href: "/admin/security",
      },
      {
        title: "Cyber Demos",
        icon: ShieldAlert,
        href: "/admin/security-demos",
      },
      {
        title: "System Health",
        icon: Stethoscope,
        href: "/common/health",
      },
      {
        title: "Alerts",
        icon: Bell,
        href: "/common/alerts",
      },
    ],
  };

  return (
    <div className="w-[260px] bg-slate-900 border-r border-slate-800 text-slate-200 flex flex-col h-screen sticky top-0">
      {/* Brand Header */}
      <div className="h-24 border-b border-slate-800 flex flex-col justify-center px-6">
        <h1 className="text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
          LogiXair
        </h1>
        <div className="flex items-center gap-1.5 mt-1">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
          <p className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
            {role} Portal
          </p>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="p-4 flex flex-col gap-1.5 overflow-y-auto flex-1">
        {menus[role]?.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.title}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl text-slate-400 hover:bg-slate-800/60 hover:text-white border border-transparent hover:border-slate-800 transition-all duration-200 group"
            >
              <Icon 
                size={18} 
                className="text-slate-500 group-hover:text-indigo-400 transition-colors duration-200" 
              />
              {item.title}
            </Link>
          );
        })}
      </div>
    </div>
  );
}