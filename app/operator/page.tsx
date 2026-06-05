import DashboardLayout from "../components/DashboardLayout";
import SensorTable from "../components/SensorTable";

export default function OperatorPage() {
  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold mb-6">
        Operator Dashboard
      </h1>

      <div className="grid md:grid-cols-4 gap-5 mb-6">

        <div className="bg-white p-5 rounded-xl shadow">
          <h3>Battery</h3>
          <p className="text-3xl font-bold">
            92%
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl shadow">
          <h3>Signal</h3>
          <p className="text-3xl font-bold">
            Excellent
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl shadow">
          <h3>Health</h3>
          <p className="text-3xl font-bold">
            Good
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl shadow">
          <h3>Last Seen</h3>
          <p className="text-lg font-bold">
            2 min ago
          </p>
        </div>

      </div>

      <SensorTable />
    </DashboardLayout>
  );
}