import { STATUS_META } from "@/lib/club-data";
import type { RsvpStatus } from "@/types";

import { StatusPill } from "@/components/shared/StatusPill";

export function StatusBadge({ status }: { status: RsvpStatus }) {
  const tone = status === "out" ? "danger" : status === "tentative" ? "warning" : "positive";
  return <StatusPill tone={tone}>{STATUS_META[status].shortLabel}</StatusPill>;
}
