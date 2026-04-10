export function MetricTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="metric-tile">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}
