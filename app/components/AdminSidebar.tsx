export default function AdminSidebar() {
  return (
    <aside className="w-64 bg-white border-r flex flex-col">

      <div className="p-6 border-b">
        <h1 className="text-3xl font-bold text-blue-700">
          LogiXair
        </h1>

        <p className="text-sm text-gray-500 mt-1">
          Weather Intelligence Platform
        </p>
      </div>

      <div className="p-4 space-y-2">

        <div className="bg-blue-100 text-blue-700 p-3 rounded-xl font-medium">
          Dashboard
        </div>

        <div className="hover:bg-gray-100 p-3 rounded-xl cursor-pointer">
          Stations
        </div>

        <div className="hover:bg-gray-100 p-3 rounded-xl cursor-pointer">
          Analytics
        </div>

        <div className="hover:bg-gray-100 p-3 rounded-xl cursor-pointer">
          Alerts
        </div>

      </div>

    </aside>
  );
}