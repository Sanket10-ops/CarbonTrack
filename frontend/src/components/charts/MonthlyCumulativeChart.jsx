import React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

const formatNumber = (val) =>
  Number(val || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });

export function buildMonthlyCumulativeData(activities = [], targetMonthly = 150) {
  const today = new Date();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const currentDay = today.getDate();

  const dateMap = {};
  if (Array.isArray(activities)) {
    activities.forEach((a) => {
      if (a.logDate) {
        dateMap[a.logDate] = (dateMap[a.logDate] || 0) + Number(a.co2eKg || 0);
      }
    });
  }

  const budget = targetMonthly > 0 ? targetMonthly : 150;
  const dailyBudget = budget / daysInMonth;

  let cumulativeActual = 0;
  const result = [];

  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(today.getFullYear(), today.getMonth(), d);
    const dateKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const targetCeiling = Number((dailyBudget * d).toFixed(2));

    if (d <= currentDay) {
      const dailyVal = dateMap[dateKey] || 0;
      cumulativeActual += dailyVal;
      result.push({
        day: `${d}`,
        "Cumulative Actual": Number(cumulativeActual.toFixed(2)),
        "Target Ceiling": targetCeiling,
      });
    } else {
      result.push({
        day: `${d}`,
        "Target Ceiling": targetCeiling,
      });
    }
  }
  return result;
}

export default function MonthlyCumulativeChart({
  activities = [],
  targetMonthly = 150,
  height = 260,
}) {
  const data = React.useMemo(
    () => buildMonthlyCumulativeData(activities, targetMonthly),
    [activities, targetMonthly]
  );

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="ctActualGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#409461" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#409461" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e6eee5" />
          <XAxis
            dataKey="day"
            stroke="#718177"
            fontSize={12}
            tickLine={false}
            label={{ value: "Day of Month", position: "insideBottom", offset: -5, fontSize: 11 }}
          />
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
          <Legend
            verticalAlign="top"
            height={36}
            formatter={(val) => <span style={{ color: "#18382b", fontSize: "12px", fontWeight: 600 }}>{val}</span>}
          />
          <Area
            type="monotone"
            dataKey="Cumulative Actual"
            stroke="#21613e"
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#ctActualGrad)"
          />
          <Line
            type="monotone"
            dataKey="Target Ceiling"
            stroke="#d97706"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
