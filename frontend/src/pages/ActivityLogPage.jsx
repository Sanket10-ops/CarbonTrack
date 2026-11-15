import React, { useState, useEffect, useMemo } from "react";
import {
  Car,
  Utensils,
  Zap,
  ShoppingBag,
  Leaf,
  PlusCircle,
  CheckCircle2,
  AlertCircle,
  Clock,
  Calendar,
  Sparkles,
} from "lucide-react";
import Card from "../components/ui/Card.jsx";
import Input from "../components/ui/Input.jsx";
import Select from "../components/ui/Select.jsx";
import Button from "../components/ui/Button.jsx";
import DataTable from "../components/ui/DataTable.jsx";
import LoadingSpinner from "../components/ui/LoadingSpinner.jsx";
import {
  getEmissionFactors,
  getActivities,
  addActivity,
} from "../api.js";

const pretty = (val) =>
  String(val || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

const formatNumber = (val) =>
  Number(val || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });

const todayLocal = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const QUICK_PRESETS = {
  transport: [
    { label: "🚗 10 km Car Commute", activityType: "car_travel", quantity: 10, unit: "km" },
    { label: "🚆 15 km Train Commute", activityType: "train_travel", quantity: 15, unit: "passenger-km" },
    { label: "🚌 5 km City Bus", activityType: "bus_travel", quantity: 5, unit: "passenger-km" },
    { label: "✈️ 500 km Domestic Flight", activityType: "flight_travel", quantity: 500, unit: "passenger-km", flightDistanceKm: 500 },
  ],
  energy: [
    { label: "⚡ 5 kWh Daily Home Power", activityType: "grid_electricity", quantity: 5, unit: "kWh", energySource: "Grid electricity" },
    { label: "❄️ 15 kWh AC / Cooling", activityType: "grid_electricity", quantity: 15, unit: "kWh", energySource: "Air Conditioning" },
  ],
  food: [
    { label: "🥗 1 Plant-based Meal", activityType: "plant_based_food", quantity: 0.4, unit: "kg", mealType: "Lunch", servings: 1 },
    { label: "🍗 1 Chicken Meal", activityType: "chicken", quantity: 0.3, unit: "kg", mealType: "Dinner", servings: 1 },
    { label: "🥩 1 Beef Meal", activityType: "beef", quantity: 0.25, unit: "kg", mealType: "Dinner", servings: 1 },
  ],
  shopping: [
    { label: "👕 1 Apparel Item (0.5 kg)", activityType: "clothing", quantity: 0.5, unit: "kg", productCategory: "Clothing", spendAmount: 30, spendCurrency: "USD" },
    { label: "💻 1 Electronic Device", activityType: "electronics", quantity: 1, unit: "item", productCategory: "Electronics", spendAmount: 250, spendCurrency: "USD" },
    { label: "📚 2 kg Books / Paper", activityType: "paper", quantity: 2, unit: "kg", productCategory: "Stationery", spendAmount: 15, spendCurrency: "USD" },
  ],
};

