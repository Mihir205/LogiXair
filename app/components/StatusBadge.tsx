interface StatusBadgeProps {
  status: "Online" | "Offline" | "Warning";
}

export default function StatusBadge({
  status,
}: StatusBadgeProps) {
  const color =
    status === "Online"
      ? "bg-green-100 text-green-700"
      : status === "Offline"
      ? "bg-red-100 text-red-700"
      : "bg-yellow-100 text-yellow-700";

  return (
    <span
      className={`px-3 py-1 rounded-full text-sm font-medium ${color}`}
    >
      {status}
    </span>
  );
}