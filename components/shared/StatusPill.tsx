import type { PropsWithChildren } from "react";

import { cn } from "@/lib/utils";

export function StatusPill({
  children,
  tone = "info",
}: PropsWithChildren<{ tone?: "positive" | "warning" | "danger" | "info" }>) {
  return <span className={cn("status-pill", `status-pill--${tone}`)}>{children}</span>;
}
