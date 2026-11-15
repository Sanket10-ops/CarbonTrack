import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Globe2, Sprout, Target, TrendingDown } from "lucide-react";

const CATEGORY_COLORS = {
  transport: "#0284c7",
  electricity: "#eab308",
  energy: "#eab308",
  food: "#16a34a",
  shopping: "#9333ea",
  other: "#64748b",
};

const formatNumber = (value) =>
  Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });

export default function DashboardCharts({
  pieData,
  weeklyData,
  monthlyData,
  monthlyTarget,
}) {
  return (
    <>
      <div className="charts-grid-2">
        <div className="chart-card">
          <div className="chart-card-header">
            <div>
              <h3>Emissions by Category</h3>
              <p>Breakdown across transport, energy, food, and shopping</p>
            </div>
            <span className="panel-icon"><Globe2 size={18} /></span>
          </div>
          {pieData.length === 0 || pieData.every((item) => item.value === 0) ? (
            <div className="empty-state">
              <span className="empty-state-icon"><Sprout size={24} /></span>
              <b>No category emissions recorded yet</b>
              <p>Record activities from the Activity Log to generate your category breakdown.</p>
            </div>
          ) : (
            <div style={{ width: "100%", height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={85}
                    innerRadius={45}
                    paddingAngle={3}
                  >
                    {pieData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CATEGORY_COLORS[entry.categoryKey] || "#409461"}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [`${formatNumber(value)} kg CO₂e`, "Emissions"]}
                  />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="chart-card">
          <div className="chart-card-header">
            <div>
              <h3>Weekly Comparison</h3>
              <p>Current week vs. previous week (missing dates zero-filled)</p>
            </div>
            <span className="panel-icon"><TrendingDown size={18} /></span>
          </div>
          <div style={{ width: "100%", height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e6eee5" />
                <XAxis dataKey="day" stroke="#718177" fontSize={12} />
                <YAxis stroke="#718177" fontSize={12} unit=" kg" />
                <Tooltip formatter={(value) => [`${formatNumber(value)} kg CO₂e`]} />
                <Legend verticalAlign="bottom" height={36} />
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
        </div>
      </div>

      <div className="chart-card" style={{ marginBottom: 24 }}>
        <div className="chart-card-header">
          <div>
            <h3>{monthlyTarget ? "Monthly Cumulative Emissions vs. Goal Target" : "Monthly Cumulative Emissions"}</h3>
            <p>
              {monthlyTarget
                ? "Actual emissions and a projection from your recent 7-day trend, compared with the target derived from your active reduction goal."
                : "Day-by-day accumulated carbon footprint, extended by a projection based on your last 7 days. Create an active reduction goal to display its target trajectory."}
            </p>
          </div>
          <span className="panel-icon"><Target size={18} /></span>
        </div>
        <div style={{ width: "100%", height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#409461" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#409461" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e6eee5" />
              <XAxis dataKey="day" stroke="#718177" fontSize={12} label={{ value: "Day of Month", position: "insideBottom", offset: -5 }} />
              <YAxis stroke="#718177" fontSize={12} unit=" kg" />
              <Tooltip formatter={(value) => [`${formatNumber(value)} kg CO₂e`]} />
              <Legend verticalAlign="top" height={36} />
              <Area
                type="monotone"
                dataKey="Cumulative Actual"
                stroke="#21613e"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#actualGrad)"
              />
              <Line
                type="monotone"
                dataKey="Projected Cumulative"
                stroke="#0284c7"
                strokeWidth={2}
                strokeDasharray="6 4"
                dot={false}
              />
              {monthlyTarget && (
                <Line
                  type="monotone"
                  dataKey="Target Ceiling"
                  name="Goal Target"
                  stroke="#d97706"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  );
}
