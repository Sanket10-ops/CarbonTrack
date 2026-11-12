import React, { useEffect, useState } from "react";
import { api } from "../api.js";

const today = () => {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
};
const monthStart = () => {
  const date = new Date();
  date.setDate(1);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
};
const kg = (value) => Number(value ?? 0).toLocaleString(undefined, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});
const words = (value = "") => value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

export default function OrganisationPage({ profile, onProfileRefresh }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [from, setFrom] = useState(monthStart());
  const [to, setTo] = useState(today());
  const [dashboard, setDashboard] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const isAdmin = profile?.role === "ORG_ADMIN" && Boolean(profile?.organisationId);
  const hasOrganisation = Boolean(profile?.organisationId);

  async function loadDashboard() {
    if (!isAdmin) return;
    setBusy(true);
    setError("");
    try {
      setDashboard(await api.organisationDashboard(from, to));
    } catch (err) {
      setError(err.message || "Could not load organisation dashboard.");
      setDashboard(null);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    setDashboard(null);
    if (isAdmin) loadDashboard();
    // Loading is intentionally triggered when the selected organisation changes.
    // Date changes are applied through the explicit Load report action.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.organisationId, profile?.role]);

  async function createOrganisation(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await api.createOrganisation(name.trim());
      setName("");
      await onProfileRefresh();
      setNotice("Organisation created. You are now its administrator.");
    } catch (err) {
      setError(err.message || "Could not create the organisation.");
    } finally {
      setBusy(false);
    }
  }

  async function addMember(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await api.addOrganisationMember(email.trim());
      setEmail("");
      setNotice("Existing account added. Its data appears in reports only after that user opts in to organisation reporting.");
      await loadDashboard();
    } catch (err) {
      setError(err.message || "Could not add the member.");
    } finally {
      setBusy(false);
    }
  }

  async function downloadReport() {
    setBusy(true);
    setError("");
    try {
      const blob = await api.downloadOrganisationReport(from, to);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "carbontrack-organisation-report-" + from + "-to-" + to + ".csv";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      setNotice("CSR report downloaded.");
    } catch (err) {
      setError(err.message || "Could not export the report.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="m3-page">
      <div className="page-heading">
        <div>
          <span className="kicker">WORKSPACE / ORGANISATION</span>
          <h1>Organisation reporting</h1>
          <p>View consent-filtered employee emissions, organisation trends and export a CSR summary.</p>
        </div>
      </div>

      {!hasOrganisation && <section className="surface m3-panel">
        <div className="surface-title"><div><span className="kicker">GET STARTED</span><h2>Create an organisation</h2></div></div>
        <p className="m3-muted">Create an organisation space. Your account becomes its administrator. Employees must already have CarbonTrack accounts before you can add them.</p>
        <form className="m3-filter" onSubmit={createOrganisation}>
          <label className="field m3-grow"><span>Organisation name</span><input value={name} onChange={(event) => setName(event.target.value)} maxLength={255} required placeholder="Example: GreenTech Solutions" /></label>
          <button className="btn btn-primary" type="submit" disabled={busy || !name.trim()}>{busy ? "Creating…" : "Create organisation"}</button>
        </form>
      </section>}

      {hasOrganisation && !isAdmin && <section className="surface m3-panel">
        <div className="surface-title"><div><span className="kicker">ORGANISATION MEMBERSHIP</span><h2>{profile?.organisationName || "Your organisation"}</h2></div><span className="tag">Member</span></div>
        <p className="m3-muted">You are linked to this organisation. Organisation reports are available to its administrator and include your employee-level information only when you enable organisation reporting in Preferences.</p>
      </section>}

      {isAdmin && <>
        <section className="surface m3-panel">
          <div className="surface-title"><div><span className="kicker">MEMBERS</span><h2>{profile?.organisationName || "Your organisation"}</h2></div><span className="tag">Administrator</span></div>
          <p className="m3-muted">Add an existing CarbonTrack account by email. Adding an account does not enable reporting consent; each member controls that setting in their own Preferences.</p>
          <form className="m3-filter" onSubmit={addMember}>
            <label className="field m3-grow"><span>Employee account email</span><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required placeholder="employee@example.com" /></label>
            <button className="btn btn-secondary" type="submit" disabled={busy}>Add member</button>
          </form>
        </section>

        <section className="surface m3-panel">
          <div className="surface-title"><div><span className="kicker">REPORTING PERIOD</span><h2>Organisation footprint</h2></div></div>
          <div className="m3-filter">
            <label className="field"><span>From</span><input type="date" value={from} max={to} onChange={(event) => setFrom(event.target.value)} /></label>
            <label className="field"><span>To</span><input type="date" value={to} min={from} max={today()} onChange={(event) => setTo(event.target.value)} /></label>
            <button className="btn btn-primary" type="button" disabled={busy} onClick={loadDashboard}>{busy ? "Loading…" : "Load report"}</button>
            <button className="btn btn-secondary" type="button" disabled={busy || !dashboard} onClick={downloadReport}>Export CSR CSV</button>
          </div>
          <p className="m3-footnote">Only members who explicitly enabled organisation reporting are counted. Members who opted out are excluded from both aggregate and employee-level figures.</p>
        </section>

        {dashboard && <>
          <div className="m3-metrics">
            <article className="surface m3-metric"><span>Total reported footprint</span><b>{kg(dashboard.totalCo2eKg)} kg</b><small>CO₂e from reporting-consented members</small></article>
            <article className="surface m3-metric"><span>Reporting participants</span><b>{dashboard.employees?.length || 0}</b><small>Members opted in for this report</small></article>
            <article className="surface m3-metric"><span>Categories represented</span><b>{Object.keys(dashboard.byCategory || {}).length}</b><small>With logged activity in this range</small></article>
          </div>
          <section className="surface m3-panel">
            <div className="surface-title"><div><span className="kicker">CATEGORY MIX</span><h2>Emissions by category</h2></div></div>
            {Object.keys(dashboard.byCategory || {}).length === 0
              ? <div className="m3-empty"><b>No reportable activity</b><p>There are no activities from members who opted in during this period.</p></div>
              : <div className="m3-category-grid">{Object.entries(dashboard.byCategory).map(([category, value]) =>
                <div className="m3-category" key={category}><span>{words(category)}</span><b>{kg(value)} kg</b></div>)}</div>}
          </section>
          <section className="surface m3-panel">
            <div className="surface-title"><div><span className="kicker">MONTHLY TREND</span><h2>Reported footprint over time</h2></div></div>
            {dashboard.monthTrend?.length
              ? <div className="m3-months">{dashboard.monthTrend.map((month) => {
                const max = Math.max(0.01, ...dashboard.monthTrend.map((item) => Number(item.totalCo2eKg || 0)));
                const width = Math.max(0, Number(month.totalCo2eKg || 0) / max * 100);
                return <div className="m3-month" key={month.month}><span>{month.month}</span><div className="m3-bar"><i style={{ width: width + "%" }} /></div><b>{kg(month.totalCo2eKg)} kg</b></div>;
              })}</div>
              : <div className="m3-empty"><b>No monthly data</b><p>Monthly totals will appear when opted-in users log activities.</p></div>}
          </section>
          <section className="surface m3-panel">
            <div className="surface-title"><div><span className="kicker">CONSENTED EMPLOYEE VIEW</span><h2>Employee comparison</h2></div></div>
            {dashboard.employees?.length
              ? <div className="table-scroll"><table className="m3-table"><thead><tr><th>Employee</th><th>Total CO₂e</th><th>Transport</th><th>Electricity</th><th>Food</th><th>Shopping</th></tr></thead>
                <tbody>{dashboard.employees.map((employee) => <tr key={employee.username}><td><b>{employee.username}</b></td><td><strong>{kg(employee.totalCo2eKg)} kg</strong></td><td>{kg(employee.byCategory?.transport)} kg</td><td>{kg(employee.byCategory?.electricity)} kg</td><td>{kg(employee.byCategory?.food)} kg</td><td>{kg(employee.byCategory?.shopping)} kg</td></tr>)}</tbody></table></div>
              : <div className="m3-empty"><b>No members have opted in</b><p>Ask employees to enable organisation reporting in their own Preferences. No employee data is visible before consent.</p></div>}
          </section>
        </>}
      </>}

      {error && <div className="alert alert-error">{error}</div>}
      {notice && <div className="alert alert-success">{notice}</div>}
    </section>
  );
}
