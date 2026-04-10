export function InfoChip({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="info-chip">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
