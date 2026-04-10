export function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function buildSessionDate(dateString: string, timeString: string) {
  return new Date(`${dateString}T${timeString}:00`);
}

export function generateId(prefix: string) {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export function generateInviteCode() {
  const left = ["COURT", "SMASH", "RALLY", "SPIN", "DROP", "SERVE"];
  const right = ["LITE", "LOCK", "ACE", "NET", "LINE", "PLAY"];

  return `${sample(left)}-${sample(right)}-${Math.floor(Math.random() * 90) + 10}`;
}

export function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export function getAvatarTone(name: string) {
  let hash = 0;

  for (let index = 0; index < name.length; index += 1) {
    hash = name.charCodeAt(index) + ((hash << 5) - hash);
  }

  const hue = Math.abs(hash % 360);
  return `linear-gradient(135deg, hsl(${hue} 86% 70%), hsl(${(hue + 44) % 360} 88% 58%))`;
}

export function matchesQuery(query: string, ...values: Array<string | number | null | undefined>) {
  if (!query) {
    return true;
  }

  return values.some((value) => String(value || "").toLowerCase().includes(query));
}

export function normalizeTime(value: string | null | undefined) {
  return typeof value === "string" ? value.slice(0, 5) : "";
}

export function toTimestamp(value: number | string | Date) {
  return typeof value === "number" ? value : new Date(value).getTime();
}

export function shiftDays(date: Date, amount: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

export function formatDateInput(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function sample(list: string[]) {
  return list[Math.floor(Math.random() * list.length)];
}
