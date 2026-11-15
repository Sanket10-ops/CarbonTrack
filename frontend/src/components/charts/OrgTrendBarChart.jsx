import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import EmptyState from "../ui/EmptyState.jsx";
import { BarChart3 } from "lucide-react";

const formatNumber = (val) =>
  Number(val || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });

export default function OrgTrendBarChart({
  trends = [],
  height = 260,
}) {
  const data = (trends || []).map((t) => ({
    month: t.periodStart,
    "Team Emissions": Number(t.totalEmissionsKg || 0),
  }));

  if (data.length === 0) {
    return (
      <EmptyState
        icon={BarChart3}
        title="No trend data recorded"
        description="Emissions logged by team members will populate monthly trends."
      />
    );
  }

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e6eee5" />
          <XAxis dataKey="month" stroke="#718177" fontSize={12} tickLine={false} />
          <YAxis stroke="#718177" fontSize={12} tickLine={false} unit=" kg" />
          <Tooltip
            formatter={(val) => [`${formatNumber(val)} kg CO₂e`]}
            contentStyle={{
              background: "#123526",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "10px",
              color: "#fff",
              fontSize: "12px",
            }}
          />
          <Bar dataKey="Team Emissions" fill="#21613e" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
