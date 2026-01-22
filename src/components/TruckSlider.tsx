import { useMemo, useState } from "react";

type Props = {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export default function TruckSlider({ value, onChange, min, max }: Props) {
  const [dragging, setDragging] = useState(false);

  const pct = useMemo(() => {
    const safe = clamp(value, min, max);
    const raw = ((safe - min) / (max - min)) * 100;
    return Number.isFinite(raw) ? raw : 0;
  }, [value, min, max]);

  return (
    <div className="truckSlider">
      <div className={`truckTrackWrap ${dragging ? "isDragging" : ""}`}>
        <div className="truckTrack" aria-hidden="true">
          <div className="truckFill" style={{ width: `${pct}%` }} />

          {/* SVG handle */}
          <div className="truckHandle" style={{ left: `calc(${pct}% - 18px)` }} aria-hidden="true">
            <svg className="truckSvg" viewBox="0 0 64 40" width="44" height="30">
              {/* Body */}
              <path
                d="M6 10h30a4 4 0 0 1 4 4v14H10a4 4 0 0 1-4-4V10z"
                fill="currentColor"
                opacity="0.9"
              />
              {/* Cabin */}
              <path
                d="M40 16h10l6 6v6a4 4 0 0 1-4 4H40V16z"
                fill="currentColor"
                opacity="0.9"
              />
              {/* Window cut */}
              <path d="M44 18h5l3 3h-8v-3z" fill="rgba(0,0,0,0.35)" />
              {/* Wheels */}
              <circle cx="18" cy="32" r="5" fill="currentColor" opacity="0.95" />
              <circle cx="46" cy="32" r="5" fill="currentColor" opacity="0.95" />
              <circle cx="18" cy="32" r="2.2" fill="rgba(0,0,0,0.35)" />
              <circle cx="46" cy="32" r="2.2" fill="rgba(0,0,0,0.35)" />

              {/* Headlamps (glow appears only while dragging via CSS) */}
              <g className="headlamps">
                <circle cx="56" cy="25" r="2" fill="currentColor" opacity="0.9" />
                <path d="M58 24 L64 22 L64 28 L58 26 Z" fill="currentColor" opacity="0.55" />
              </g>
            </svg>
          </div>
        </div>

        {/* Invisible input ON TOP */}
        <input
          className="rangeOverlay"
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          onMouseDown={() => setDragging(true)}
          onMouseUp={() => setDragging(false)}
          onTouchStart={() => setDragging(true)}
          onTouchEnd={() => setDragging(false)}
          aria-label="Fleet size"
        />
      </div>

      <div className="truckMeta">
        <span className="mono">{min}</span>
        <span className="mono pillVal">{value}</span>
        <span className="mono">{max}</span>
      </div>
    </div>
  );
}
