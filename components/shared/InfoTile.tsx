export function InfoTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="info-tile">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
