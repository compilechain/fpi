import { useMemo, useState } from "react";
import "./App.css";
import InfoTip from "./components/InfoTip";
import TruckSlider from "./components/TruckSlider";

type ApiResp = {
  run_id: string;
  tenant_key: string;
  fleet_size: number;
  baseline_index: number;
  target_index: number;
  delta_index: number;
  projected_monthly_savings: number;
  confidence: number;
  explain: string[];
};

const API_BASE = "https://api.tec-centric.tech/v1/fpi";

declare global {
  interface Window {
    __NEEV_ACCESS_TOKEN?: string;
  }
}

export default function App() {
  const qs = new URLSearchParams(window.location.search);
  const isEmbed = qs.get("embed") === "1";

  // Optional: allow override of impact basis via URL: ?basis=12000
  // This does NOTHING unless your backend accepts it.
  const basisParam = qs.get("basis");
  const basis = basisParam ? Number(basisParam) : undefined;

  const [mode, setMode] = useState<"demo" | "secure">("demo");
  const [tenantKey, setTenantKey] = useState("demo");
  const [fleetSize, setFleetSize] = useState(25);
  const [baseline, setBaseline] = useState(62);
  const [target, setTarget] = useState(78);

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [resp, setResp] = useState<ApiResp | null>(null);

  const delta = useMemo(() => target - baseline, [target, baseline]);

  async function run() {
    setBusy(true);
    setErr(null);
    setResp(null);

    try {
      const endpoint = mode === "demo" ? "demo-run" : "run";
      const token = window.__NEEV_ACCESS_TOKEN; // optional: app injects token

      const payload: {
        tenant_key: string;
        fleet_size: number;
        baseline_index: number;
        target_index: number;
        impact_basis?: number;
      } = {
        tenant_key: tenantKey,
        fleet_size: fleetSize,
        baseline_index: baseline,
        target_index: target,
      };

      // Only include if it’s a valid number
      if (typeof basis === "number" && Number.isFinite(basis)) {
        payload.impact_basis = basis;
      }

      const headers: Record<string, string> = {
        "content-type": "application/json",
      };

      if (mode === "secure") {
        if (!token) {
          throw new Error(
            "Secure mode needs a JWT. In app.tec-centric.tech, inject window.__NEEV_ACCESS_TOKEN (or switch to Demo mode).",
          );
        }
        headers["authorization"] = `Bearer ${token}`;
      }

      const r = await fetch(`${API_BASE}/${endpoint}`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      const data: unknown = await r.json().catch(() => ({}));
      if (!r.ok) {
        const d = data as { error?: string; message?: string };
        throw new Error(d?.error || d?.message || `Request failed (${r.status})`);
      }

      setResp(data as ApiResp);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setErr(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="neo-bg">
      {!isEmbed && (
        <header className="neo-header">
          <div className="brand">
            <div className="brandMark" />
            <div>
              <div className="brandTitle">Fleet Performance Index</div>
              <div className="brandSub">Neev • Predictive Model Calculator (v1)</div>
            </div>
          </div>

          <a className="cta" href="https://www.tec-centric.tech/contact" target="_blank" rel="noreferrer">
            Talk to Us
          </a>
        </header>
      )}

      <main className="neo-wrap">
        <section className="glass hero">
          <div className="heroLeft">
            <h1>
              Predict savings from operational uplift — <span className="grad">in seconds</span>.
            </h1>
            <p>
              A Fleet profitability calculator today. The foundation for a full predictive engine (benchmarks, driver behavior, maintenance,
              energy, claims) tomorrow.
            </p>
            <div className="pillRow">
              <button className={`pill ${mode === "demo" ? "on" : ""}`} onClick={() => setMode("demo")}>
                Demo Mode
              </button>
              <button className={`pill ${mode === "secure" ? "on" : ""}`} onClick={() => setMode("secure")}>
                Secure Mode (JWT)
              </button>
              <div className="miniNote">
                <InfoTip text="Demo Mode uses /demo-run and is embed-safe. Secure Mode uses /run and requires a valid Supabase JWT." />
              </div>
            </div>
          </div>

          <div className="heroRight">
            <div className="metric">
              <div className="metricLabel">
                Delta (Target − Baseline){" "}
                <InfoTip text="The uplift you expect from process + training + tech. Higher delta increases projected savings." />
              </div>
              <div className="metricVal">{delta}</div>
            </div>
            <div className="metric">
              <div className="metricLabel">
                Confidence{" "}
                <InfoTip text="v1 uses a deterministic confidence placeholder. Later it will be model-driven (data + variance + segments)." />
              </div>
              <div className="metricVal">{resp ? resp.confidence : "—"}</div>
            </div>
          </div>
        </section>

        <section className="grid">
          <div className="glass card">
            <div className="cardTitle">
              Inputs <span className="muted">( ⓘ for explanations)</span>
            </div>

            <div className="fieldRow">
              <label>
                Tenant Key{" "}
                <InfoTip text="For now, tenant_key is required. In Phase 2, this will be inferred from JWT claims (tenant isolation)." />
              </label>
              <input value={tenantKey} onChange={(e) => setTenantKey(e.target.value)} placeholder="demo" />
            </div>

            <div className="fieldRow">
              <label>
                Fleet Size{" "}
                <InfoTip text="Number of active vehicles in the fleet segment you’re targeting." />
              </label>
              <TruckSlider value={fleetSize} onChange={setFleetSize} min={1} max={500} />
            </div>

            <div className="twoCol">
              <div className="fieldRow">
                <label>
                  Baseline Index{" "}
                  <InfoTip text="Current operational state (0–100). Use your current FPI score." />
                </label>
                <input type="number" min={0} max={100} value={baseline} onChange={(e) => setBaseline(Number(e.target.value))} />
              </div>

              <div className="fieldRow">
                <label>
                  Target Index{" "}
                  <InfoTip text="Expected post-intervention index (0–100). Target after training + process + tech adoption." />
                </label>
                <input type="number" min={0} max={100} value={target} onChange={(e) => setTarget(Number(e.target.value))} />
              </div>
            </div>

            <button className="runBtn" onClick={run} disabled={busy}>
              {busy ? "Running…" : "Calculate FPI Impact →"}
            </button>

            {err && <div className="error">{err}</div>}
          </div>

          <div className="glass card">
            <div className="cardTitle">Outputs</div>

            {!resp ? (
              <div className="empty">Run a calculation to see projected savings, explainability, and the audit-safe run ID.</div>
            ) : (
              <>
                <div className="kpiRow">
                  <div className="kpi">
                    <div className="kpiLabel">Projected Monthly Savings</div>
                    <div className="kpiVal">RM {resp.projected_monthly_savings.toLocaleString()}</div>
                  </div>
                  <div className="kpi">
                    <div className="kpiLabel">Run ID</div>
                    <div className="kpiVal mono">{resp.run_id}</div>
                  </div>
                </div>

                <div className="explain">
                  <div className="explainTitle">Explainability</div>
                  <ul>
                    {resp.explain?.map((x, i) => (
                      <li key={i}>{x}</li>
                    ))}
                  </ul>
                </div>

                <div className="embedNote">
                  Tip: embed cleanly with <span className="mono">?embed=1</span>
                  {typeof basis === "number" && Number.isFinite(basis) && (
                    <>
                      {" "}
                      • basis override: <span className="mono">?basis={basis}</span>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </section>

        {!isEmbed && (
          <footer className="neo-footer">
            <div className="muted">
              Built for workshops, fleet ops, and non-technical stakeholders — explainable outputs, audit trails, and demo-safe defaults.
            </div>
          </footer>
        )}
      </main>
    </div>
  );
}
