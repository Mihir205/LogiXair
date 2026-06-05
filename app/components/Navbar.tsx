import { Bell, UserCircle } from "lucide-react";

export default function Navbar() {
  return (
    <div className="bg-white shadow px-6 py-4 flex justify-between items-center">
      <div>
        <h2 className="text-xl font-semibold">
          Weather Intelligence Dashboard
        </h2>
      </div>

      <div className="flex items-center gap-4">
        <Bell className="cursor-pointer" />

        <div className="flex items-center gap-2">
          <UserCircle size={28} />
          <span>Mihir</span>
        </div>
      </div>
    </div>
  );
}