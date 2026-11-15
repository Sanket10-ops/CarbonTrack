import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

export default function StatCard({
  icon: Icon,
  label,
  value,
  unit,
  note,
  change,
  isPositiveReduction = true,
  tone = "default", // default, emerald, blue, amber, purple
  className = "",
}) {
  return (
    <div className={`ct-stat-card ct-tone-${tone} ${className}`}>
      <div className="ct-stat-top">
        <span className="ct-stat-label">{label}</span>
        {Icon && (
          <div className="ct-stat-icon">
            <Icon size={18} />
          </div>
        )}
      </div>

      <div className="ct-stat-value-group">
        <span className="ct-stat-value">{value ?? "—"}</span>
        {unit && <span className="ct-stat-unit">{unit}</span>}
      </div>

      {(note || change !== undefined) && (
        <div className="ct-stat-bottom">
          {change !== undefined && (
            <span
              className={`ct-stat-change ${
                isPositiveReduction ? "is-favorable" : "is-unfavorable"
              }`}
            >
              {isPositiveReduction ? (
                <TrendingDown size={14} />
              ) : (
                <TrendingUp size={14} />
              )}
              {change}
            </span>
          )}
          {note && <span className="ct-stat-note">{note}</span>}
        </div>
      )}
    </div>
  );
}
