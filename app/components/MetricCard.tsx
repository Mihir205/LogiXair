interface MetricCardProps {
  title: string;
  value: string | number;
  unit: string;
}

export default function MetricCard({
  title,
  value,
  unit,
}: MetricCardProps) {
  return (
    <div className="bg-white rounded-xl shadow p-5">
      <h3 className="text-gray-500 text-sm">
        {title}
      </h3>

      <div className="mt-2 text-3xl font-bold">
        {value}
        <span className="text-lg ml-1">
          {unit}
        </span>
      </div>
    </div>
  );
}