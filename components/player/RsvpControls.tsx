"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";

import { submitRsvpAction } from "@/actions/rsvps";
import { STATUS_META } from "@/lib/club-data";
import { getActionErrorMessage } from "@/lib/action-errors";
import { cn } from "@/lib/utils";
import type { RsvpStatus } from "@/types";

export function RsvpControls({
  currentStatus,
  isLocked,
  sessionId,
}: {
  currentStatus?: RsvpStatus;
  isLocked: boolean;
  sessionId: string;
}) {
  const router = useRouter();
  const [pendingStatus, setPendingStatus] = useState<RsvpStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const activeStatus = pendingStatus || currentStatus;

  const handleClick = (status: RsvpStatus) => {
    if (isLocked || pendingStatus) {
      return;
    }

    setError(null);
    setPendingStatus(status);

    startTransition(() => {
      void submitRsvpAction({ sessionId, status })
        .then(() => {
          router.refresh();
        })
        .catch((caught: unknown) => {
          setError(getActionErrorMessage(caught));
        })
        .finally(() => {
          setPendingStatus(null);
        });
    });
  };

  return (
    <div className="rsvp-stack">
      {error ? (
        <p className="form-error-inline" role="alert">
          {error}
        </p>
      ) : null}
      <div className="rsvp-grid">
        {Object.entries(STATUS_META).map(([key, meta]) => {
          const status = key as RsvpStatus;
          const isActive = activeStatus === status;

          return (
            <button
              className={cn(
                "rsvp-button",
                isActive && "is-active",
                isActive && status === "out" && "is-out",
              )}
              disabled={isLocked || Boolean(pendingStatus)}
              key={status}
              onClick={() => handleClick(status)}
              type="button"
            >
              <strong>{meta.label}</strong>
              <span>{pendingStatus === status ? "Saving..." : meta.hint}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
