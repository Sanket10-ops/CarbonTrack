import React, { useEffect, useMemo, useState } from "react";
import { api, clearToken, getToken, setToken } from "./api.js";

const NAV = [
  ["overview", "Overview", "▦", "WORKSPACE"],
  ["activity", "Activity log", "⌁", "WORKSPACE"],
  ["goals", "My goals", "◎", "WORKSPACE"],
  ["recommendations", "Recommendations", "✳", "INSIGHTS"],
  ["achievements", "Achievements", "◇", "INSIGHTS"],
  ["community", "Community", "◉", "INSIGHTS"],
  ["preferences", "Preferences", "⚙", "ACCOUNT"]
];
const TYPES = {
  transport: [["car_travel", "Car travel", "km"], ["motorcycle_travel", "Motorcycle", "km"], ["bus_travel", "Bus travel", "passenger-km"], ["train_travel", "Train travel", "passenger-km"], ["flight_travel", "Flight travel", "passenger-km"]],
  electricity: [["grid_electricity", "Grid electricity", "kWh"]],
  food: [["beef", "Beef", "kg"], ["chicken", "Chicken", "kg"], ["plant_based_food", "Plant-based food", "kg"]],
  shopping: [["clothing", "Clothing", "kg"], ["electronics", "Electronics", "item"], ["paper", "Paper", "kg"], ["plastic", "Plastic", "kg"]]
};
const CATEGORIES = {
  transport: { label: "Transport", color: "#4d8a70", symbol: "↗" },
  electricity: { label: "Electricity", color: "#c99e42", symbol: "ϟ" },
  food: { label: "Food", color: "#d17d5e", symbol: "⌂" },
  shopping: { label: "Shopping", color: "#777eb0", symbol: "◇" }
};
const today = () => { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); };
const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); };
const kg = (v, digits = 2) => Number(v ?? 0).toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits });
const dateLabel = (v, opts = { day: "numeric", month: "short", year: "numeric" }) => {
  if (!v) return "—";
  const d = new Date(v.length === 10 ? v + "T12:00:00" : v);
  return Number.isNaN(d.getTime()) ? v : d.toLocaleDateString(undefined, opts);
};
const words = (v = "") => v.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
const currentUserFromToken = (token) => {
  try { return JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))).sub || ""; }
  catch { return ""; }
};

