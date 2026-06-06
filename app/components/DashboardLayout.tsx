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
    <div className="min-h-screen bg-slate-50 text-slate-900 flex overflow-hidden antialiased">

      {/* Sidebar */}
      <Sidebar role={role} />

      {/* Main Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">

        {/* Navbar */}
        <Navbar />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 md:p-8">
            {children}
          </div>
        </main>

      </div>

    </div>
  );
}