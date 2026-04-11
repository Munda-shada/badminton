"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { submitPlayerPaymentsAction } from "@/actions/ledger";
import { ClubModal } from "@/components/shared/ClubModal";
import { useToast } from "@/components/shared/ToastProvider";
import { getActionErrorMessage } from "@/lib/action-errors";
import { formatCurrency } from "@/lib/formatters";
import { queryKeys } from "@/lib/query-keys";

type DuePaymentItem = {
  id: string;
  amount: number;
  label: string;
};

export function PayPendingDialog({
  currentUserId,
  duePayments,
}: {
  currentUserId?: string;
  duePayments: DuePaymentItem[];
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>(duePayments.map((payment) => payment.id));
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const titleId = "pay-pending-title";

  const selectedTotal = useMemo(
    () =>
      duePayments
        .filter((payment) => selectedIds.includes(payment.id))
        .reduce((total, payment) => total + payment.amount, 0),
    [duePayments, selectedIds],
  );

  if (!duePayments.length) {
    return null;
  }

  const allSelected = selectedIds.length === duePayments.length;

  const close = () => {
    setOpen(false);
    setError(null);
  };

  return (
    <>
      <button className="secondary-button" onClick={() => setOpen(true)} type="button">
        Pay your pending
      </button>

      <ClubModal labelledBy={titleId} onClose={close} open={open}>
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Pending payments</p>
            <h3 id={titleId}>Submit payment request</h3>
          </div>
        </div>

        <form
          className="form-stack"
          onSubmit={async (event) => {
            event.preventDefault();
            setError(null);
            setPending(true);
            const form = event.currentTarget;
            const formData = new FormData(form);
            try {
              await submitPlayerPaymentsAction(formData);
              toast("Payment submitted for review");
              if (currentUserId) {
                await queryClient.invalidateQueries({ queryKey: queryKeys.playerClub(currentUserId) });
              }
              close();
              router.refresh();
            } catch (caught) {
              setError(getActionErrorMessage(caught));
            } finally {
              setPending(false);
            }
          }}
        >
          {error ? (
            <p className="form-error-inline" role="alert">
              {error}
            </p>
          ) : null}
          <label className="check-item">
            <input
              checked={allSelected}
              onChange={(event) =>
                setSelectedIds(event.target.checked ? duePayments.map((payment) => payment.id) : [])
              }
              type="checkbox"
            />
            <div>
              <strong>Select all</strong>
              <p className="subtle-copy">
                {selectedIds.length} selected · {formatCurrency(selectedTotal)}
              </p>
            </div>
          </label>

          <div className="status-card">
            {duePayments.map((payment) => {
              const checked = selectedIds.includes(payment.id);
              return (
                <label className="check-item" key={payment.id}>
                  <input
                    checked={checked}
                    name="paymentId"
                    onChange={(event) =>
                      setSelectedIds((current) =>
                        event.target.checked
                          ? [...current, payment.id]
                          : current.filter((entry) => entry !== payment.id),
                      )
                    }
                    type="checkbox"
                    value={payment.id}
                  />
                  <div>
                    <strong>{payment.label}</strong>
                    <p className="subtle-copy">{formatCurrency(payment.amount)}</p>
                  </div>
                </label>
              );
            })}
          </div>

          <label className="form-field">
            <span>Transaction ID</span>
            <input name="reference" placeholder="Enter transaction ID" required type="text" />
          </label>

          <div className="dialog-actions">
            <button className="secondary-button" onClick={close} type="button">
              Cancel
            </button>
            <button className="primary-button" disabled={!selectedIds.length || pending} type="submit">
              {pending ? "Submitting…" : `Paid ${formatCurrency(selectedTotal)}`}
            </button>
          </div>
        </form>
      </ClubModal>
    </>
  );
}
