import type { ReactNode } from "react";

import { formatCurrency, formatRelativeDate } from "@/lib/formatters";
import { PAYMENT_STATUS_META } from "@/lib/club-data";

import { StatusPill } from "@/components/shared/StatusPill";

export function PaymentRow({
  amount,
  date,
  note,
  sessionLabel,
  status,
  actions,
}: {
  amount: number;
  date: string;
  note: string;
  sessionLabel: string;
  status: "paid" | "due" | "credit" | "pending";
  actions?: ReactNode;
}) {
  const meta = PAYMENT_STATUS_META[status];

  return (
    <article className="payment-row">
      <div>
        <p className="eyebrow">{formatRelativeDate(date)}</p>
        <h4>{sessionLabel}</h4>
        <p className="subtle-copy">{note}</p>
      </div>
      <div className="payment-row__meta">
        <strong>{formatCurrency(amount)}</strong>
        <StatusPill tone={meta.tone as "positive" | "warning" | "info"}>{meta.label}</StatusPill>
        {actions}
      </div>
    </article>
  );
}
