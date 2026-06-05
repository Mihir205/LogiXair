import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import MetricCard from "./components/MetricCard";

export default function DashboardPage() {
  const weatherData = {
    temperature: 30,
    humidity: 72,
    pressure: 1008,
    windSpeed: 12,
    windDirection: "NE",
    rainfall: 4,
    irradiance: 550,
  };

  return (
    <div className="flex bg-slate-100 min-h-screen">
      <Sidebar />

      <div className="flex-1">
        <Navbar />

        <div className="p-6">

          <h1 className="text-2xl font-bold mb-6">
            Station Overview
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">

            <MetricCard
              title="Temperature"
              value={weatherData.temperature}
              unit="°C"
            />

            <MetricCard
              title="Humidity"
              value={weatherData.humidity}
              unit="%"
            />

            <MetricCard
              title="Pressure"
              value={weatherData.pressure}
              unit="hPa"
            />

            <MetricCard
              title="Wind Speed"
              value={weatherData.windSpeed}
              unit="km/h"
            />

            <MetricCard
              title="Wind Direction"
              value={weatherData.windDirection}
              unit=""
            />

            <MetricCard
              title="Rainfall"
              value={weatherData.rainfall}
              unit="mm"
            />

            <MetricCard
              title="Irradiance"
              value={weatherData.irradiance}
              unit="W/m²"
            />

          </div>

          <div className="bg-white rounded-xl shadow p-6 mt-8">
            <h2 className="text-xl font-semibold mb-4">
              Raw Sensor Data
            </h2>

            <pre className="bg-slate-100 p-4 rounded-lg overflow-auto">
              {JSON.stringify(
                weatherData,
                null,
                2
              )}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}