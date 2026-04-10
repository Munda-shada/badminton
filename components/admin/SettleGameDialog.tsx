"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { settleGameAction } from "@/actions/ledger";
import { ClubModal } from "@/components/shared/ClubModal";
import { getActionErrorMessage } from "@/lib/action-errors";
import { formatCurrency, formatDateLong, formatTime } from "@/lib/formatters";
import type { ClubSession } from "@/types";

export function SettleGameDialog({
  session,
  confirmedSlots,
}: {
  session: ClubSession;
  confirmedSlots: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const titleId = `settle-${session.id}`;

  const close = () => {
    setOpen(false);
    setError(null);
  };

  return (
    <>
      <button className="secondary-button" onClick={() => setOpen(true)} type="button">
        Settle game
      </button>

      <ClubModal labelledBy={titleId} onClose={close} open={open}>
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Settle game</p>
            <h3 id={titleId}>{session.title}</h3>
            <p className="subtle-copy">
              {formatDateLong(session.date)} · {formatTime(session.startTime)} to{" "}
              {formatTime(session.endTime)}
            </p>
          </div>
        </div>

        <form
          className="form-stack"
          onSubmit={async (event) => {
            event.preventDefault();
            setError(null);
            setIsPending(true);
            const formData = new FormData(event.currentTarget);
            try {
              await settleGameAction(formData);
              close();
              router.refresh();
            } catch (caught) {
              setError(getActionErrorMessage(caught));
            } finally {
              setIsPending(false);
            }
          }}
        >
          <input name="sessionId" type="hidden" value={session.id} />
          {error ? (
            <p className="form-error-inline" role="alert">
              {error}
            </p>
          ) : null}
          <label className="form-field">
            <span>Cost per player</span>
            <input
              defaultValue={session.costPerPlayer ? String(session.costPerPlayer) : ""}
              min="1"
              name="costPerPlayer"
              required
              type="number"
            />
            <small>
              {confirmedSlots
                ? session.costPerPlayer
                  ? `This will charge ${confirmedSlots} confirmed slot${
                      confirmedSlots === 1 ? "" : "s"
                    } for an estimated ${formatCurrency(session.costPerPlayer)} each.`
                  : `This will charge ${confirmedSlots} confirmed slot${
                      confirmedSlots === 1 ? "" : "s"
                    } once you save the final rate.`
                : "No confirmed players yet. Charges will appear once slots are confirmed."}
            </small>
          </label>
          <label className="form-field">
            <span>Ledger note</span>
            <input
              defaultValue={
                session.costPerPlayer
                  ? `Settled for ${formatCurrency(session.costPerPlayer)} per player`
                  : ""
              }
              name="note"
              placeholder="Settled court cost"
              type="text"
            />
          </label>
          <div className="dialog-actions">
            <button className="secondary-button" onClick={close} type="button">
              Cancel
            </button>
            <button className="primary-button" disabled={isPending} type="submit">
              {isPending ? "Settling..." : "Save settlement"}
            </button>
          </div>
        </form>
      </ClubModal>
    </>
  );
}
