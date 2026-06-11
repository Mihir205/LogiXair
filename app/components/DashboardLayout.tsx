"use client";

import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

interface DashboardLayoutProps {
  children: React.ReactNode;
  role: "user" | "operator" | "admin";
}

export default function DashboardLayout({
  children,
  role,
}: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex overflow-hidden antialiased transition-colors duration-200">

      {/* Sidebar Navigation Menu Frame */}
      <Sidebar role={role} />

      {/* Main Consolidated Dynamic Viewport Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors duration-200">

        {/* Global Control Navbar */}
        <Navbar />

        {/* Scrollable Page Viewport Element Container */}
        <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
          <div className="p-6 md:p-8">
            {children}
          </div>
        </main>

      </div>

    </div>
  );
}