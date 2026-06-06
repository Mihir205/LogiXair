"use client";

interface StatusBadgeProps {
  status: "Online" | "Offline" | "Warning";
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  // Mapping premium, desaturated dark-mode palettes and matching dot colors
  const config = {
    Online: {
      bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      dot: "bg-emerald-400",
    },
    Offline: {
      bg: "bg-rose-500/10 text-rose-400 border-rose-500/20",
      dot: "bg-rose-400",
    },
    Warning: {
      bg: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      dot: "bg-amber-400",
    },
  };

  const currentStyle = config[status] || config.Warning;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border tracking-wide transition-colors duration-200 ${currentStyle.bg}`}
    >
      {/* Structural Status Indicator Dot */}
      <span className={`w-1.5 h-1.5 rounded-full ${currentStyle.dot}`} />
      
      {status}
    </span>
  );
}