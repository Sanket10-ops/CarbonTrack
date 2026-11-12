import React, { useState } from "react";
import { api } from "../api.js";

const today = () => {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
};
const daysAgo = (days) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
};
const kg = (value) => Number(value ?? 0).toLocaleString(undefined, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});
const words = (value = "") => value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

export default function LeaderboardPage({ profile, onPreferences }) {
  const [from, setFrom] = useState(daysAgo(29));
  const [to, setTo] = useState(today());
  const [entries, setEntries] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function load(e) {
    e?.preventDefault();
    setBusy(true);
    setError("");
    try {
      setEntries(await api.leaderboard(from, to, 50));
      setLoaded(true);
    } catch (err) {
      setError(err.message || "Could not load the leaderboard.");
      setEntries([]);
      setLoaded(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="m3-page">
      <div className="page-heading">
        <div>
          <span className="kicker">COMMUNITY / OPT-IN RANKING</span>
          <h1>Community leaderboard</h1>
          <p>Compare recorded footprints with people who explicitly chose to appear on the anonymous leaderboard.</p>
        </div>
      </div>

      <div className="surface m3-consent-note">
        <div>
          <b>Your leaderboard participation</b>
          <p>{profile?.leaderboardOptIn
            ? "Your account is opted in. You can switch this off at any time in Preferences."
            : "Your account is currently hidden. Opt in from Preferences before your footprint can appear here."}</p>
        </div>
        <button className="btn btn-secondary" type="button" onClick={onPreferences}>Manage privacy settings</button>
      </div>

      <section className="surface m3-panel">
        <div className="surface-title">
          <div><span className="kicker">DATE RANGE</span><h2>Lowest recorded footprint</h2></div>
          <span className="tag">Maximum 50 entries</span>
        </div>
        <form className="m3-filter" onSubmit={load}>
          <label className="field"><span>From</span><input type="date" value={from} max={to} onChange={(event) => setFrom(event.target.value)} required /></label>
          <label className="field"><span>To</span><input type="date" value={to} min={from} max={today()} onChange={(event) => setTo(event.target.value)} required /></label>
          <button className="btn btn-primary" type="submit" disabled={busy}>{busy ? "Loading…" : "Load leaderboard"}</button>
        </form>
      </section>

      {error && <div className="alert alert-error">{error}</div>}
      <section className="surface m3-panel">
        <div className="surface-title">
          <div><span className="kicker">ANONYMOUS PARTICIPANTS</span><h2>Leaderboard results</h2></div>
          {loaded && <span className="tag">{entries.length} participants</span>}
        </div>
        {!loaded ? <div className="m3-empty"><b>Choose a date range</b><p>Load the leaderboard to view opted-in participants and their aggregated CO₂e totals.</p></div>
          : entries.length === 0 ? <div className="m3-empty"><b>No eligible participants found</b><p>No opted-in account recorded an activity in this period.</p></div>
            : <div className="table-scroll"><table className="m3-table">
              <thead><tr><th>Rank</th><th>Anonymous alias</th><th>Total CO₂e</th><th>Highest impact category</th><th>Badges</th><th>Habit tip</th></tr></thead>
              <tbody>{entries.map((entry) => <tr key={entry.displayAlias}>
                <td><b>#{entry.rank}</b></td>
                <td><b>{entry.displayAlias}</b></td>
                <td><strong>{kg(entry.totalCo2eKg)} kg</strong></td>
                <td>{words(entry.strongestCategory)}</td>
                <td>{entry.badges?.length ? entry.badges.join(", ") : "—"}</td>
                <td className="m3-tip">{entry.habitTip}</td>
              </tr>)}</tbody>
            </table></div>}
        <p className="m3-footnote">Only anonymous aliases and date-range totals are returned. Names, email addresses and account IDs are not included in the leaderboard response.</p>
      </section>
    </section>
  );
}
