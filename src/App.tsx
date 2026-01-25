import { useEffect, useMemo, useState } from "react";
import "./App.css";
import InfoTip from "./components/InfoTip";
import tctLogo from "./assets/tec-centric-logo.png";
import TruckSlider from "./components/TruckSlider";
import ValueProposition from "./components/ValueProposition";

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

type CurrencyCode = "RM" | "USD" | "AED" | "SAR";

export default function App() {
  const qs = new URLSearchParams(window.location.search);
  const isEmbed = qs.get("embed") === "1";

  const basisParam = qs.get("basis");
  const basis = basisParam ? Number(basisParam) : undefined;

  const [mode, setMode] = useState<"demo" | "secure">("demo");
  const [tenantKey, setTenantKey] = useState("demo");
  const [fleetSize, setFleetSize] = useState(25);
  const [baseline, setBaseline] = useState(62);
  const [target, setTarget] = useState(78);

  // Revenue assumption (editable when customer gives real data)
  const [revPerVehicleYear, setRevPerVehicleYear] = useState<number>(1_000_000);

  // KPI toggle
  const [revPeriod, setRevPeriod] = useState<"annual" | "monthly">("annual");

  // Currency (will become real once backend FX endpoint is added)
  const [currency, setCurrency] = useState<CurrencyCode>("RM");

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [resp, setResp] = useState<ApiResp | null>(null);

  const delta = useMemo(() => target - baseline, [target, baseline]);

  // Client-side Added Revenue KPI (until backend returns Choice 2 explainability for it)
  const addedRevenueAnnual = useMemo(() => {
    const f = Number(fleetSize) || 0;
    const rev = Number(revPerVehicleYear) || 0;
    const d = Number(delta) || 0;
    return f * rev * (d / 100);
  }, [fleetSize, revPerVehicleYear, delta]);

  const addedRevenue = revPeriod === "annual" ? addedRevenueAnnual : addedRevenueAnnual / 12;

  function fmtMoney(n: number, code: CurrencyCode) {
    const safe = Number.isFinite(n) ? n : 0;
    // NOTE: until backend FX exists, we do not convert — we display in selected currency.
    // Once FX endpoint is ready, we’ll multiply by fxRate here.
    return `${code} ${Math.round(safe).toLocaleString()}`;
  }

  useEffect(() => {
    if (!isEmbed) {
      console.info("[FPI] Embed mode available: add ?embed=1 for a clean embedded view.");
      console.info("[FPI] Basis override supported in URL: ?basis=12000 (only if backend accepts).");
      console.info("[FPI] Currency currently display-only; will become real once /v1/fx/latest is live.");
    }
  }, [isEmbed]);

  async function run() {
    setBusy(true);
    setErr(null);
    setResp(null);

    try {
      const endpoint = mode === "demo" ? "demo-run" : "run";
      const token = window.__NEEV_ACCESS_TOKEN;

      const payload: {
        tenant_key: string;
        fleet_size: number;
        baseline_index: number;
        target_index: number;
        impact_basis?: number;
        // future: revenue_per_vehicle_year?: number;
      } = {
        tenant_key: tenantKey,
        fleet_size: fleetSize,
        baseline_index: baseline,
        target_index: target,
      };

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
          <a className="brand brandLink" href="https://www.tec-centric.tech" target="_blank" rel="noreferrer">
            <div className="brandLogo" aria-hidden="true">
              <img className="brandLogoImg" src={tctLogo} alt="Tec-Centric Technologies" />
            </div>

            <div>
              <div className="brandTitle">Fleet Performance Index</div>
              <div className="brandSub">Neev • Predictive Model Calculator (v1)</div>
            </div>
          </a>

          <div className="hdrLinks">
            <a className="miniLink" href="https://passport.tec-centric.tech/admin" target="_blank" rel="noreferrer">
              Passport
            </a>
            <a className="miniLink" href="https://verify.tec-centric.tech" target="_blank" rel="noreferrer">
              Verify
            </a>
            <a className="cta" href="https://www.tec-centric.tech/contact" target="_blank" rel="noreferrer">
              Talk to Us
            </a>
          </div>
        </header>
      )}

      <main className="neo-wrap">
        <section className="glass hero">
          <div className="heroLeft">
            <h1>
              Predict savings from operational uplift — <span className="grad">in seconds</span>.
            </h1>
            <p>
              A fleet profitability calculator today. The foundation for a full predictive engine (benchmarks, driver behavior, maintenance,
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
                <InfoTip text="The uplift you expect from process + training + tech. Higher delta increases projected impact." />
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
            <div className="cardTitle">Inputs</div>
            <div className="cardSub muted">Hover ⓘ for definitions</div>

            <div className="fieldRow">
              <label>
                Tenant Key{" "}
                <InfoTip text="For now, tenant_key is required. In Phase 2, this will be inferred from JWT claims (tenant isolation)." />
              </label>
              <input value={tenantKey} onChange={(e) => setTenantKey(e.target.value)} placeholder="demo" />
            </div>

            <div className="fieldRow">
              <label>
                Fleet Size <InfoTip text="Number of active vehicles in the fleet segment you’re targeting." />
              </label>
              <TruckSlider value={fleetSize} onChange={setFleetSize} min={1} max={500} />
            </div>

            <div className="twoCol">
              <div className="fieldRow">
                <label>
                  Baseline FPI <InfoTip text="Current operational state (0–100). Use your current FPI score." />
                </label>
                <input type="number" min={0} max={100} value={baseline} onChange={(e) => setBaseline(Number(e.target.value))} />
              </div>

              <div className="fieldRow">
                <label>
                  Target FPI <InfoTip text="Expected post-intervention index (0–100). Target after training + process + tech adoption." />
                </label>
                <input type="number" min={0} max={100} value={target} onChange={(e) => setTarget(Number(e.target.value))} />
              </div>
            </div>

            <details className="assumpDetails">
              <summary className="assumpSummary">Revenue assumption</summary>
              <div className="fieldRow" style={{ marginTop: 10 }}>
                <label>
                  Revenue / vehicle / year{" "}
                  <InfoTip text="Default RM 1,000,000. Update when customer provides servicing history, invoices, utilization, and telematics." />
                </label>
                <input
                  type="number"
                  min={0}
                  value={revPerVehicleYear}
                  onChange={(e) => setRevPerVehicleYear(Number(e.target.value))}
                />
              </div>
            </details>

            <button className="runBtn" onClick={run} disabled={busy}>
              {busy ? "Running…" : "Calculate FPI Impact →"}
            </button>

            {err && <div className="error">{err}</div>}
          </div>

          <div className="glass card">
            <div className="cardTitle">Outputs</div>

            {!resp ? (
              <div className="empty">Run a calculation to see projected impact, explainability, and the audit-safe run ID.</div>
            ) : (
              <>
                <div className="kpiRow">
                  <div className="kpi">
                    <div className="kpiLabel kpiLabelRow">
                      <span>
                        Projected Added Revenue{" "}
                        <InfoTip text="Currently computed in the frontend using the Revenue/vehicle/year assumption. In Phase 2, backend will return this KPI + assumptions + explainability (Choice 2)." />
                      </span>

                      <div className="kpiToggles">
                        <button className={`pill miniPill ${revPeriod === "annual" ? "on" : ""}`} onClick={() => setRevPeriod("annual")} type="button">
                          Annual
                        </button>
                        <button className={`pill miniPill ${revPeriod === "monthly" ? "on" : ""}`} onClick={() => setRevPeriod("monthly")} type="button">
                          Monthly
                        </button>
                      </div>
                    </div>

                    <div className="kpiVal">{fmtMoney(addedRevenue, currency)}</div>

                    <div className="kpiMetaRow">
                      <div className="kpiMeta">
                        Assumption: <span className="mono">rev/veh/yr = {currency} {Math.round(revPerVehicleYear).toLocaleString()}</span>
                      </div>
                      <div className="kpiCurrency">
                        <select className="vpSelect" value={currency} onChange={(e) => setCurrency(e.target.value as CurrencyCode)}>
                          <option value="RM">RM</option>
                          <option value="USD">USD</option>
                          <option value="AED">AED</option>
                          <option value="SAR">SAR</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="kpi">
                    <div className="kpiLabel">Run ID</div>
                    <div className="kpiVal mono">{resp.run_id}</div>
                  </div>
                </div>

                <div className="explain">
                  <div className="explainTitle">Explainability (API)</div>
                  <ul>
                    {resp.explain?.map((x, i) => (
                      <li key={i}>{x}</li>
                    ))}
                  </ul>
                </div>

                <div className="embedNote">
                  Audit-safe output: every run generates a unique <span className="mono">Run ID</span> for traceability.
                </div>

                <ValueProposition fleetSize={fleetSize} currency={currency} onCurrencyChange={setCurrency} />
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
