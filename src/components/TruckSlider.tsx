type Props = {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
};

export default function TruckSlider({ value, onChange, min, max }: Props) {
  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div className="truckSlider">
      <div className="truckTrack">
        <div className="truckFill" style={{ width: `${pct}%` }} />
        <div className="truckIcon" style={{ left: `calc(${pct}% - 10px)` }} aria-hidden="true">
          🚚
        </div>
      </div>

      <input
        className="range"
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />

      <div className="truckMeta">
        <span className="mono">{min}</span>
        <span className="mono">{value}</span>
        <span className="mono">{max}</span>
      </div>
    </div>
  );
}
