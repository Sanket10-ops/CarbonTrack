import React, { useState, useEffect, useMemo } from "react";
import {
  PieChart as PieIcon,
  BarChart3,
  Calendar,
  Globe2,
  TrendingDown,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
} from "lucide-react";
import Card from "../components/ui/Card.jsx";
import StatCard from "../components/ui/StatCard.jsx";
import Button from "../components/ui/Button.jsx";
import LoadingSpinner from "../components/ui/LoadingSpinner.jsx";
import ErrorState from "../components/ui/ErrorState.jsx";
import CategoryPieChart from "../components/charts/CategoryPieChart.jsx";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { getFootprintAnalytics } from "../api.js";

const formatNumber = (val) =>
  Number(val || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });

const pretty = (val) =>
  String(val || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

export default function MyFootprintPage() {
  const [period, setPeriod] = useState("monthly"); // daily, weekly, monthly
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadAnalytics() {
    setLoading(true);
    setError("");

    try {
      const data = await getFootprintAnalytics(period);
      setAnalytics(data);
    } catch (err) {
      setError(err.message || "Failed to load footprint analytics.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAnalytics();
  }, [period]);

  const total = Number(analytics?.totalEmissionsKg || 0);
  const categories = analytics?.categoryTotals || [];
  const timeline = analytics?.timeline || [];

  // Historical trend bar data
  const chartData = useMemo(() => {
    if (!timeline || timeline.length === 0) return [];
    return timeline.map((pt, idx) => ({
      date: pt.periodStart || `Period ${idx + 1}`,
      "Footprint": Number(pt.totalEmissionsKg || 0),
    }));
  }, [timeline]);

  // Primary emitting category
  const dominantCategory = useMemo(() => {
    if (!categories || categories.length === 0) return null;
    return [...categories].sort(
      (a, b) => Number(b.totalEmissionsKg || 0) - Number(a.totalEmissionsKg || 0)
    )[0];
  }, [categories]);

  return (
    <div className="ct-page-layout">
      {/* Page Header with Filter Buttons */}
      <div className="ct-page-header">
        <div>
          <h1 className="ct-page-title">My Carbon Footprint</h1>
          <p className="ct-page-description">
            In-depth environmental analytics, historical trajectory, and category distributions.
          </p>
        </div>

        {/* Period Selector Tabs */}
        <div className="ct-filter-pill-group">
          {[
            { id: "daily", label: "Today" },
            { id: "weekly", label: "Weekly View" },
            { id: "monthly", label: "Monthly View" },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              className={`ct-filter-pill ${period === item.id ? "is-active" : ""}`}
              onClick={() => setPeriod(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <LoadingSpinner fullHeight text="Analyzing footprint metrics…" />
      ) : error ? (
        <ErrorState message={error} onRetry={loadAnalytics} />
      ) : (
        <>
          {/* Top Analytics Metrics */}
          <div className="ct-stat-grid">
            <StatCard
              icon={Globe2}
              label={`Total Footprint (${pretty(period)})`}
              value={formatNumber(total)}
              unit="kg CO₂e"
              note={`${analytics?.startDate || ""} to ${analytics?.endDate || ""}`}
              tone="emerald"
            />
            <StatCard
              icon={Layers}
              label="Tracked Categories"
              value={categories.length}
              note="Categories with recorded emissions"
              tone="blue"
            />
            <StatCard
              icon={BarChart3}
              label="Historical Data Points"
              value={timeline.length}
              note="Logged periods returned by API"
              tone="amber"
            />
            <StatCard
              icon={PieIcon}
              label="Primary Driver"
              value={dominantCategory ? pretty(dominantCategory.category) : "None"}
              note={
                dominantCategory
                  ? `${formatNumber(dominantCategory.totalEmissionsKg)} kg CO₂e`
                  : "No category data"
              }
              tone="purple"
            />
          </div>

          {/* Charts Row */}
          <div className="ct-grid-2">
            {/* Category Breakdown Pie */}
            <Card
              title="Category Emission Breakdown"
              subtitle="Distribution of carbon output across lifestyle activities"
              icon={PieIcon}
            >
              <CategoryPieChart
                categoryTotals={categories}
                height={280}
                emptyTitle="No category emissions for this period"
                emptyDescription="Try selecting a different time window or recording new activities."
              />
            </Card>

            {/* Historical Emissions Timeline */}
            <Card
              title="Historical Emissions Trajectory"
              subtitle={`Total carbon emissions grouped by ${period} period`}
              icon={BarChart3}
            >
              {chartData.length === 0 ? (
                <div className="ct-empty-state">
                  <BarChart3 size={28} className="text-muted" />
                  <h4 className="ct-empty-title">No timeline data available</h4>
                  <p className="ct-empty-description">
                    Save activities in the Activity Logger to populate your historical timeline.
                  </p>
                </div>
              ) : (
                <div style={{ width: "100%", height: 280 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e6eee5" />
                      <XAxis dataKey="date" stroke="#718177" fontSize={12} tickLine={false} />
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
                      <Bar dataKey="Footprint" fill="#21613e" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>
          </div>

          {/* Category Detail Table */}
          <Card
            title="Category Detail Breakdown"
            subtitle="Verified values aggregated from your authenticated account"
            icon={Layers}
          >
            <div className="ct-table-container">
              <table className="ct-table">
                <thead>
                  <tr>
                    <th>Domain</th>
                    <th>Emissions (kg CO₂e)</th>
                    <th>Share of Total</th>
                    <th>Benchmark Status</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-6 text-muted">
                        No activity records found in this date window.
                      </td>
                    </tr>
                  ) : (
                    categories.map((c, idx) => {
                      const amount = Number(c.totalEmissionsKg || 0);
                      const share = total > 0 ? ((amount / total) * 100).toFixed(1) : 0;
                      return (
                        <tr key={idx}>
                          <td>
                            <b>{pretty(c.category)}</b>
                          </td>
                          <td>
                            <span className="font-bold text-dark">
                              {formatNumber(amount)} kg CO₂e
                            </span>
                          </td>
                          <td>
                            <div className="flex items-center gap-2">
                              <span className="w-12 text-xs font-semibold">{share}%</span>
                              <div className="ct-mini-bar-track">
                                <div
                                  className="ct-mini-bar-fill"
                                  style={{ width: `${Math.min(100, share)}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className="ct-tag-category">Active Tracking</span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
