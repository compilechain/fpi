import React, { useMemo, useState } from "react";
import { TruckSlider } from "./components/TruckSlider";
import { InfoTip } from "./components/InfoTip";
import { demoRun } from "./lib/api";

type Application = "highway" | "offroad" | "mixed";

export default function App() {
  const [fleetSize, setFleetSize] = useState(120);
  const [productivity, setProductivity] = useState(250000);
  const [application, setApplication] = useState<Application>("highway");

  const [uptimeBefore, setUptimeBefore] = useState(70);
  const [routeBefore, setRouteBefore] = useState(70);
  const [drivingBefore, setDrivingBefore] = useState(70);
  const [personnelBefore, setPersonnelBefore] = useState(70);

  const [uptimeAfter, setUptimeAfter] = useState(80);
  const [routeAfter, setRouteAfter] = useState(80);
  const [drivingAfter, setDrivingAfter] = useState(80);
  const [personnelAfter, setPersonnelAfter] = useState(80);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const payload = useMemo(() => ({
    fleet_size: fleetSize,
    avg_productivity_per_vehicle: productivity,
    application,
    indices: {
      before: {
        uptime: uptimeBefore,
        route_management: routeBefore,
        driving: drivingBefore,
        personnel: personnelBefore,
      },
      after: {
        uptime: uptimeAfter,
        route_management: routeAfter,
        driving: drivingAfter,
        personnel: personnelAfter,
      },
    },
  }), [fleetSize, productivity, application, uptimeBefore, routeBefore, drivingBefore, personnelBefore, uptimeAfter, routeAfter, drivingAfter, personnelAfter]);

  async function run() {
    setLoading(true);
    setError(null);
    try {
      const r = await demoRun(payload);
      setResult(r);
    } catch (e: any) {
      setError(e?.message || "Run failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-xl">
          <div className="flex items-start justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-neutral-200">
                <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                FPI Demo • Explainable • Audit Logged
              </div>
              <h1 className="mt-5 text-3xl font-semibold tracking-tight md:text-5xl">
                Fleet Performance Index (FPI)
              </h1>
              <p className="mt-3 max-w-2xl text-neutral-300">
                Adjust inputs, run the model, and see your FPI% plus the levers that move it most.
              </p>
            </div>

            <button
              onClick={run}
              disabled={loading}
              className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-neutral-900 transition hover:shadow-lg hover:shadow-fuchsia-500/20 disabled:opacity-60"
            >
              {loading ? "Running..." : "Run Model →"}
            </button>
          </div>

          {error ? (
            <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
              {error}
            </div>
          ) : null}

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <TruckSlider
                label="Fleet Size"
                min={50}
                max={500}
                step={1}
                value={fleetSize}
                onChange={setFleetSize}
                help="Total number of vehicles in the fleet (v1 supports 50–500)."
              />

              <TruckSlider
                label="Avg Productivity / Vehicle"
                min={50000}
                max={1000000}
                step={5000}
                value={productivity}
                onChange={setProductivity}
                help="Annual productivity per vehicle (revenue or value proxy)."
                unit=""
              />

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-sm font-semibold">
                  Application Type
                  <InfoTip text="Used to contextualize expected operating conditions (highway/offroad/mixed)." />
                </div>
                <div className="mt-3 flex gap-2">
                  {(["highway","mixed","offroad"] as Application[]).map((a) => (
                    <button
                      key={a}
                      onClick={() => setApplication(a)}
                      className={`rounded-xl px-4 py-2 text-sm border transition ${
                        application === a
                          ? "border-cyan-400/40 bg-cyan-400/10 text-cyan-100"
                          : "border-white/10 bg-white/5 text-neutral-200 hover:bg-white/10"
                      }`}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-sm font-semibold">
                  Indices (Before → After)
                  <InfoTip text="Each index is 50–100. v1 computes deterministic FPI% + improvement contributions." />
                </div>

                {[
                  ["Uptime", uptimeBefore, setUptimeBefore, uptimeAfter, setUptimeAfter],
                  ["Route Mgmt", routeBefore, setRouteBefore, routeAfter, setRouteAfter],
                  ["Driving", drivingBefore, setDrivingBefore, drivingAfter, setDrivingAfter],
                  ["Personnel", personnelBefore, setPersonnelBefore, personnelAfter, setPersonnelAfter],
                ].map(([label, b, setB, a, setA]: any) => (
                  <div key={label} className="mt-4 grid grid-cols-2 gap-3">
                    <label className="text-xs text-neutral-300">
                      {label} (Before)
                      <input
                        type="number"
                        min={50}
                        max={100}
                        value={b}
                        onChange={(e) => setB(Number(e.target.value))}
                        className="mt-1 w-full rounded-xl border border-white/10 bg-neutral-950/40 px-3 py-2 text-sm text-neutral-100"
                      />
                    </label>
                    <label className="text-xs text-neutral-300">
                      {label} (After)
                      <input
                        type="number"
                        min={50}
                        max={100}
                        value={a}
                        onChange={(e) => setA(Number(e.target.value))}
                        className="mt-1 w-full rounded-xl border border-white/10 bg-neutral-950/40 px-3 py-2 text-sm text-neutral-100"
                      />
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="text-sm font-semibold">Results</div>

              {!result ? (
                <div className="mt-4 text-sm text-neutral-300">
                  Run the model to see FPI% + improvement levers + explanation.
                </div>
              ) : (
                <>
                  <div className="mt-5 rounded-2xl border border-white/10 bg-neutral-950/40 p-5">
                    <div className="text-xs text-neutral-300">FPI%</div>
                    <div className="mt-1 text-4xl font-semibold">
                      {result?.outputs?.fpi_percent ?? "—"}
                    </div>
                    <div className="mt-2 text-xs text-neutral-400">
                      Run ID: {result?.run_id ?? "—"}
                    </div>
                  </div>

                  <div className="mt-5">
                    <div className="text-sm font-semibold">Key Drivers</div>
                    <pre className="mt-2 overflow-auto rounded-2xl border border-white/10 bg-neutral-950/40 p-4 text-xs text-neutral-200">
{JSON.stringify(result?.explanation ?? {}, null, 2)}
                    </pre>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 text-xs text-neutral-400">
          Note: If iframe embedding is blocked elsewhere, check X-Frame-Options / CSP frame-ancestors. :contentReference[oaicite:10]{index=10}
        </div>
      </div>
    </div>
  );
}
