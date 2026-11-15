import React, { useState, useEffect, useMemo } from "react";
import {
  Leaf,
  Calendar,
  Activity,
  Target,
  Award,
  ArrowRight,
  TrendingDown,
  Sparkles,
  PieChart as PieIcon,
  BarChart3,
  Globe2,
  Clock,
  Plus,
} from "lucide-react";
import StatCard from "../components/ui/StatCard.jsx";
import Card from "../components/ui/Card.jsx";
import Button from "../components/ui/Button.jsx";
import Badge from "../components/ui/Badge.jsx";
import ProgressBar from "../components/ui/ProgressBar.jsx";
import LoadingSpinner from "../components/ui/LoadingSpinner.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import ErrorState from "../components/ui/ErrorState.jsx";
import CategoryPieChart from "../components/charts/CategoryPieChart.jsx";
import WeeklyTrendChart from "../components/charts/WeeklyTrendChart.jsx";
import MonthlyCumulativeChart from "../components/charts/MonthlyCumulativeChart.jsx";

import {
  getFootprintAnalytics,
  getActivities,
  getGoals,
  getGoalProgress,
  getMyBadges,
} from "../api.js";

const formatNumber = (val) =>
  Number(val || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });

const todayLocal = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export default function OverviewPage({ user, onNavigate }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [monthlyAnalytics, setMonthlyAnalytics] = useState(null);
  const [weeklyAnalytics, setWeeklyAnalytics] = useState(null);
  const [activities, setActivities] = useState([]);
  const [goals, setGoals] = useState([]);
  const [goalProgress, setGoalProgress] = useState(null);
  const [badges, setBadges] = useState([]);

  async function loadDashboardData() {
    setLoading(true);
    setError("");

    try {
      const [mRes, wRes, actRes, gRes, bRes] = await Promise.allSettled([
        getFootprintAnalytics("monthly"),
        getFootprintAnalytics("weekly"),
        getActivities(),
        getGoals(),
        getMyBadges(),
      ]);

      if (mRes.status === "fulfilled") setMonthlyAnalytics(mRes.value);
      if (wRes.status === "fulfilled") setWeeklyAnalytics(wRes.value);
      if (actRes.status === "fulfilled") {
        const list = Array.isArray(actRes.value)
          ? actRes.value
          : actRes.value?.content || actRes.value?.activities || [];
        setActivities(list);
      }
      if (bRes.status === "fulfilled") {
        const bList = Array.isArray(bRes.value)
          ? bRes.value
          : bRes.value?.badges || bRes.value?.content || [];
        setBadges(bList);
      }

      if (gRes.status === "fulfilled") {
        const gList = Array.isArray(gRes.value)
          ? gRes.value
          : gRes.value?.goals || gRes.value?.content || [];
        setGoals(gList);

        const activeGoal = gList.find((g) => g.status === "ACTIVE") || gList[0];
        if (activeGoal) {
          try {
            const p = await getGoalProgress(activeGoal.id);
            setGoalProgress(p);
          } catch {
            setGoalProgress(null);
          }
        }
      }
    } catch (err) {
      setError(err.message || "Failed to load dashboard overview.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Today's emissions
  const todayDate = todayLocal();
  const todayEmissions = useMemo(() => {
    return activities
      .filter((a) => a.logDate === todayDate)
      .reduce((acc, curr) => acc + Number(curr.co2eKg || 0), 0);
  }, [activities, todayDate]);

  // Weekly & Monthly totals
  const weeklyTotal = Number(weeklyAnalytics?.totalEmissionsKg || 0);
  const monthlyTotal = Number(monthlyAnalytics?.totalEmissionsKg || 0);

  // Reduction progress percentage
  const reductionPct = goalProgress?.currentReductionPct != null
    ? Number(goalProgress.currentReductionPct)
    : 0;

  if (loading) {
    return <LoadingSpinner fullHeight text="Loading sustainability dashboard…" />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadDashboardData} />;
  }

  return (
    <div className="ct-page-layout">
      {/* Overview Welcome Banner */}
      <div className="ct-welcome-banner">
        <div className="ct-welcome-content">
          <span className="ct-welcome-eyebrow">SUSTAINABILITY DASHBOARD</span>
          <h1 className="ct-welcome-title">
            Welcome back, <span>{user?.username || "Eco Member"}</span>
          </h1>
          <p className="ct-welcome-description">
            Your real-time carbon intelligence feed. You've logged{" "}
            <b>{activities.length} activities</b> toward your sustainability goals.
          </p>
        </div>
        <div className="ct-welcome-actions">
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => onNavigate("activity")}
          >
            Log Activity
          </Button>
          <Button
            variant="outline"
            icon={Target}
            onClick={() => onNavigate("goals")}
          >
            View Goals
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="ct-stat-grid">
        <StatCard
          icon={Leaf}
          label="Today's Footprint"
          value={formatNumber(todayEmissions)}
          unit="kg CO₂e"
          note="Logged lifestyle activities today"
          tone="emerald"
        />
        <StatCard
          icon={Calendar}
          label="Weekly Footprint (7 Days)"
          value={formatNumber(weeklyTotal)}
          unit="kg CO₂e"
          note="Trailing 7-day carbon total"
          tone="blue"
        />
        <StatCard
          icon={BarChart3}
          label="Monthly Footprint"
          value={formatNumber(monthlyTotal)}
          unit="kg CO₂e"
          note="Current month to date"
          tone="purple"
        />
        <StatCard
          icon={Target}
          label="Reduction Achieved"
          value={`${reductionPct > 0 ? "+" : ""}${reductionPct.toFixed(1)}%`}
          note={
            goalProgress?.targetReductionPct
              ? `Target: ${goalProgress.targetReductionPct}% reduction`
              : "Set a goal to track reduction"
          }
          tone="amber"
          isPositiveReduction={reductionPct >= 0}
        />
      </div>

      {/* Goal Widget Card */}
      {goalProgress ? (
        <Card
          title={`Active Goal: ${goalProgress.targetReductionPct}% Reduction`}
          subtitle={`${goalProgress.startDate} to ${goalProgress.endDate} (${Math.max(0, goalProgress.daysRemaining || 0)} days remaining)`}
          icon={Target}
          action={
            <Button
              variant="outline"
              size="sm"
              icon={ArrowRight}
              onClick={() => onNavigate("goals")}
            >
              Goal Details
            </Button>
          }
        >
          <div className="ct-goal-summary-grid">
            <div className="ct-goal-stat">
              <span className="text-xs text-muted">Current Footprint</span>
              <b className="text-base text-dark">{formatNumber(goalProgress.currentEmissionsKg)} kg CO₂e</b>
            </div>
            <div className="ct-goal-stat">
              <span className="text-xs text-muted">Target Budget</span>
              <b className="text-base text-dark">{formatNumber(goalProgress.targetEmissionsKg)} kg CO₂e</b>
            </div>
            <div className="ct-goal-stat">
              <span className="text-xs text-muted">Projected Footprint</span>
              <b className="text-base text-dark">{formatNumber(goalProgress.projectedEmissionsKg)} kg CO₂e</b>
            </div>
            <div className="ct-goal-stat">
              <span className="text-xs text-muted">Status</span>
              <Badge variant={goalProgress.onTrack ? "success" : "warning"}>
                {goalProgress.onTrack ? "On Track" : "Action Needed"}
              </Badge>
            </div>
          </div>
          <div className="mt-4">
            <ProgressBar
              value={Number(goalProgress.currentEmissionsKg || 0)}
              max={Number(goalProgress.targetEmissionsKg || 1)}
              label="Carbon Budget Trajectory"
              valueLabel={`${Math.min(100, (Number(goalProgress.currentEmissionsKg || 0) / Number(goalProgress.targetEmissionsKg || 1)) * 100).toFixed(1)}% of budget`}
              color={goalProgress.onTrack ? "emerald" : "amber"}
            />
          </div>
        </Card>
      ) : (
        <Card
          title="Active Reduction Goal"
          subtitle="Commit to a verified reduction target to earn achievements"
          icon={Target}
          action={
            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={() => onNavigate("goals")}
            >
              Set Goal
            </Button>
          }
        >
          <EmptyState
            icon={Target}
            title="No active goal in progress"
            description="Setting an achievable carbon target helps build consistent sustainable habits."
            actionLabel="Create Reduction Goal"
            onAction={() => onNavigate("goals")}
          />
        </Card>
      )}

      {/* Visual Analytics 2-Column Grid */}
      <div className="ct-grid-2">
        {/* Category-Wise Emissions Pie Chart */}
        <Card
          title="Emissions by Category"
          subtitle="Monthly breakdown across lifestyle categories"
          icon={PieIcon}
          action={
            <Button
              variant="quiet"
              size="sm"
              icon={ArrowRight}
              onClick={() => onNavigate("footprint")}
            >
              Full Analytics
            </Button>
          }
        >
          <CategoryPieChart
            categoryTotals={monthlyAnalytics?.categoryTotals || []}
            height={260}
          />
        </Card>

        {/* Current Week vs Previous Week Line Chart */}
        <Card
          title="Weekly Comparison"
          subtitle="Current week vs. previous week (missing dates zero-filled)"
          icon={TrendingDown}
          action={
            <Button
              variant="quiet"
              size="sm"
              icon={ArrowRight}
              onClick={() => onNavigate("footprint")}
            >
              Trends
            </Button>
          }
        >
          <WeeklyTrendChart
            activities={activities}
            timeline={weeklyAnalytics?.timeline || []}
            height={260}
          />
        </Card>
      </div>

      {/* Monthly Cumulative Emissions vs Target Chart */}
      <Card
        title="Monthly Cumulative Emissions vs. Target Ceiling"
        subtitle="Cumulative trajectory across the days of the month against budget"
        icon={BarChart3}
      >
        <MonthlyCumulativeChart
          activities={activities}
          targetMonthly={goalProgress?.targetEmissionsKg ? Number(goalProgress.targetEmissionsKg) : 150}
          height={260}
        />
      </Card>

      {/* Lower Row: Recent Activities & Recommendations */}
      <div className="ct-grid-2">
        {/* Recent Activities */}
        <Card
          title="Recent Activity Log"
          subtitle="Latest lifestyle entries and carbon equivalents"
          icon={Clock}
          action={
            <Button
              variant="quiet"
              size="sm"
              icon={ArrowRight}
              onClick={() => onNavigate("activity")}
            >
              View All ({activities.length})
            </Button>
          }
        >
          {activities.length === 0 ? (
            <EmptyState
              icon={Activity}
              title="No activities recorded yet"
              description="Record your commute, meals, electricity, or purchases to track impact."
              actionLabel="Record Activity"
              onAction={() => onNavigate("activity")}
            />
          ) : (
            <div className="ct-activity-list-compact">
              {activities.slice(0, 5).map((act, idx) => (
                <div key={act.id || idx} className="ct-activity-item-compact">
                  <div className="ct-activity-dot" />
                  <div className="ct-activity-info">
                    <span className="ct-activity-name">
                      {String(act.activityType || act.category).replaceAll("_", " ")}
                    </span>
                    <span className="ct-activity-date">
                      {act.logDate} · {act.quantity} {act.unit}
                    </span>
                  </div>
                  <div className="ct-activity-co2">
                    <b>{formatNumber(act.co2eKg)}</b> <small>kg CO₂e</small>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Badges Preview & Recommendations */}
        <div className="flex flex-col gap-6">
          {/* Badges Preview */}
          <Card
            title="Earned Badges"
            subtitle={`${badges.length} badges unlocked`}
            icon={Award}
            action={
              <Button
                variant="quiet"
                size="sm"
                icon={ArrowRight}
                onClick={() => onNavigate("badges")}
              >
                Collection
              </Button>
            }
          >
            {badges.length === 0 ? (
              <EmptyState
                icon={Award}
                title="No badges earned yet"
                description="Log activities consistently and achieve reduction targets to unlock badges."
                actionLabel="Explore Badges"
                onAction={() => onNavigate("badges")}
              />
            ) : (
              <div className="ct-badge-grid-preview">
                {badges.slice(0, 4).map((b, idx) => (
                  <div key={b.id || idx} className="ct-badge-preview-item">
                    <div className="ct-badge-icon-box">
                      <Award size={20} className="text-emerald-700" />
                    </div>
                    <span className="ct-badge-name-text">{b.name}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Sustainability Recommendations */}
          <Card
            title="Personalised Eco Tips"
            subtitle="Actionable habits to reduce your weekly emissions"
            icon={Sparkles}
          >
            <div className="ct-tips-list">
              <div className="ct-tip-card">
                <b>🚗 Switch Transit:</b>
                <p>Replace short vehicular trips under 3 km with walking or cycling.</p>
              </div>
              <div className="ct-tip-card">
                <b>🥗 Plant-Forward Diet:</b>
                <p>Enjoy a plant-based lunch twice weekly to save ~12 kg CO₂e per month.</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
