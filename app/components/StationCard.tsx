import StatusBadge from "./StatusBadge";

interface StationCardProps {
  station: string;
  location: string;
  status: "Online" | "Offline" | "Warning";
}

export default function StationCard({
  station,
  location,
  status,
}: StationCardProps) {
  return (
    <div className="bg-white rounded-xl shadow p-5">
      <h3 className="font-semibold text-lg">
        {station}
      </h3>

      <p className="text-gray-500">
        {location}
      </p>

      <div className="mt-4">
        <StatusBadge status={status} />
      </div>
    </div>
  );
}