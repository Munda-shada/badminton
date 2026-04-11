"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { markPaymentPaidAction } from "@/actions/ledger";
import { useToast } from "@/components/shared/ToastProvider";
import { getActionErrorMessage } from "@/lib/action-errors";

export function MarkPaymentPaidForm({ paymentId }: { paymentId: string }) {
  const router = useRouter();
  const toast = useToast();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <form
      className="mark-paid-form"
      onSubmit={async (event) => {
        event.preventDefault();
        setError(null);
        setPending(true);
        const formData = new FormData(event.currentTarget);
        try {
          await markPaymentPaidAction(formData);
          toast("Payment approved");
          router.refresh();
        } catch (caught) {
          setError(getActionErrorMessage(caught));
        } finally {
          setPending(false);
        }
      }}
    >
      <input name="paymentId" type="hidden" value={paymentId} />
      {error ? (
        <p className="form-error-inline" role="alert">
          {error}
        </p>
      ) : null}
      <button className="secondary-button secondary-button--small" disabled={pending} type="submit">
        {pending ? "Approving…" : "Approve"}
      </button>
    </form>
  );
}
