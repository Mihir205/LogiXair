export default function SensorTable() {
  const sensors = [
    {
      name: "Temperature",
      value: "30 °C",
    },
    {
      name: "Humidity",
      value: "72 %",
    },
    {
      name: "Pressure",
      value: "1008 hPa",
    },
    {
      name: "Wind Speed",
      value: "12 km/h",
    },
    {
      name: "Rainfall",
      value: "4 mm",
    },
  ];

  return (
    <div className="bg-white rounded-xl shadow p-5">
      <h2 className="font-semibold mb-4">
        Sensor Readings
      </h2>

      <table className="w-full">
        <tbody>
          {sensors.map((sensor) => (
            <tr
              key={sensor.name}
              className="border-b"
            >
              <td className="py-3">
                {sensor.name}
              </td>

              <td className="py-3 text-right font-medium">
                {sensor.value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}