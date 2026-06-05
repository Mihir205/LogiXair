import DashboardLayout from "../components/DashboardLayout";
import MetricCard from "../components/MetricCard";

export default function UserPage() {
  return (
    <DashboardLayout>

      <h1 className="text-3xl font-bold mb-6">
        User Dashboard
      </h1>

      <div className="grid md:grid-cols-4 gap-5">

        <MetricCard
          title="Temperature"
          value={30}
          unit="°C"
        />

        <MetricCard
          title="Humidity"
          value={72}
          unit="%"
        />

        <MetricCard
          title="Pressure"
          value={1008}
          unit="hPa"
        />

        <MetricCard
          title="Wind Speed"
          value={12}
          unit="km/h"
        />

        <MetricCard
          title="Rainfall"
          value={4}
          unit="mm"
        />

        <MetricCard
          title="Irradiance"
          value={550}
          unit="W/m²"
        />

      </div>

    </DashboardLayout>
  );
}