import { getAvatarTone, getInitials } from "@/lib/utils";
import { cn } from "@/lib/utils";

type AvatarProps = {
  name: string;
  compact?: boolean;
  large?: boolean;
  plus?: boolean;
};

export function Avatar({ compact = false, large = false, name, plus = false }: AvatarProps) {
  const initials = getInitials(name);
  const tone = getAvatarTone(name);

  if (plus) {
    return (
      <div className={cn("avatar-stack", compact && "is-compact", large && "is-large")}>
        <span
          className={cn("avatar", compact && "is-compact", large && "is-large")}
          style={{ background: tone }}
        >
          {initials}
        </span>
        <span
          className={cn(
            "avatar",
            "avatar--guest",
            compact && "is-compact",
            large && "is-large",
          )}
        >
          +1
        </span>
      </div>
    );
  }

  return (
    <span
      className={cn("avatar", compact && "is-compact", large && "is-large")}
      style={{ background: tone }}
    >
      {initials}
    </span>
  );
}
