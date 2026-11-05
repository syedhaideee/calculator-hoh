"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BUSINESS, PARTNER_1, PARTNER_2, NEW_CLIENT_TIERS, REPEAT_CLIENT_RATE,
  SUBSCRIPTION_FEE, CLIENT_TYPES, calculate, profitOf, gbp, pct,
} from "../lib/calc";

const STORAGE_KEY = "hoh-projects-v1";
let nextId = 1;
const blank = (type = "new") => ({
  id: nextId++, name: "", type, profit: "", useCost: false, price: "", cost: "",
});

export default function Home() {
  const [projects, setProjects] = useState([blank("new")]);
  const [period, setPeriod] = useState("");
  const [loaded, setLoaded] = useState(false);

  // Remember entries in this browser
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (saved?.projects?.length) {
        nextId = Math.max(...saved.projects.map((p) => p.id)) + 1;
        setProjects(saved.projects);
        setPeriod(saved.period || "");
      }
    } catch {}
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (!loaded) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ projects, period })); } catch {}
  }, [projects, period, loaded]);

  const result = useMemo(() => calculate(projects), [projects]);

  const update = (id, field, value) =>
    setProjects((ps) => ps.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  const remove = (id) => setProjects((ps) => ps.filter((p) => p.id !== id));
  const add = (type) => setProjects((ps) => [...ps, blank(type)]);
  const reset = () => { if (confirm("Clear all projects?")) { setProjects([blank("new")]); setPeriod(""); } };

  const download = async () => {
    const { downloadReceipt } = await import("../lib/pdf"); // client-only
    downloadReceipt(result, { period });
  };

  const hasData = result.grandTotal > 0;

  return (
    <main className="wrap">
      <header className="hero">
        <div>
          <p className="eyebrow">Landscaping &amp; Gardening · London</p>
          <h1>{BUSINESS}</h1>
          <p className="sub">Profit sharing calculator — {PARTNER_1} &amp; {PARTNER_2}</p>
        </div>
        <div className="hero-side">
          <form action="/api/logout" method="post">
            <button className="logout" type="submit">Log out</button>
          </form>
          <label className="period">
            <span>Period</span>
            <input value={period} onChange={(e) => setPeriod(e.target.value)} placeholder="e.g. October 2026" />
          </label>
        </div>
      </header>

      <section className="card">
        <div className="card-head">
          <h2>Projects</h2>
          <div className="btns">
            <button onClick={() => add("new")}>+ New client project</button>
            <button onClick={() => add("repeat")}>+ Repeat client project</button>
            <button onClick={() => add("subscription")}>+ Subscriber project</button>
          </div>
        </div>

        <div className="rows">
          {projects.length === 0 && <p className="muted">No projects yet — add one above.</p>}
          {projects.map((p, i) => (
            <div className="project" key={p.id}>
              <div className="row">
                <span className="num">{i + 1}</span>
                <input
                  className="name" placeholder="Project / client name"
                  value={p.name} onChange={(e) => update(p.id, "name", e.target.value)}
                />
                <select value={p.type} onChange={(e) => update(p.id, "type", e.target.value)}>
                  {CLIENT_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
                <div className="money">
                  <span>£</span>
                  {p.useCost ? (
                    <input
                      readOnly tabIndex={-1} aria-label="Gross profit (calculated)"
                      className={`calc ${profitOf(p) < 0 ? "neg" : ""}`}
                      value={profitOf(p).toFixed(2)}
                    />
                  ) : (
                    <input
                      type="number" min="0" step="0.01" inputMode="decimal" placeholder="Gross profit"
                      value={p.profit} onChange={(e) => update(p.id, "profit", e.target.value)}
                    />
                  )}
                </div>
                <button className="x" aria-label="Remove project" onClick={() => remove(p.id)}>×</button>
              </div>

              <div className="costing">
                <label className="toggle">
                  <input
                    type="checkbox" checked={!!p.useCost}
                    onChange={(e) => update(p.id, "useCost", e.target.checked)}
                  />
                  Calculate gross profit from price − cost
                </label>
                {p.useCost && (
                  <div className="costing-fields">
                    <label>
                      <span>Project price</span>
                      <div className="money">
                        <span>£</span>
                        <input
                          type="number" min="0" step="0.01" inputMode="decimal" placeholder="0.00"
                          value={p.price} onChange={(e) => update(p.id, "price", e.target.value)}
                        />
                      </div>
                    </label>
                    <span className="op">−</span>
                    <label>
                      <span>Overall cost</span>
                      <div className="money">
                        <span>£</span>
                        <input
                          type="number" min="0" step="0.01" inputMode="decimal" placeholder="0.00"
                          value={p.cost} onChange={(e) => update(p.id, "cost", e.target.value)}
                        />
                      </div>
                    </label>
                    <span className="op">=</span>
                    <div className={`result ${profitOf(p) < 0 ? "neg" : ""}`}>
                      <span>Gross profit</span>
                      <strong>{gbp(profitOf(p))}</strong>
                    </div>
                  </div>
                )}
                {p.useCost && profitOf(p) < 0 && (
                  <p className="warn">Cost is higher than the price — this project is a loss and will reduce the totals.</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid2">
        <section className="card">
          <h2>Scenario 1 · New clients</h2>
          <Line label="Total gross profit" value={gbp(result.newTotal)} />
          <Line label="Tier applied" value={result.newTier ? `${result.newTier.label} → ${pct(result.newRate)}` : "—"} />
          <Line label={`${PARTNER_2} share`} value={gbp(result.haider.new)} strong />
          <Line label={`${PARTNER_1} share`} value={gbp(result.hamid.new)} strong />
          <ul className="tiers">
            {NEW_CLIENT_TIERS.map((t) => (
              <li key={t.label} className={result.newTier?.label === t.label ? "on" : ""}>
                <span>{t.label}</span><span>{pct(t.rate)}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="card">
          <h2>Scenario 2 · Repeat clients</h2>
          <Line label="Total gross profit" value={gbp(result.repeatTotal)} />
          <Line label="Rate applied" value={`Flat ${pct(REPEAT_CLIENT_RATE)}`} />
          <Line label={`${PARTNER_2} share`} value={gbp(result.haider.repeat)} strong />
          <Line label={`${PARTNER_1} share`} value={gbp(result.hamid.repeat)} strong />
        </section>

        <section className="card">
          <h2>Scenario 3 · Monthly maintenance</h2>
          <Line label="Total gross profit" value={gbp(result.subTotal)} />
          <Line label="Rule applied" value={`£${SUBSCRIPTION_FEE} × ${result.subProjects.length} project${result.subProjects.length === 1 ? "" : "s"}`} />
          <Line label={`${PARTNER_2} share`} value={gbp(result.haider.subscription)} strong />
          <Line label={`${PARTNER_1} share`} value={gbp(result.hamid.subscription)} strong />
          <p className="note">Fixed £{SUBSCRIPTION_FEE} to {PARTNER_2} per subscriber project, whatever the price.</p>
        </section>
      </div>

      <section className="card totals">
        <h2>Overall payout</h2>
        <div className="partners">
          <div className="partner">
            <p>{PARTNER_1}</p>
            <strong>{gbp(result.hamid.total)}</strong>
          </div>
          <div className="partner">
            <p>{PARTNER_2}</p>
            <strong>{gbp(result.haider.total)}</strong>
          </div>
          <div className="partner combined">
            <p>Combined gross profit</p>
            <strong>{gbp(result.grandTotal)}</strong>
          </div>
        </div>
        <div className="actions">
          <button className="primary" disabled={!hasData} onClick={download}>Download PDF receipt</button>
          <button className="ghost" onClick={reset}>Clear all</button>
        </div>
      </section>
    </main>
  );
}

function Line({ label, value, strong }) {
  return (
    <div className={`line ${strong ? "strong" : ""}`}>
      <span>{label}</span><span>{value}</span>
    </div>
  );
}
