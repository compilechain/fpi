import { useMemo, useState } from "react";
import InfoTip from "./InfoTip";

type Props = {
  fleetSize: number;
  currency: "RM" | "USD" | "AED" | "SAR";
  onCurrencyChange: (c: "RM" | "USD" | "AED" | "SAR") => void;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function fmtMoney(n: number, code: string) {
  const safe = Number.isFinite(n) ? n : 0;
  return `${code} ${Math.round(safe).toLocaleString()}`;
}

export default function ValueProposition({ fleetSize, currency, onCurrencyChange }: Props) {
  const [open, setOpen] = useState(false);
  const [showMonthly, setShowMonthly] = useState(false);

  // Assumptions (demo-safe defaults; editable)
  const [annualKm, setAnnualKm] = useState(120000);

  // Fuel
  const [fuelBefore, setFuelBefore] = useState(30); // L/100km
  const [fuelAfter, setFuelAfter] = useState(28); // L/100km
  const [fuelCost, setFuelCost] = useState(2.15); // per liter

  // Brakes
  const [brakeBeforeKm, setBrakeBeforeKm] = useState(60000);
  const [brakeAfterKm, setBrakeAfterKm] = useState(75000);
  const [brakeCostSet, setBrakeCostSet] = useState(1800);

  // Tyres
  const [tyreBeforeKm, setTyreBeforeKm] = useState(90000);
  const [tyreAfterKm, setTyreAfterKm] = useState(110000);
  const [tyreCostSet, setTyreCostSet] = useState(7000);

  const safeFleet = clamp(Number(fleetSize) || 0, 0, 100000);

  const calc = useMemo(() => {
    const km = Math.max(0, Number(annualKm) || 0);

    // Fuel savings per vehicle: (km/100)*(before-after)*cost
    const fBefore = Math.max(0, Number(fuelBefore) || 0);
    const fAfter = Math.max(0, Number(fuelAfter) || 0);
    const fCost = Math.max(0, Number(fuelCost) || 0);
    const fuelPerVeh = (km / 100) * Math.max(0, fBefore - fAfter) * fCost;

    // Brakes
    const bBefore = Math.max(1, Number(brakeBeforeKm) || 1);
    const bAfter = Math.max(1, Number(brakeAfterKm) || 1);
    const bCost = Math.max(0, Number(brakeCostSet) || 0);
    const brakePerVeh = Math.max(0, km / bBefore - km / bAfter) * bCost;

    // Tyres
    const tBefore = Math.max(1, Number(tyreBeforeKm) || 1);
    const tAfter = Math.max(1, Number(tyreAfterKm) || 1);
    const tCost = Math.max(0, Number(tyreCostSet) || 0);
    const tyrePerVeh = Math.max(0, km / tBefore - km / tAfter) * tCost;

    const fleetAnnual = {
      fuel: fuelPerVeh * safeFleet,
      brakes: brakePerVeh * safeFleet,
      tyres: tyrePerVeh * safeFleet,
      total: (fuelPerVeh + brakePerVeh + tyrePerVeh) * safeFleet,
    };

    return { fleetAnnual };
  }, [annualKm, fuelBefore, fuelAfter, fuelCost, brakeBeforeKm, brakeAfterKm, brakeCostSet, tyreBeforeKm, tyreAfterKm, tyreCostSet, safeFleet]);

  const divisor = showMonthly ? 12 : 1;
  const periodLabel = showMonthly ? "Monthly" : "Annual";

  const fleetFuel = calc.fleetAnnual.fuel / divisor;
  const fleetBrakes = calc.fleetAnnual.brakes / divisor;
  const fleetTyres = calc.fleetAnnual.tyres / divisor;
  const fleetTotal = calc.fleetAnnual.total / divisor;

  return (
    <div className="vpWrap">
      <button className="vpHeader" onClick={() => setOpen((s) => !s)} type="button">
        <div className="vpHeaderLeft">
          <div className="vpTitle">Value Proposition (optional)</div>
          <div className="vpSub">
            Total {periodLabel} Savings (fleet): <span className="vpStrong">{fmtMoney(fleetTotal, currency)}</span>
          </div>
        </div>
        <div className="vpChevron">{open ? "▾" : "▸"}</div>
      </button>

      <div className="vpTopRow">
        <div className="vpToggleGroup">
          <button className={`pill vpPill ${!showMonthly ? "on" : ""}`} onClick={() => setShowMonthly(false)} type="button">
            Annual
          </button>
          <button className={`pill vpPill ${showMonthly ? "on" : ""}`} onClick={() => setShowMonthly(true)} type="button">
            Monthly
          </button>
          <div className="vpNote">
            <InfoTip text="Directional driver estimates (Fuel, Brakes, Tyres). Defaults are editable assumptions and demo-safe." />
          </div>
        </div>

        <div className="vpCurrency">
          <label className="vpLabel">
            Currency <InfoTip text="Currently display-only. Phase 2: convert via backend-cached FX (/v1/fx/latest)." />
          </label>
          <select className="vpSelect" value={currency} onChange={(e) => onCurrencyChange(e.target.value as any)}>
            <option value="RM">RM</option>
            <option value="USD">USD</option>
            <option value="AED">AED</option>
            <option value="SAR">SAR</option>
          </select>
        </div>
      </div>

      {open && (
        <div className="vpBody">
          <div className="vpGrid">
            <div className="vpItem">
              <div className="vpItemTitle">Fuel</div>
              <div className="vpItemVal">{fmtMoney(fleetFuel, currency)}</div>
              <div className="vpItemSub">{periodLabel} fleet savings</div>
            </div>

            <div className="vpItem">
              <div className="vpItemTitle">Brakes</div>
              <div className="vpItemVal">{fmtMoney(fleetBrakes, currency)}</div>
              <div className="vpItemSub">{periodLabel} fleet savings</div>
            </div>

            <div className="vpItem">
              <div className="vpItemTitle">Tyres</div>
              <div className="vpItemVal">{fmtMoney(fleetTyres, currency)}</div>
              <div className="vpItemSub">{periodLabel} fleet savings</div>
            </div>

            <div className="vpItem vpTotal">
              <div className="vpItemTitle">Total</div>
              <div className="vpItemVal">{fmtMoney(fleetTotal, currency)}</div>
              <div className="vpItemSub">{periodLabel} fleet savings</div>
            </div>
          </div>

          <details className="vpDetails">
            <summary className="vpSummary">Edit assumptions</summary>

            <div className="vpInputs">
              <div className="vpInputRow">
                <label className="vpLabel">
                  Annual km / vehicle <InfoTip text="Used for fuel and parts replacement frequency calculations." />
                </label>
                <input type="number" value={annualKm} onChange={(e) => setAnnualKm(Number(e.target.value))} />
              </div>

              <div className="vpSplit">
                <div className="vpBlock">
                  <div className="vpBlockTitle">Fuel</div>
                  <div className="vpInputGrid">
                    <div className="vpInputRow">
                      <label className="vpLabel">Before (L/100km)</label>
                      <input type="number" value={fuelBefore} onChange={(e) => setFuelBefore(Number(e.target.value))} />
                    </div>
                    <div className="vpInputRow">
                      <label className="vpLabel">After (L/100km)</label>
                      <input type="number" value={fuelAfter} onChange={(e) => setFuelAfter(Number(e.target.value))} />
                    </div>
                    <div className="vpInputRow">
                      <label className="vpLabel">Fuel cost / liter</label>
                      <input type="number" value={fuelCost} onChange={(e) => setFuelCost(Number(e.target.value))} />
                    </div>
                  </div>
                </div>

                <div className="vpBlock">
                  <div className="vpBlockTitle">Brakes</div>
                  <div className="vpInputGrid">
                    <div className="vpInputRow">
                      <label className="vpLabel">Before frequency (km)</label>
                      <input type="number" value={brakeBeforeKm} onChange={(e) => setBrakeBeforeKm(Number(e.target.value))} />
                    </div>
                    <div className="vpInputRow">
                      <label className="vpLabel">After frequency (km)</label>
                      <input type="number" value={brakeAfterKm} onChange={(e) => setBrakeAfterKm(Number(e.target.value))} />
                    </div>
                    <div className="vpInputRow">
                      <label className="vpLabel">Cost / set</label>
                      <input type="number" value={brakeCostSet} onChange={(e) => setBrakeCostSet(Number(e.target.value))} />
                    </div>
                  </div>
                </div>

                <div className="vpBlock">
                  <div className="vpBlockTitle">Tyres</div>
                  <div className="vpInputGrid">
                    <div className="vpInputRow">
                      <label className="vpLabel">Before frequency (km)</label>
                      <input type="number" value={tyreBeforeKm} onChange={(e) => setTyreBeforeKm(Number(e.target.value))} />
                    </div>
                    <div className="vpInputRow">
                      <label className="vpLabel">After frequency (km)</label>
                      <input type="number" value={tyreAfterKm} onChange={(e) => setTyreAfterKm(Number(e.target.value))} />
                    </div>
                    <div className="vpInputRow">
                      <label className="vpLabel">Cost / set</label>
                      <input type="number" value={tyreCostSet} onChange={(e) => setTyreCostSet(Number(e.target.value))} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="vpFinePrint">
                Directional estimates for demo conversations. Calibrate with customer fleet data (actual km, consumption, maintenance intervals, and cost structures).
              </div>
            </div>
          </details>
        </div>
      )}
    </div>
  );
}
