import React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

const formatNumber = (val) =>
  Number(val || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });

export function buildWeeklyData(activities = [], timeline = []) {
  const today = new Date();
  const dayOfWeek = (today.getDay() + 6) % 7; // Mon = 0, Sun = 6

  const currentMon = new Date(today);
  currentMon.setDate(today.getDate() - dayOfWeek);

  const prevMon = new Date(currentMon);
  prevMon.setDate(currentMon.getDate() - 7);

  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const dateMap = {};

  if (Array.isArray(activities)) {
    activities.forEach((a) => {
      if (a.logDate) {
        dateMap[a.logDate] = (dateMap[a.logDate] || 0) + Number(a.co2eKg || 0);
      }
    });
  }

  if (Array.isArray(timeline)) {
    timeline.forEach((t) => {
      if (t.periodStart) {
        dateMap[t.periodStart] = Math.max(
          dateMap[t.periodStart] || 0,
          Number(t.totalEmissionsKg || 0)
        );
      }
    });
  }

  const result = [];
  for (let i = 0; i < 7; i++) {
    const curDate = new Date(currentMon);
    curDate.setDate(currentMon.getDate() + i);
    const curKey = `${curDate.getFullYear()}-${String(curDate.getMonth() + 1).padStart(2, "0")}-${String(curDate.getDate()).padStart(2, "0")}`;

    const prevDate = new Date(prevMon);
    prevDate.setDate(prevMon.getDate() + i);
    const prevKey = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}-${String(prevDate.getDate()).padStart(2, "0")}`;

    result.push({
      day: dayNames[i],
      "Current Week": Number((dateMap[curKey] || 0).toFixed(2)),
      "Previous Week": Number((dateMap[prevKey] || 0).toFixed(2)),
    });
  }
  return result;
}

export default function WeeklyTrendChart({
  activities = [],
  timeline = [],
  height = 260,
}) {
  const data = React.useMemo(
    () => buildWeeklyData(activities, timeline),
    [activities, timeline]
  );

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e6eee5" />
          <XAxis dataKey="day" stroke="#718177" fontSize={12} tickLine={false} />
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
            verticalAlign="bottom"
            height={36}
            formatter={(val) => <span style={{ color: "#18382b", fontSize: "12px", fontWeight: 600 }}>{val}</span>}
          />
          <Line
            type="monotone"
            dataKey="Current Week"
            stroke="#21613e"
            strokeWidth={3}
            dot={{ r: 4, fill: "#21613e" }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="Previous Week"
            stroke="#94a3b8"
            strokeWidth={2}
            strokeDasharray="4 4"
            dot={{ r: 3, fill: "#94a3b8" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
