import { Avatar } from "@/components/shared/Avatar";

type AvatarGroupProps = {
  entries: Array<{ id: string; name: string; plus?: boolean }>;
  max?: number;
};

export function AvatarGroup({ entries, max = 4 }: AvatarGroupProps) {
  const visibleEntries = entries.slice(0, max);
  const remaining = Math.max(0, entries.length - visibleEntries.length);

  return (
    <div className="avatar-group">
      {visibleEntries.map((entry) => (
        <Avatar compact key={entry.id} name={entry.name} plus={entry.plus} />
      ))}
      {remaining ? <span className="avatar-group__count">+{remaining}</span> : null}
    </div>
  );
}
