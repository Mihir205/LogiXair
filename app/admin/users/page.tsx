"use client";

import AuthGuard from "../../components/AuthGuard";
import RouteGuard from "../../components/RouteGuard";
import DashboardLayout from "../../components/DashboardLayout";

import { Users, Plus, X, Layers, Mail, Lock as LockIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { firestore } from "@/lib/firebase";

type User = {
  id: string;
  uid?: string;
  email: string;
  role: string;
  stations?: string[];
  active?: boolean;
};

type Station = {
  id: string;
  name: string;
  location: string;
  status: string;
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [openModal, setOpenModal] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");

  const [stations, setStations] = useState<string[]>([]);
  const [availableStations, setAvailableStations] = useState<Station[]>([]);

  // Pure state database transactions - 100% intact
  const fetchUsers = async () => {
    try {
      const snap = await getDocs(collection(firestore, "users"));
      const data = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as User[];
      setUsers(data);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const fetchStations = async () => {
    try {
      const snap = await getDocs(collection(firestore, "stations"));
      const data = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Station[];
      setAvailableStations(data);
    } catch (error) {
      console.error("Error fetching stations:", error);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchStations();
  }, []);

  const createUser = async () => {
    try {
      const res = await fetch("/api/admin/create-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          role,
          stations,
        }),
      });

      const data = await res.json();

      if (data.success) {
        alert("User Created");
        setEmail("");
        setPassword("");
        setRole("user");
        setStations([]);
        fetchUsers();
        setOpenModal(false);
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <AuthGuard>
      <RouteGuard allowedRole="admin">
        <DashboardLayout role="admin">
          <div className="space-y-6 max-w-[1400px] mx-auto bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased selection:bg-indigo-600/10 selection:text-indigo-700 transition-colors duration-200">

            {/* CLASSIC B2B HEADER BLOCK */}
            <div className="flex flex-col md flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-slate-200/60 dark:border-slate-800/80">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  User Management
                </h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
                  Administer core organizational accounts, allocate roles, and oversee workspace access parameters.
                </p>
              </div>

              <button
                onClick={() => setOpenModal(true)}
                className="inline-flex items-center justify-center gap-1.5 bg-indigo-600 dark:bg-indigo-700 text-white font-semibold text-xs tracking-wide uppercase px-4 py-2.5 rounded-lg border border-indigo-700 dark:border-indigo-800 shadow-sm transition-all duration-200 hover:bg-indigo-500 dark:hover:bg-indigo-600 focus:outline-none cursor-pointer active:scale-[0.98]"
              >
                <Plus size={14} />
                Create User
              </button>
            </div>

            {/* MAIN USERS DIRECTORY PANEL */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800/80 shadow-sm overflow-hidden transition-all duration-200 hover:border-slate-300 dark:hover:border-slate-800">
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
                    Account Directory
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Registered system accounts and hardware credentials.
                  </p>
                </div>
                <Users size={15} className="text-slate-400 dark:text-slate-500" />
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {users.length === 0 ? (
                  <div className="p-8 text-center text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider bg-slate-50/20 dark:bg-slate-950/20">
                    No users found inside database registry
                  </div>
                ) : (
                  users.map((user) => (
                    <UserRow key={user.id} user={user} />
                  ))
                )}
              </div>
            </div>
          </div>

          {/* THEME LOGICAL MODAL LAYER */}
          {openModal && (
            <div className="fixed inset-0 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl w-full max-w-md overflow-hidden transform transition-all duration-200 scale-100 mx-4">
                
                {/* Modal Header */}
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-950/40">
                  <div>
                    <h3 className="font-bold text-sm tracking-tight text-slate-900 dark:text-white">Provision Operational Account</h3>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">Create a new secure access identity credential.</p>
                  </div>
                  <button 
                    onClick={() => setOpenModal(false)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                </div>

                {/* Modal Form Execution Matrix */}
                <div className="p-6 space-y-4">
                  
                  {/* Email input component */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">Email Address</label>
                    <div className="relative flex items-center">
                      <Mail size={14} className="absolute left-3 text-slate-400 dark:text-slate-500 pointer-events-none" />
                      <input
                        type="email"
                        placeholder="name@organization.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full h-10 text-xs font-medium bg-slate-50/50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 rounded-lg pl-9 pr-4 outline-none focus:border-indigo-500 dark:focus:border-indigo-400 focus:bg-white dark:focus:bg-slate-900 text-slate-900 dark:text-slate-100 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                      />
                    </div>
                  </div>

                  {/* Password input component */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">Access Password</label>
                    <div className="relative flex items-center">
                      <LockIcon size={14} className="absolute left-3 text-slate-400 dark:text-slate-500 pointer-events-none" />
                      <input
                        type="password"
                        placeholder="••••••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full h-10 text-xs font-medium bg-slate-50/50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 rounded-lg pl-9 pr-4 outline-none focus:border-indigo-500 dark:focus:border-indigo-400 focus:bg-white dark:focus:bg-slate-900 text-slate-900 dark:text-slate-100 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                      />
                    </div>
                  </div>

                  {/* Role dropdown selection framework */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">System Clearance Role</label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full h-10 text-xs font-semibold bg-slate-50/50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 rounded-lg px-3 outline-none focus:border-indigo-500 dark:focus:border-indigo-400 focus:bg-white dark:focus:bg-slate-900 text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
                    >
                      <option value="user" className="dark:bg-slate-900">User (Telemetry Access Only)</option>
                      <option value="operator" className="dark:bg-slate-900">Operator (Station Controls Privilege)</option>
                      <option value="admin" className="dark:bg-slate-900">Admin (Full System Infrastructure)</option>
                    </select>
                  </div>

                  {/* Station Assign Matrix Section */}
                  <div className="space-y-1.5 pt-1">
                    <label className="flex items-center justify-between text-[11px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
                      <span>Assign Hardware Nodes</span>
                      <span className="text-[10px] font-semibold tracking-normal text-indigo-500 dark:text-indigo-400 lowercase">
                        {stations.length} assigned
                      </span>
                    </label>

                    <div className="border border-slate-200 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-950/20 rounded-lg p-2.5 max-h-36 overflow-y-auto space-y-1 divide-y divide-slate-100/60 dark:divide-slate-800/60">
                      {availableStations.length === 0 ? (
                        <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 p-2 text-center">
                          No active stations available inside registry
                        </p>
                      ) : (
                        availableStations.map((station) => (
                          <label
                            key={station.id}
                            className="flex items-center gap-2.5 text-xs font-medium text-slate-700 dark:text-slate-300 pt-1.5 first:pt-0 cursor-pointer select-none group"
                          >
                            <input
                              type="checkbox"
                              checked={stations.includes(station.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setStations([...stations, station.id]);
                                } else {
                                  setStations(stations.filter((s) => s !== station.id));
                                }
                              }}
                              className="w-3.5 h-3.5 border-slate-300 dark:border-slate-700 text-indigo-600 dark:text-indigo-400 focus:ring-indigo-500 dark:focus:ring-indigo-400 rounded cursor-pointer dark:bg-slate-800"
                            />
                            <span className="group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{station.name}</span>
                          </label>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Form Trigger Configurations */}
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => setOpenModal(false)}
                      className="flex-1 h-10 text-xs font-bold tracking-wide uppercase border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-white transition-all cursor-pointer active:scale-[0.98]"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={createUser}
                      className="flex-1 h-10 text-xs font-bold tracking-wide uppercase bg-indigo-600 dark:bg-indigo-700 text-white border border-indigo-700 dark:border-indigo-800 shadow-sm rounded-lg hover:bg-indigo-500 dark:hover:bg-indigo-600 transition-all cursor-pointer active:scale-[0.98]"
                    >
                      Create
                    </button>
                  </div>

                </div>
              </div>
            </div>
          )}
        </DashboardLayout>
      </RouteGuard>
    </AuthGuard>
  );
}

/* ---------- Simplified B2B Sub-components with Theme Adapters ---------- */

function UserRow({ user }: { user: User }) {
  const badgeStyles: Record<string, string> = {
    admin: "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/40",
    operator: "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-900/40",
    user: "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200/60 dark:border-slate-700/60",
  };

  return (
    <div className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors duration-150">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-400 shrink-0 shadow-sm">
          {user.email?.charAt(0).toUpperCase()}
        </div>

        <div className="space-y-0.5">
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 tracking-tight leading-none">
            {user.email}
          </h4>
          <p className="text-xs text-slate-400 dark:text-slate-500 font-medium flex items-center gap-1 mt-1">
            <Layers size={11} className="text-slate-300 dark:text-slate-600" />
            Assigned Stations: <span className="font-semibold text-slate-600 dark:text-slate-400">{user.stations?.length || 0}</span>
          </p>
        </div>
      </div>

      <span
        className={`inline-flex items-center text-[10px] font-bold tracking-wider px-2.5 py-0.5 rounded border uppercase transition-colors duration-200 ${
          badgeStyles[user.role] || badgeStyles.user
        }`}
      >
        {user.role}
      </span>
    </div>
  );
}