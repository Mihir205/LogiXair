"use client";
import AuthGuard from "../../components/AuthGuard";
import RouteGuard from "../../components/RouteGuard";
import DashboardLayout from "../../components/DashboardLayout";
import { Users, Plus, Shield, UserCheck, MoreHorizontal } from "lucide-react";

export default function UsersPage() {
  return (
    <AuthGuard>
    <RouteGuard allowedRole="admin">
    <DashboardLayout role="admin">
      <div className="space-y-6 max-w-[1400px] mx-auto bg-slate-50 antialiased selection:bg-indigo-600/10 selection:text-indigo-700">
        
        {/* CLASSIC B2B HEADER BLOCK */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-slate-200/60">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              User Management
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">
              Administer core organizational accounts, allocate roles, and oversee workspace access parameters.
            </p>
          </div>
          
          <button className="inline-flex items-center justify-center gap-1.5 bg-indigo-600 text-white font-semibold text-xs tracking-wide uppercase px-4 py-2.5 rounded-lg border border-indigo-700 shadow-sm transition-all duration-200 hover:bg-indigo-500 hover:border-indigo-600 focus:outline-none cursor-pointer active:scale-[0.98]">
            <Plus size={14} />
            Create User
          </button>
        </div>

        {/* DATA CONTAINER PANEL */}
        <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden transition-all duration-200 hover:border-slate-300">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold tracking-tight text-slate-900">Account Directory</h2>
              <p className="text-xs text-slate-500 mt-0.5">Registered system operator accounts.</p>
            </div>
            <Users size={15} className="text-slate-400" />
          </div>

          {/* HIGH-DENSITY ENTERPRISE LIST */}
          <div className="divide-y divide-slate-100">
            <UserRow name="Mihir" role="Admin" email="mihir@logixair.com" isRoot={true} />
            <UserRow name="Rahul" role="Operator" email="rahul@logixair.com" />
            <UserRow name="Arjun" role="User" email="arjun@logixair.com" />
          </div>
        </div>

      </div>
    </DashboardLayout>
    </RouteGuard>
    </AuthGuard>
  );
}

function UserRow({ name, role, email, isRoot }: any) {
  const badgeStyles: any = {
    Admin: "bg-indigo-50 text-indigo-700 border-indigo-100",
    Operator: "bg-amber-50 text-amber-700 border-amber-100",
    User: "bg-slate-50 text-slate-700 border-slate-200/60",
  };

  return (
    <div className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors duration-150">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-700">
          {name.charAt(0)}
        </div>
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-slate-800 leading-none">{name}</h4>
            {isRoot && <Shield size={12} className="text-indigo-600" />}
          </div>
          <p className="text-xs text-slate-400 font-medium">{email}</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <span className={`inline-flex items-center text-[10px] font-bold tracking-wider px-2.5 py-0.5 rounded border uppercase ${badgeStyles[role] || badgeStyles.User}`}>
          {role}
        </span>
        <button className="text-slate-400 hover:text-slate-600 p-1 rounded transition-colors">
          <MoreHorizontal size={14} />
        </button>
      </div>
    </div>
  );
}