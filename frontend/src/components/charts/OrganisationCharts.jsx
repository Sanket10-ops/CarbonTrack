import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Globe2, TrendingDown } from "lucide-react";

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

export default function OrganisationCharts({ pieData, trendData }) {
  return (
    <div className="charts-grid-2">
      <div className="chart-card">
        <div className="chart-card-header">
          <div>
            <h3>Organisation Emissions by Category</h3>
            <p>Aggregate emissions across company domains</p>
          </div>
          <Globe2 size={18} />
        </div>
        {pieData.length === 0 || pieData.every((item) => item.value === 0) ? (
          <div className="empty-state">No category activity recorded yet.</div>
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
                <Tooltip formatter={(value) => [`${formatNumber(value)} kg CO₂e`]} />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="chart-card">
        <div className="chart-card-header">
          <div>
            <h3>Monthly Team Emission Trends</h3>
            <p>Aggregated carbon footprint over recent reporting months</p>
          </div>
          <TrendingDown size={18} />
        </div>
        <div style={{ width: "100%", height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e6eee5" />
              <XAxis dataKey="month" stroke="#718177" fontSize={12} />
              <YAxis stroke="#718177" fontSize={12} unit=" kg" />
              <Tooltip formatter={(value) => [`${formatNumber(value)} kg CO₂e`]} />
              <Bar dataKey="Team Footprint" fill="#21613e" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
