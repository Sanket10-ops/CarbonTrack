import React from "react";

export default function ProgressBar({
  value = 0,
  max = 100,
  label,
  valueLabel,
  color = "emerald", // emerald, amber, red, blue
  size = "md", // sm, md, lg
  className = "",
}) {
  const percentage = Math.min(100, Math.max(0, (value / (max || 1)) * 100));

  const colorClass = {
    emerald: "bg-emerald-600",
    amber: "bg-amber-500",
    red: "bg-rose-500",
    blue: "bg-sky-600",
  }[color] || "bg-emerald-600";

  const sizeClass = {
    sm: "h-1.5",
    md: "h-2.5",
    lg: "h-4",
  }[size] || "h-2.5";

  return (
    <div className={`ct-progress-wrap ${className}`}>
      {(label || valueLabel) && (
        <div className="ct-progress-labels">
          {label && <span className="ct-progress-label">{label}</span>}
          {valueLabel && <span className="ct-progress-val-label">{valueLabel}</span>}
        </div>
      )}
      <div className={`ct-progress-track ${sizeClass}`}>
        <div
          className={`ct-progress-bar ${colorClass}`}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        />
      </div>
    </div>
  );
}