function Mark() { return <div className="brand"><span className="brand-mark">c</span><span className="brand-name">carbon<span>track</span><small>LIVE LIGHTER</small></span></div>; }
function Button({ children, kind = "primary", ...props }) { return <button className={"btn btn-" + kind} {...props}>{children}</button>; }
function Field({ label, children, hint }) { return <label className="field"><span>{label}</span>{children}{hint && <small>{hint}</small>}</label>; }
function Empty({ title, text, action }) { return <div className="empty"><span className="empty-leaf">c</span><strong>{title}</strong><p>{text}</p>{action}</div>; }
function Tag({ children }) { return <span className="tag">{children}</span>; }
function PageHeading({ kicker, title, subtitle, action }) {
  return <div className="page-heading"><div><span className="kicker">{kicker}</span><h1>{title}</h1><p>{subtitle}</p></div>{action}</div>;
}
function Auth({ onLogin, onRegister, busy, error }) {
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  async function submit(e) {
    e.preventDefault();
    if (mode === "login") await onLogin(username, password);
    else await onRegister(username, email, password);
  }
  return <div className="auth-shell">
    <section className="auth-art"><Mark /><div className="auth-message"><span className="kicker">A SMALLER FOOTPRINT STARTS HERE</span><h1>Make better choices.<br /><i>Measure the change.</i></h1><p>Understand your everyday impact, set meaningful goals and build habits that last.</p><ul><li>Track the impact of daily decisions</li><li>Set goals and see progress over time</li><li>Keep your sustainability data in your hands</li></ul></div><small className="auth-foot">CARBONTRACK · PERSONAL SUSTAINABILITY</small></section>
    <section className="auth-panel"><div className="auth-mobile-mark"><Mark /></div><div className="auth-card"><span className="kicker">WELCOME TO CARBONTRACK</span><h2>{mode === "login" ? "Good to see you." : "Create your account."}</h2><p>{mode === "login" ? "Sign in to continue your sustainability journey." : "Start recording your impact and set your first goal."}</p>
      <div className="auth-switch"><button className={mode === "login" ? "selected" : ""} onClick={() => setMode("login")}>Sign in</button><button className={mode === "register" ? "selected" : ""} onClick={() => setMode("register")}>Create account</button></div>
      <form onSubmit={submit} className="stack-form">
        <Field label="Username"><input required minLength={3} autoComplete="username" placeholder="Your username" value={username} onChange={(e) => setUsername(e.target.value)} /></Field>
        {mode === "register" && <Field label="Email address"><input required type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>}
        <Field label="Password"><input required type="password" maxLength={72} minLength={mode === "register" ? 8 : undefined} autoComplete={mode === "login" ? "current-password" : "new-password"} placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} /></Field>
        {error && <div className="alert alert-error">{error}</div>}
        <Button type="submit" disabled={busy}>{busy ? "Please wait…" : mode === "login" ? "Sign in →" : "Create account →"}</Button>
      </form><small className="auth-security">▣ Your account is protected with secure sign-in.</small>
    </div><small className="auth-terms">By continuing, you agree to use CarbonTrack responsibly.</small></section>
  </div>;
}
function Metric({ label, value, unit, detail, tone }) {
  return <article className="metric"><span className={"metric-mark " + tone}>{tone === "green" ? "↗" : tone === "amber" ? "ϟ" : tone === "blue" ? "⌁" : "◇"}</span><span className="metric-label">{label}</span><strong>{value}<small>{unit}</small></strong><span className="metric-detail">{detail}</span></article>;
}
function ActivityTable({ rows = [], compact = false, onAll }) {
  if (!rows.length) return <Empty title="No activities recorded" text="Your activity history will appear here after you log your first entry." />;
  return <div className="table-scroll"><table><thead><tr><th>Activity</th><th>Category</th><th>Date</th><th>Quantity</th><th>Emissions</th></tr></thead><tbody>{rows.map((a) => {
    const cat = CATEGORIES[a.category] || { label: words(a.category), color: "#84948a", symbol: "•" };
    return <tr key={a.id}><td><div className="activity-cell"><span style={{ color: cat.color, background: cat.color + "18" }}>{cat.symbol}</span><div><b>{words(a.activityType)}</b><small>Entry #{a.id}</small></div></div></td><td><span className="category-dot" style={{ "--dot": cat.color }}>{cat.label}</span></td><td>{dateLabel(a.logDate)}</td><td>{kg(a.quantity)} <small>{a.unit}</small></td><td><b className="emissions-number">{kg(a.co2eKg, 3)} kg</b></td></tr>;
  })}</tbody></table>{compact && onAll && <button className="link-btn table-link" onClick={onAll}>View all activities →</button>}</div>;
}
function TrendChart({ points = [] }) {
  const list = points.slice(-12);
  if (!list.length) return <div className="chart-empty">No recorded emissions in this date range.<small>Log an activity to start building your trend.</small></div>;
  const max = Math.max(1, ...list.map((p) => Number(p.totalEmissionsKg || 0)));
  const W = 620, H = 220, L = 42, R = 14, T = 12, B = 32, innerW = W - L - R, innerH = H - T - B;
  const coords = list.map((p, i) => ({ x: list.length === 1 ? W / 2 : L + i * innerW / (list.length - 1), y: T + innerH - Number(p.totalEmissionsKg || 0) / max * innerH, p }));
  const path = coords.map((p, i) => (i ? "L" : "M") + " " + p.x + " " + p.y).join(" ");
  const fill = path + " L " + coords[coords.length - 1].x + " " + (T + innerH) + " L " + coords[0].x + " " + (T + innerH) + " Z";
  return <svg className="trend-svg" viewBox={"0 0 " + W + " " + H} role="img" aria-label="Emissions trend">
    {[0, 1, 2, 3].map((n) => <g key={n}><line className="chart-grid" x1={L} x2={W - R} y1={T + n * innerH / 3} y2={T + n * innerH / 3} /><text className="chart-axis" x="0" y={T + n * innerH / 3 + 4}>{kg(max * (1 - n / 3), 1)}</text></g>)}
    <path className="chart-fill" d={fill} /><path className="chart-path" d={path} />
    {coords.map((p) => <g key={p.p.periodStart}><circle className="chart-dot" cx={p.x} cy={p.y} r="4" /><text className="chart-date" x={p.x} y={H - 7} textAnchor="middle">{dateLabel(p.p.periodStart, { day: "numeric", month: "short" })}</text></g>)}
  </svg>;
}
function CategoryChart({ rows = [] }) {
  const list = rows.filter((r) => Number(r.totalEmissionsKg || 0) > 0);
  const total = list.reduce((sum, r) => sum + Number(r.totalEmissionsKg), 0);
  const colors = ["#4d8a70", "#c99e42", "#d17d5e", "#777eb0"];
  let current = 0;
  const gradient = total ? list.map((r, i) => {
    const n = Number(r.totalEmissionsKg) / total * 100;
    const part = colors[i % colors.length] + " " + current + "% " + (current + n) + "%";
    current += n;
    return part;
  }).join(", ") : "#e9eee9 0% 100%";
  return <div className="category-content"><div className="donut" style={{ background: "conic-gradient(" + gradient + ")" }}><div><b>{kg(total, 1)}</b><small>kg CO₂e</small></div></div>
    {list.length ? <div className="legend">{list.map((r, i) => <div key={r.category}><span style={{ background: colors[i % colors.length] }} />{words(r.category)}<b>{(Number(r.totalEmissionsKg) / total * 100).toFixed(0)}%</b></div>)}</div> : <p className="muted-small">Your category mix will appear after your first activity.</p>}</div>;
}
function GoalCard({ goal }) {
  const p = goal.progress;
  const reduction = Number(p?.reductionPct || 0);
  const target = Number(goal.targetReductionPct || 0);
  const width = target ? Math.max(0, Math.min(100, reduction / target * 100)) : 0;
  const status = p?.status || goal.status;
  return <article className="surface goal-card"><div className="goal-head"><div><span className="kicker">GOAL #{goal.id}</span><h3>{target}% reduction target</h3></div><Tag>{words(status)}</Tag></div>
    <div className="goal-progress"><b>{kg(reduction, 1)}%</b><span>reduction achieved</span><small>Target {target}%</small></div><div className="progress-track"><i style={{ width: width + "%" }} /></div>
    <div className="goal-stats"><div><span>Baseline</span><b>{kg(p?.baselineEmissionsKg)} kg</b></div><div><span>Current</span><b>{kg(p?.currentEmissionsKg)} kg</b></div><div><span>Duration</span><b>{goal.periodDays} days</b></div></div>
    <div className="goal-dates">{dateLabel(goal.startDate)} — {dateLabel(p?.endDate)}</div>{goal.progressError && <small className="text-error">{goal.progressError}</small>}
  </article>;
}