export default function ActivityLogPage() {
  const [category, setCategory] = useState("transport");
  const [factors, setFactors] = useState([]);
  const [factorsLoading, setFactorsLoading] = useState(true);
  const [activityType, setActivityType] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");
  const [logDate, setLogDate] = useState(todayLocal());

  // Category specific inputs
  const [flightDistanceKm, setFlightDistanceKm] = useState("");
  const [energySource, setEnergySource] = useState("Grid electricity");
  const [mealType, setMealType] = useState("Lunch");
  const [servings, setServings] = useState("1");
  const [productCategory, setProductCategory] = useState("General");
  const [spendAmount, setSpendAmount] = useState("20");
  const [spendCurrency, setSpendCurrency] = useState("USD");

  const [activities, setActivities] = useState([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Load factors & activities
  useEffect(() => {
    let cancelled = false;
    getEmissionFactors()
      .then((data) => {
        if (!cancelled) {
          setFactors(Array.isArray(data) ? data : []);
          if (!Array.isArray(data) || data.length === 0) setError("No emission factors are configured by the backend.");
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Could not load emission factors.");
      })
      .finally(() => { if (!cancelled) setFactorsLoading(false); });

    loadActivities();
    return () => { cancelled = true; };
  }, []);

  async function loadActivities() {
    setActivitiesLoading(true);
    try {
      const data = await getActivities();
      const list = Array.isArray(data)
        ? data
        : data?.content || data?.activities || [];
      setActivities(list);
    } catch {
      setActivities([]);
    } finally {
      setActivitiesLoading(false);
    }
  }

  // Filter factors for the selected category
  const categoryFactors = useMemo(() => {
    return factors.filter((f) => {
      const type = f.activityType.toLowerCase();
      if (category === "transport") return type.includes("travel") || type.includes("flight");
      if (category === "energy") return type.includes("electricity") || type.includes("energy");
      if (category === "food") return ["beef", "chicken", "plant_based_food"].includes(type);
      if (category === "shopping") return ["clothing", "electronics", "paper", "plastic"].includes(type);
      return false;
    });
  }, [category, factors]);

  useEffect(() => {
    if (categoryFactors.length > 0) {
      setActivityType(categoryFactors[0].activityType);
      setUnit(categoryFactors[0].unit);
    }
  }, [categoryFactors]);

  const selectedFactor = useMemo(() => {
    return (
      categoryFactors.find((f) => f.activityType === activityType) ||
      categoryFactors[0]
    );
  }, [categoryFactors, activityType]);

  const liveCo2e = useMemo(() => {
    const q = Number(quantity);
    if (!q || q <= 0 || !selectedFactor) return 0;
    const factor = Number(selectedFactor.kgCo2ePerUnit || 0);
    return (q * factor).toFixed(2);
  }, [quantity, selectedFactor]);

  function handleCategoryChange(catId) {
    setCategory(catId);
    setQuantity("");
    setError("");
    setSuccess("");
  }

  function applyPreset(preset) {
    setActivityType(preset.activityType);
    setQuantity(String(preset.quantity));
    setUnit(preset.unit);
    if (preset.flightDistanceKm) setFlightDistanceKm(String(preset.flightDistanceKm));
    if (preset.energySource) setEnergySource(preset.energySource);
    if (preset.mealType) setMealType(preset.mealType);
    if (preset.servings) setServings(String(preset.servings));
    if (preset.productCategory) setProductCategory(preset.productCategory);
    if (preset.spendAmount) setSpendAmount(String(preset.spendAmount));
    if (preset.spendCurrency) setSpendCurrency(preset.spendCurrency);
    setError("");
    setSuccess(`Loaded preset: "${preset.label}". Click 'Record Activity' to save.`);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (submitting) return;

    setError("");
    setSuccess("");

    if (factorsLoading || !selectedFactor) {
      setError("A verified backend emission factor is required before saving this activity.");
      return;
    }

    const q = Number(quantity);
    if (!q || q <= 0) {
      setError("Please specify a quantity greater than zero.");
      return;
    }

    const isFlight = activityType === "flight_travel";
    const payload = {
      category: category === "energy" ? "electricity" : category,
      activityType,
      quantity: q,
      unit: unit || selectedFactor?.unit || "unit",
      logDate,
    };

    if (category === "transport" && isFlight) {
      payload.flightDistanceKm = flightDistanceKm ? Number(flightDistanceKm) : q;
    }
    if (category === "energy") {
      payload.energySource = energySource.trim() || "Grid electricity";
    }
    if (category === "food") {
      payload.mealType = mealType.trim() || "Meal";
      payload.servings = Number(servings) > 0 ? Number(servings) : 1;
    }
    if (category === "shopping") {
      payload.productCategory = productCategory.trim() || "General Goods";
      payload.spendAmount = Number(spendAmount) >= 0 ? Number(spendAmount) : 0;
      payload.spendCurrency = (spendCurrency.trim() || "USD").toUpperCase();
    }

    setSubmitting(true);
    try {
      await addActivity(payload);
      setSuccess(`Recorded ${pretty(activityType)} (${liveCo2e} kg CO₂e) successfully!`);
      setQuantity("");
      await loadActivities();
    } catch (err) {
      setError(err.message || "Failed to record activity. Please check input requirements.");
    } finally {
      setSubmitting(false);
    }
  }

  const columns = [
    {
      header: "Activity Type",
      key: "activityType",
      render: (row) => <b>{pretty(row.activityType || row.category)}</b>,
    },
    {
      header: "Category",
      key: "category",
      render: (row) => (
        <span className="ct-tag-category">{pretty(row.category)}</span>
      ),
    },
    {
      header: "Quantity",
      key: "quantity",
      render: (row) => `${row.quantity ?? "—"} ${row.unit || ""}`,
    },
    {
      header: "Date",
      key: "logDate",
      render: (row) => row.logDate || "—",
    },
    {
      header: "Calculated Emissions",
      key: "co2eKg",
      align: "right",
      render: (row) => (
        <span className="font-bold text-emerald-800">
          {formatNumber(row.co2eKg)} <small className="text-muted font-normal">kg CO₂e</small>
        </span>
      ),
    },
  ];

  return (
    <div className="ct-page-layout">
      {/* Page Header */}
      <div className="ct-page-header">
        <div>
          <h1 className="ct-page-title">Activity Logger</h1>
          <p className="ct-page-description">
            Record real-time lifestyle activities across transport, food, energy, and shopping.
          </p>
        </div>
      </div>

      {/* Main Activity Logging Form */}
      <Card
        title="Record New Lifestyle Activity"
        subtitle="Fill in activity details to calculate verified carbon equivalents"
        icon={PlusCircle}
      >
        {/* Category Tabs */}
        <div className="ct-tab-bar" role="tablist">
          {[
            { id: "transport", label: "Transport", icon: Car },
            { id: "food", label: "Food & Diet", icon: Utensils },
            { id: "energy", label: "Energy & Power", icon: Zap },
            { id: "shopping", label: "Shopping & Goods", icon: ShoppingBag },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = category === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                className={`ct-tab-btn ${isActive ? "is-active" : ""}`}
                onClick={() => handleCategoryChange(tab.id)}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Quick-log preset chips */}
        <div className="ct-presets-section">
          <span className="ct-presets-title">
            <Sparkles size={13} className="text-emerald-700" />
            <span>Quick-log presets:</span>
          </span>
          <div className="ct-presets-chips">
            {(QUICK_PRESETS[category] || []).map((preset, idx) => (
              <button
                key={idx}
                type="button"
                className="ct-preset-chip"
                onClick={() => applyPreset(preset)}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Form Inputs */}
        <form onSubmit={handleSubmit} className="ct-activity-form mt-4">
          <div className="ct-form-grid">
            <Select
              label="Activity Type"
              value={activityType}
              onChange={(e) => {
                setActivityType(e.target.value);
                const match = categoryFactors.find((f) => f.activityType === e.target.value);
                if (match) setUnit(match.unit);
              }}
              required
            >
              {categoryFactors.map((f) => (
                <option key={f.activityType} value={f.activityType}>
                  {pretty(f.activityType)} ({f.kgCo2ePerUnit} kg CO₂e / {f.unit})
                </option>
              ))}
            </Select>

            <Input
              label={`Quantity (${unit || selectedFactor?.unit || "units"})`}
              type="number"
              min="0.0001"
              step="any"
              placeholder={`Enter amount in ${unit || selectedFactor?.unit || ""}`}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
            />

            <Input
              label="Activity Date"
              type="date"
              max={todayLocal()}
              value={logDate}
              onChange={(e) => setLogDate(e.target.value)}
              required
            />

            {/* Dynamic Category Specific Inputs */}
            {category === "transport" && activityType === "flight_travel" && (
              <Input
                label="Flight Distance (km)"
                type="number"
                min="1"
                step="any"
                placeholder="Flight distance in km"
                value={flightDistanceKm || quantity}
                onChange={(e) => setFlightDistanceKm(e.target.value)}
                required
              />
            )}

            {category === "energy" && (
              <Input
                label="Energy Source"
                type="text"
                placeholder="e.g. Grid electricity, Solar backup"
                value={energySource}
                onChange={(e) => setEnergySource(e.target.value)}
                required
              />
            )}

            {category === "food" && (
              <>
                <Input
                  label="Meal Type"
                  type="text"
                  placeholder="e.g. Lunch, Dinner, Breakfast"
                  value={mealType}
                  onChange={(e) => setMealType(e.target.value)}
                  required
                />
                <Input
                  label="Servings"
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={servings}
                  onChange={(e) => setServings(e.target.value)}
                  required
                />
              </>
            )}

            {category === "shopping" && (
              <>
                <Input
                  label="Product Category"
                  type="text"
                  placeholder="e.g. Clothing, Electronics"
                  value={productCategory}
                  onChange={(e) => setProductCategory(e.target.value)}
                  required
                />
                <Input
                  label="Spend Amount"
                  type="number"
                  min="0"
                  step="any"
                  value={spendAmount}
                  onChange={(e) => setSpendAmount(e.target.value)}
                  required
                />
              </>
            )}
          </div>

          {/* Emission Factor & Live Preview Banner */}
          {factorsLoading && <p className="text-xs text-muted">Loading verified emission factors…</p>}
          {!factorsLoading && !selectedFactor && <div className="ct-form-alert is-error">No backend emission factor is available for this category.</div>}
          <div className="ct-live-preview-card">
            <div className="ct-preview-left">
              <span className="ct-preview-icon">
                <Leaf size={22} />
              </span>
              <div>
                <b className="text-sm text-dark">Live Calculated Impact</b>
                <p className="text-xs text-muted m-0">
                  Factor: {selectedFactor?.kgCo2ePerUnit || 0} kg CO₂e / {selectedFactor?.unit || "unit"} · Source: Verified Development & CEA Matrix
                </p>
              </div>
            </div>
            <div className="ct-preview-right">
              <span className="ct-preview-val">{liveCo2e}</span>
              <span className="ct-preview-unit">kg CO₂e</span>
            </div>
          </div>

          {/* Feedback messages */}
          {error && (
            <div className="ct-form-alert is-error">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="ct-form-alert is-success">
              <CheckCircle2 size={16} />
              <span>{success}</span>
            </div>
          )}

          {/* Submit Button */}
          <div className="ct-form-actions">
            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={submitting}
              disabled={factorsLoading || !selectedFactor}
              icon={CheckCircle2}
            >
              Record Activity
            </Button>
          </div>
        </form>
      </Card>

      {/* Activity History Table */}
      <Card
        title="Recorded Activity History"
        subtitle="Chronological log of lifestyle activities saved to your account"
        icon={Clock}
      >
        <DataTable
          columns={columns}
          data={activities}
          loading={activitiesLoading}
          emptyMessage="No activities recorded yet. Complete the form above to add your first entry."
        />
      </Card>
    </div>
  );
}
