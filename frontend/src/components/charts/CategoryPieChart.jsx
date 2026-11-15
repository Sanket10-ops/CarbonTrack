import React from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";
import EmptyState from "../ui/EmptyState.jsx";
import { PieChart as PieIcon } from "lucide-react";

const CATEGORY_COLORS = {
  transport: "#0284c7",    // Ocean Blue
  electricity: "#eab308",  // Amber Yellow
  energy: "#eab308",       // Amber Yellow
  food: "#16a34a",         // Emerald Green
  shopping: "#9333ea",     // Purple
  default: "#64748b",      // Slate
};

const pretty = (val) =>
  String(val || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

const formatNumber = (val) =>
  Number(val || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });

export default function CategoryPieChart({
  categoryTotals = [],
  height = 260,
  emptyTitle = "No category emissions yet",
  emptyDescription = "Log activities across transport, food, energy, or shopping.",
}) {
  const data = (categoryTotals || [])
    .filter((c) => Number(c.totalEmissionsKg || 0) > 0)
    .map((c) => ({
      name: pretty(c.category),
      value: Number(c.totalEmissionsKg || 0),
      rawKey: String(c.category || "").toLowerCase(),
    }));

  if (data.length === 0) {
    return (
      <EmptyState
        icon={PieIcon}
        title={emptyTitle}
        description={emptyDescription}
      />
    );
  }

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={85}
            paddingAngle={3}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={CATEGORY_COLORS[entry.rawKey] || CATEGORY_COLORS.default}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(val) => [`${formatNumber(val)} kg CO₂e`, "Emissions"]}
            contentStyle={{
              background: "#123526",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "10px",
              color: "#fff",
              fontSize: "12px",
            }}
            itemStyle={{ color: "#7ce89f" }}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(val) => <span style={{ color: "#18382b", fontSize: "12px", fontWeight: 600 }}>{val}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