function App() {
  const token = getToken();
  const [authenticated, setAuthenticated] = useState(Boolean(token));
  const [username, setUsername] = useState(token ? currentUserFromToken(token) : "");
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState("");
  const [page, setPage] = useState("overview");
  const [period, setPeriod] = useState("daily");
  const [startDate, setStartDate] = useState(daysAgo(29));
  const [endDate, setEndDate] = useState(today());
  const [analytics, setAnalytics] = useState(null);
  const [activities, setActivities] = useState([]);
  const [goals, setGoals] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [badges, setBadges] = useState([]);
  const [profile, setProfile] = useState(null);
  const [benchmark, setBenchmark] = useState(null);
  const [loading, setLoading] = useState(false);
  const [benchmarkBusy, setBenchmarkBusy] = useState(false);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  const [notice, setNotice] = useState("");
  const [warnings, setWarnings] = useState([]);
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [activityForm, setActivityForm] = useState({ category: "transport", activityType: "car_travel", quantity: "8", logDate: today(), energySource: "grid", mealType: "lunch", servings: "1", productCategory: "clothing", spendAmount: "", spendCurrency: "INR", flightDistanceKm: "" });
  const [goalForm, setGoalForm] = useState({ targetReductionPct: "20", periodDays: "30", startDate: today() });
  const [profileForm, setProfileForm] = useState({ preferredTransport: "", dietPreference: "", sustainabilityGoal: "", preferredUnits: "metric", goalVisibility: false });

  useEffect(() => {
    const unauthorized = () => { setAuthenticated(false); setUsername(""); setAuthError("Your session expired. Please sign in again."); };
    window.addEventListener("carbontrack:unauthorized", unauthorized);
    return () => window.removeEventListener("carbontrack:unauthorized", unauthorized);
  }, []);
  useEffect(() => {
    if (!notice) return undefined;
    const timer = window.setTimeout(() => setNotice(""), 3500);
    return () => window.clearTimeout(timer);
  }, [notice]);

  async function refreshData() {
    const labels = ["activities", "analytics", "goals", "recommendations", "badges", "profile"];
    const results = await Promise.allSettled([api.activities(), api.analytics(period, startDate, endDate), api.goals(), api.recommendations(), api.badges(), api.profile()]);
    const failed = [];
    results.forEach((r, i) => { if (r.status === "rejected") failed.push(labels[i] + ": " + (r.reason?.message || "Could not load")); });
    if (results[0].status === "fulfilled") setActivities(Array.isArray(results[0].value) ? results[0].value : []);
    if (results[1].status === "fulfilled") setAnalytics(results[1].value);
    if (results[2].status === "fulfilled") {
      const list = Array.isArray(results[2].value) ? results[2].value : [];
      setGoals(await Promise.all(list.map(async (g) => { try { return { ...g, progress: await api.goalProgress(g.id) }; } catch (e) { return { ...g, progressError: e.message }; } })));
    }
    if (results[3].status === "fulfilled") setRecommendations(results[3].value);
    if (results[4].status === "fulfilled") setBadges(results[4].value);
    if (results[5].status === "fulfilled") {
      const p = results[5].value; setProfile(p); setUsername(p.username || username);
      setProfileForm({ preferredTransport: p.preferredTransport || "", dietPreference: p.dietPreference || "", sustainabilityGoal: p.sustainabilityGoal || "", preferredUnits: p.preferredUnits || "metric", goalVisibility: Boolean(p.goalVisibility) });
    }
    setWarnings(failed);
  }
  useEffect(() => {
    if (!authenticated) return undefined;
    let alive = true;
    setLoading(true);
    refreshData().finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [authenticated, period, startDate, endDate]);

  async function login(user, password) {
    setAuthBusy(true); setAuthError("");
    try {
      const result = await api.login(user.trim(), password);
      if (!result?.accessToken) throw new Error("The API response did not include an access token.");
      setToken(result.accessToken); setUsername(user.trim()); setAuthenticated(true); setPage("overview"); setNotice("You are signed in.");
    } catch (e) { setAuthError(e.message); }
    finally { setAuthBusy(false); }
  }
  async function register(user, email, password) {
    setAuthBusy(true); setAuthError("");
    try { await api.register(user.trim(), email.trim(), password); await login(user, password); }
    catch (e) { setAuthError(e.message); }
    finally { setAuthBusy(false); }
  }
  function signOut() {
    clearToken(); setAuthenticated(false); setUsername(""); setAnalytics(null); setActivities([]); setGoals([]); setRecommendations([]); setBadges([]); setProfile(null); setBenchmark(null); setPage("overview");
  }
  function go(id) { setPage(id); setMobileNav(false); setActionError(""); }

  async function submitActivity(e) {
    e.preventDefault(); setBusy(true); setActionError("");
    const type = TYPES[activityForm.category].find((t) => t[0] === activityForm.activityType);
    const flight = activityForm.activityType === "flight_travel";
    const payload = { category: activityForm.category, activityType: activityForm.activityType, quantity: Number(flight ? activityForm.flightDistanceKm : activityForm.quantity), unit: type[2], logDate: activityForm.logDate };
    if (activityForm.category === "electricity") payload.energySource = activityForm.energySource;
    if (activityForm.category === "food") { payload.mealType = activityForm.mealType; payload.servings = Number(activityForm.servings); }
    if (activityForm.category === "shopping") { payload.productCategory = activityForm.productCategory; payload.spendAmount = Number(activityForm.spendAmount); payload.spendCurrency = activityForm.spendCurrency; }
    if (flight) payload.flightDistanceKm = Number(activityForm.flightDistanceKm);
    try {
      await api.createActivity(payload); setNotice("Activity saved and emissions calculated."); setShowActivityForm(false);
      setActivityForm({ category: "transport", activityType: "car_travel", quantity: "8", logDate: today(), energySource: "grid", mealType: "lunch", servings: "1", productCategory: "clothing", spendAmount: "", spendCurrency: "INR", flightDistanceKm: "" });
      await refreshData();
    } catch (err) { setActionError(err.message); }
    finally { setBusy(false); }
  }
  async function submitGoal(e) {
    e.preventDefault(); setBusy(true); setActionError("");
    try { await api.createGoal({ targetReductionPct: Number(goalForm.targetReductionPct), periodDays: Number(goalForm.periodDays), startDate: goalForm.startDate || null }); setNotice("Your reduction goal has been created."); await refreshData(); }
    catch (err) { setActionError(err.message); } finally { setBusy(false); }
  }
  async function submitProfile(e) {
    e.preventDefault(); setBusy(true); setActionError("");
    try {
      const p = await api.updateProfile({ preferredTransport: profileForm.preferredTransport || null, dietPreference: profileForm.dietPreference || null, sustainabilityGoal: profileForm.sustainabilityGoal || null, preferredUnits: profileForm.preferredUnits, goalVisibility: profileForm.goalVisibility });
      setProfile(p); setNotice("Preferences saved.");
    } catch (err) { setActionError(err.message); } finally { setBusy(false); }
  }
  async function compare(e) {
    e.preventDefault(); setBenchmarkBusy(true); setActionError("");
    try { setBenchmark(await api.benchmark(startDate, endDate)); } catch (err) { setActionError(err.message); } finally { setBenchmarkBusy(false); }
  }

  const activeGoals = goals.filter((g) => (g.progress?.status || g.status) === "IN_PROGRESS").length;
  const pageLabel = NAV.find((n) => n[0] === page)?.[1] || "Overview";
  const greeting = useMemo(() => new Date().getHours() < 12 ? "Good morning" : new Date().getHours() < 17 ? "Good afternoon" : "Good evening", []);
  const firstName = (username || "there").split(/[._-]/)[0];
  if (!authenticated) return <Auth onLogin={login} onRegister={register} busy={authBusy} error={authError} />;

  return <div className="app-shell">
    {mobileNav && <button className="mobile-scrim" onClick={() => setMobileNav(false)} aria-label="Close navigation" />}
    <aside className={"sidebar " + (mobileNav ? "sidebar-open" : "")}>
      <div className="sidebar-brand"><Mark /><button className="mobile-close" onClick={() => setMobileNav(false)}>×</button></div>
      <div className="workspace-switch"><span className="workspace-mark">C</span><div><b>Personal space</b><small>Individual account</small></div><span>⌄</span></div>
      {["WORKSPACE", "INSIGHTS", "ACCOUNT"].map((group) => <div className="nav-group" key={group}><span className="nav-kicker">{group}</span>{NAV.filter((n) => n[3] === group).map((n) => <button key={n[0]} className={"nav-item " + (page === n[0] ? "active" : "")} onClick={() => go(n[0])}><span className="nav-icon">{n[2]}</span>{n[1]}{n[0] === "goals" && activeGoals > 0 && <small>{activeGoals}</small>}</button>)}</div>)}
      <div className="sidebar-bottom"><div className="sidebar-note"><span>✳</span><b>Progress over perfection.</b><p>Small, consistent changes make a measurable difference.</p></div><div className="user-row"><span className="avatar">{(username || "C")[0].toUpperCase()}</span><div><b>{username}</b><small>Personal account</small></div><button title="Sign out" onClick={signOut}>↗</button></div></div>
    </aside>
    <main className="main-area">
      <header className="topbar"><div className="topbar-left"><button className="hamburger" onClick={() => setMobileNav(true)}>☰</button><span>Workspace <i>›</i> <b>{pageLabel}</b></span></div><div className="topbar-right"><span>◷ {dateLabel(today(), { weekday: "short", day: "numeric", month: "short" })}</span><span className="topbar-divider" /><span className="top-avatar">{(username || "C")[0].toUpperCase()}</span><b>{username}</b></div></header>
      <div className="page-content">
        {warnings.length > 0 && <div className="alert alert-warning"><b>Some sections could not load.</b> {warnings.join(" · ")} <button onClick={refreshData}>Retry</button></div>}
        {actionError && <div className="alert alert-error">{actionError}<button onClick={() => setActionError("")}>×</button></div>}

        {page === "overview" && <>
          <PageHeading kicker="YOUR IMPACT, IN FOCUS" title={greeting + ", " + firstName + "."} subtitle="A clear view of your footprint and the progress you're making." action={<Button onClick={() => { go("activity"); setShowActivityForm(true); }}>＋ Log activity</Button>} />
          <div className="metric-grid">
            <Metric label="Emissions in range" value={kg(analytics?.totalEmissionsKg)} unit="kg CO₂e" detail={dateLabel(startDate, { day: "numeric", month: "short" }) + " – " + dateLabel(endDate, { day: "numeric", month: "short" })} tone="green" />
            <Metric label="Activities tracked" value={activities.length} unit="entries" detail="Across your activity log" tone="blue" />
            <Metric label="Goals in progress" value={activeGoals} unit="active" detail={goals.length + " total goals"} tone="amber" />
            <Metric label="Badges earned" value={badges.length} unit="awards" detail="Milestones from your activity" tone="rose" />
          </div>
          <div className="overview-grid">
            <section className="surface trend-card"><div className="surface-title"><div><span className="kicker">EMISSIONS OVER TIME</span><h2>Your footprint trend</h2></div><select value={period} onChange={(e) => setPeriod(e.target.value)}><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option></select></div>
              <div className="date-filter"><label>From <input type="date" value={startDate} max={endDate} onChange={(e) => setStartDate(e.target.value)} /></label><label>To <input type="date" value={endDate} min={startDate} max={today()} onChange={(e) => setEndDate(e.target.value)} /></label><button onClick={refreshData} title="Refresh">↻</button></div>
              <TrendChart points={analytics?.timeline || []} />
            </section>
            <section className="surface category-card"><div className="surface-title"><div><span className="kicker">WHERE IT COMES FROM</span><h2>Category breakdown</h2></div></div><CategoryChart rows={analytics?.categoryTotals || []} /><p className="chart-foot">Based on recorded emissions in the selected date range.</p></section>
          </div>
          <section className="surface recent-card"><div className="surface-title"><div><span className="kicker">YOUR LATEST RECORDS</span><h2>Recent activity</h2></div><button className="link-btn" onClick={() => go("activity")}>View activity log →</button></div><ActivityTable rows={activities.slice(0, 5)} compact onAll={() => go("activity")} /></section>
          {loading && <div className="loading"><span /> Refreshing your data…</div>}
        </>}

        {page === "activity" && <>
          <PageHeading kicker="BUILD A CLEARER PICTURE" title="Activity log" subtitle="Record everyday choices. CarbonTrack calculates the associated CO₂e using your configured emission factors." action={<Button onClick={() => setShowActivityForm((v) => !v)}>＋ Add activity</Button>} />
          {showActivityForm && <section className="surface form-card"><div className="surface-title"><div><span className="kicker">NEW ENTRY</span><h2>Log an activity</h2></div><button className="close-form" onClick={() => setShowActivityForm(false)}>×</button></div>
            <form className="form-grid" onSubmit={submitActivity}>
              <Field label="Category"><select value={activityForm.category} onChange={(e) => { const category = e.target.value; setActivityForm((v) => ({ ...v, category, activityType: TYPES[category][0][0] })); }}><option value="transport">Transport</option><option value="electricity">Electricity</option><option value="food">Food</option><option value="shopping">Shopping</option></select></Field>
              <Field label="Activity"><select value={activityForm.activityType} onChange={(e) => setActivityForm((v) => ({ ...v, activityType: e.target.value }))}>{TYPES[activityForm.category].map((t) => <option key={t[0]} value={t[0]}>{t[1]}</option>)}</select></Field>
              {activityForm.activityType === "flight_travel" ? <Field label="Flight distance (km)"><input type="number" min="0.01" step="0.01" required value={activityForm.flightDistanceKm} onChange={(e) => setActivityForm((v) => ({ ...v, flightDistanceKm: e.target.value }))} /></Field> : <Field label="Quantity"><input type="number" min="0" step="0.01" required value={activityForm.quantity} onChange={(e) => setActivityForm((v) => ({ ...v, quantity: e.target.value }))} /></Field>}
              <Field label="Unit"><input readOnly value={TYPES[activityForm.category].find((t) => t[0] === activityForm.activityType)?.[2] || ""} /></Field>
              <Field label="Activity date"><input type="date" max={today()} required value={activityForm.logDate} onChange={(e) => setActivityForm((v) => ({ ...v, logDate: e.target.value }))} /></Field>
              {activityForm.category === "electricity" && <Field label="Energy source"><input readOnly value="Grid electricity (configured emission factor)" /></Field>}
              {activityForm.category === "food" && <><Field label="Meal"><select value={activityForm.mealType} onChange={(e) => setActivityForm((v) => ({ ...v, mealType: e.target.value }))}><option value="breakfast">Breakfast</option><option value="lunch">Lunch</option><option value="dinner">Dinner</option><option value="snack">Snack</option></select></Field><Field label="Servings"><input type="number" min="0.01" step="0.01" required value={activityForm.servings} onChange={(e) => setActivityForm((v) => ({ ...v, servings: e.target.value }))} /></Field></>}
              {activityForm.category === "shopping" && <><Field label="Product category"><select value={activityForm.productCategory} onChange={(e) => setActivityForm((v) => ({ ...v, productCategory: e.target.value }))}><option value="clothing">Clothing</option><option value="electronics">Electronics</option><option value="paper">Paper</option><option value="plastic">Plastic</option></select></Field><Field label="Spend amount"><input type="number" min="0" step="0.01" required value={activityForm.spendAmount} onChange={(e) => setActivityForm((v) => ({ ...v, spendAmount: e.target.value }))} /></Field><Field label="Currency"><select value={activityForm.spendCurrency} onChange={(e) => setActivityForm((v) => ({ ...v, spendCurrency: e.target.value }))}><option value="INR">INR</option><option value="USD">USD</option><option value="EUR">EUR</option><option value="GBP">GBP</option></select></Field></>}
              <div className="form-actions"><Button type="button" kind="quiet" onClick={() => setShowActivityForm(false)}>Cancel</Button><Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save activity →"}</Button></div>
            </form>
          </section>}
          <section className="surface table-card"><div className="surface-title"><div><span className="kicker">ALL RECORDS</span><h2>Recorded activities <small className="count">{activities.length}</small></h2></div></div><ActivityTable rows={activities} /></section>
        </>}

        {page === "goals" && <>
          <PageHeading kicker="TURN INTENT INTO ACTION" title="Your goals" subtitle="Set a reduction target and follow your emissions against a comparable baseline." />
          <div className="goal-layout"><section className="surface goal-create"><div className="surface-title"><div><span className="kicker">NEW COMMITMENT</span><h2>Create a reduction goal</h2></div><span className="large-soft-icon">◎</span></div>
            <form className="stack-form" onSubmit={submitGoal}>
              <Field label="Target reduction" hint="Choose a target between 1% and 100%."><div className="input-suffix"><input type="number" min="1" max="100" step="1" required value={goalForm.targetReductionPct} onChange={(e) => setGoalForm((v) => ({ ...v, targetReductionPct: e.target.value }))} /><b>%</b></div></Field>
              <Field label="Goal duration"><select value={goalForm.periodDays} onChange={(e) => setGoalForm((v) => ({ ...v, periodDays: e.target.value }))}><option value="7">7 days</option><option value="14">14 days</option><option value="30">30 days</option><option value="60">60 days</option><option value="90">90 days</option><option value="180">180 days</option><option value="365">365 days</option></select></Field>
              <Field label="Start date"><input type="date" max={today()} value={goalForm.startDate} onChange={(e) => setGoalForm((v) => ({ ...v, startDate: e.target.value }))} /></Field>
              <div className="goal-note">ⓘ Progress compares your activity during the goal period with the same-length period immediately before it.</div>
              <Button type="submit" disabled={busy}>{busy ? "Creating…" : "Create goal →"}</Button>
            </form></section>
            <section><div className="section-subhead"><div><span className="kicker">YOUR COMMITMENTS</span><h2>Goal progress <small className="count">{goals.length}</small></h2></div></div>
              {goals.length ? <div className="goal-list">{goals.map((g) => <GoalCard key={g.id} goal={g} />)}</div> : <section className="surface"><Empty title="No goals yet" text="Create your first reduction goal to start measuring progress." /></section>}
            </section>
          </div>
        </>}

        {page === "recommendations" && <>
          <PageHeading kicker="PRACTICAL NEXT STEPS" title="Recommendations" subtitle="Suggestions based on categories contributing most to your recorded emissions over the last 30 days." action={<Button kind="secondary" onClick={refreshData}>↻ Refresh</Button>} />
          {recommendations.length ? <div className="recommendation-grid">{recommendations.map((r, i) => <article className="surface recommendation" key={r.category}><div className="recommendation-top"><span>0{i + 1}</span><Tag>{words(r.category)}</Tag></div><div className="recommendation-icon">{CATEGORIES[r.category]?.symbol || "✳"}</div><h2>{r.title}</h2><p>{r.action}</p><div className="recommendation-reason">ⓘ {r.reason}</div></article>)}</div> : <section className="surface"><Empty title="Recommendations will appear here" text="Log activities in transport, electricity, food or shopping. CarbonTrack will use those records to suggest practical changes." action={<Button onClick={() => { go("activity"); setShowActivityForm(true); }}>＋ Log activity</Button>} /></section>}
        </>}

        {page === "achievements" && <>
          <PageHeading kicker="RECOGNISING YOUR MOMENTUM" title="Achievements" subtitle="Badges are awarded when your activity history reaches a milestone." />
          <div className="surface achievement-summary"><div className="achievement-symbol">◇</div><div><span className="kicker">YOUR COLLECTION</span><h2>{badges.length} <small>of 3 badges earned</small></h2><p>Keep recording activities to unlock more milestones.</p></div><div className="achievement-meter"><div className="progress-track"><i style={{ width: Math.min(100, badges.length / 3 * 100) + "%" }} /></div><small>{Math.round(Math.min(100, badges.length / 3 * 100))}% completed</small></div></div>
          <div className="badge-grid">{[["First Steps", "Log your first activity", "c"], ["Consistent Tracker", "Log ten activities", "⌁"], ["Carbon Cutter", "Record 10 kg CO₂e or more", "↗"]].map(([name, description, symbol]) => { const b = badges.find((x) => x.name === name); return <article className={"surface badge-card " + (b ? "earned" : "")} key={name}><span className="badge-art">{symbol}</span><div><span className="kicker">{b ? "UNLOCKED" : "MILESTONE"}</span><h3>{name}</h3><p>{description}</p>{b && <small>Earned {dateLabel(b.awardedAt)}</small>}</div><Tag>{b ? "✓ Earned" : "Not yet"}</Tag></article>; })}</div>
        </>}

        {page === "community" && <>
          <PageHeading kicker="A SHARED VIEW OF PROGRESS" title="Community benchmark" subtitle="Compare your recorded emissions with the average among users who opted in to this comparison." />
          <div className="community-grid"><section className="surface benchmark-card"><div className="surface-title"><div><span className="kicker">DATE-RANGE COMPARISON</span><h2>Your benchmark</h2></div><span className="large-soft-icon">◉</span></div>
            <form className="benchmark-form" onSubmit={compare}><Field label="From"><input type="date" value={startDate} max={endDate} onChange={(e) => setStartDate(e.target.value)} required /></Field><Field label="To"><input type="date" value={endDate} min={startDate} max={today()} onChange={(e) => setEndDate(e.target.value)} required /></Field><Button type="submit" disabled={benchmarkBusy}>{benchmarkBusy ? "Comparing…" : "Compare →"}</Button></form>
            {benchmark ? <><div className="benchmark-numbers"><div><span>Your emissions</span><b>{kg(benchmark.yourEmissionsKg)} <small>kg CO₂e</small></b></div><div><span>Community average</span><b>{kg(benchmark.communityAverageKg)} <small>kg CO₂e</small></b></div></div><div className="comparison-result"><b>{words(benchmark.comparison)}</b><span>{benchmark.participantCount} opted-in participants included.</span></div></> : <div className="benchmark-placeholder"><span>↗</span><b>Choose a date range to compare</b><p>The comparison uses only people who enabled benchmark visibility in their preferences.</p></div>}
          </section><aside className="surface privacy-card"><span className="privacy-lock">▣</span><span className="kicker">YOUR DATA, YOUR CHOICE</span><h2>Participation is optional</h2><p>Only aggregate emissions contribute to the community average when you enable benchmark visibility. Your activity details are not shown to other users.</p><div className="privacy-state"><i className={profile?.goalVisibility ? "on" : ""} />{profile?.goalVisibility ? "Benchmark sharing is enabled" : "Benchmark sharing is disabled"}</div><Button kind="secondary" onClick={() => go("preferences")}>Manage privacy settings →</Button></aside></div>
          {benchmark && benchmark.participantCount === 0 && <div className="alert alert-warning">No opted-in participants were found for this range. Enable visibility in Preferences and invite others to opt in.</div>}
        </>}

        {page === "preferences" && <>
          <PageHeading kicker="MAKE CARBONTRACK YOURS" title="Preferences" subtitle="Set your sustainability preferences and control whether your totals contribute to community benchmarking." />
          <form className="surface preferences-card" onSubmit={submitProfile}><div className="surface-title"><div><span className="kicker">PERSONAL SETTINGS</span><h2>Your sustainability profile</h2></div><span className="large-soft-icon">⚙</span></div>
            <div className="preferences-grid">
              <Field label="Preferred transport"><select value={profileForm.preferredTransport} onChange={(e) => setProfileForm((v) => ({ ...v, preferredTransport: e.target.value }))}><option value="">Not specified</option><option value="walking">Walking</option><option value="cycling">Cycling</option><option value="public_transport">Public transport</option><option value="car">Car</option><option value="motorcycle">Motorcycle</option><option value="train">Train</option></select></Field>
              <Field label="Diet preference"><select value={profileForm.dietPreference} onChange={(e) => setProfileForm((v) => ({ ...v, dietPreference: e.target.value }))}><option value="">Not specified</option><option value="omnivore">Omnivore</option><option value="vegetarian">Vegetarian</option><option value="vegan">Vegan</option><option value="pescatarian">Pescatarian</option></select></Field>
              <Field label="Sustainability focus"><select value={profileForm.sustainabilityGoal} onChange={(e) => setProfileForm((v) => ({ ...v, sustainabilityGoal: e.target.value }))}><option value="">Not specified</option><option value="reduce_transport_emissions">Reduce transport emissions</option><option value="reduce_energy_use">Reduce energy use</option><option value="eat_more_plant_based">Eat more plant-based meals</option><option value="shop_consciously">Shop more consciously</option><option value="overall_reduction">Overall footprint reduction</option></select></Field>
              <Field label="Preferred units"><select value={profileForm.preferredUnits} onChange={(e) => setProfileForm((v) => ({ ...v, preferredUnits: e.target.value }))}><option value="metric">Metric</option><option value="imperial">Imperial</option></select></Field>
            </div><div className="settings-divider" /><div className="privacy-setting"><div><b>Community benchmark visibility</b><p>Allow your aggregate emissions to contribute to the community average. Change this at any time.</p></div><label className="toggle"><input type="checkbox" checked={profileForm.goalVisibility} onChange={(e) => setProfileForm((v) => ({ ...v, goalVisibility: e.target.checked }))} /><span /></label></div>
            <div className="preferences-footer"><small>▣ Privacy sharing is disabled by default.</small><Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save preferences →"}</Button></div>
          </form>
          <section className="surface account-card"><span className="kicker">ACCOUNT DETAILS</span><h2>Account information</h2><div className="account-grid"><div><span>Username</span><b>{profile?.username || username}</b></div><div><span>Email</span><b>{profile?.email || "—"}</b></div><div><span>Account role</span><b>{profile?.role || "USER"}</b></div><div><span>Member since</span><b>{dateLabel(profile?.createdAt)}</b></div></div></section>
        </>}
        <footer className="page-footer"><b>CARBONTRACK</b><span>Measure what matters. Improve what you can.</span><button onClick={signOut}>Sign out ↗</button></footer>
      </div>
    </main>
    {notice && <div className="toast"><span>✓</span>{notice}<button onClick={() => setNotice("")}>×</button></div>}
  </div>;
}

export default App;
