"use client";

import { useQueryClient } from "@tanstack/react-query";
import { startTransition, useState } from "react";

import { submitRsvpAction } from "@/actions/rsvps";
import { useToast } from "@/components/shared/ToastProvider";
import { getActionErrorMessage } from "@/lib/action-errors";
import { STATUS_META } from "@/lib/club-data";
import { queryKeys } from "@/lib/query-keys";
import { cn } from "@/lib/utils";
import type { ClubDb } from "@/types";
import type { RsvpStatus } from "@/types";

function patchClubDbRsvp(
  db: ClubDb,
  sessionId: string,
  userId: string,
  status: RsvpStatus,
): ClubDb {
  const updatedAt = new Date().toISOString();
  const index = db.rsvps.findIndex((row) => row.sessionId === sessionId && row.userId === userId);

  if (index >= 0) {
    const next = [...db.rsvps];
    next[index] = { ...next[index], status, updatedAt };
    return { ...db, rsvps: next };
  }

  return {
    ...db,
    rsvps: [
      ...db.rsvps,
      {
        id: `optimistic-${sessionId}-${userId}`,
        sessionId,
        userId,
        status,
        updatedAt,
      },
    ],
  };
}

export function RsvpControls({
  currentUserId,
  currentStatus,
  isLocked,
  sessionId,
}: {
  currentUserId: string;
  currentStatus?: RsvpStatus;
  isLocked: boolean;
  sessionId: string;
}) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [pendingStatus, setPendingStatus] = useState<RsvpStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const activeStatus = pendingStatus || currentStatus;
  const queryKey = queryKeys.playerClub(currentUserId);

  const handleClick = (status: RsvpStatus) => {
    if (isLocked || pendingStatus) {
      return;
    }

    setError(null);
    setPendingStatus(status);

    const previous = queryClient.getQueryData<ClubDb>(queryKey);
    if (previous) {
      queryClient.setQueryData(queryKey, patchClubDbRsvp(previous, sessionId, currentUserId, status));
    }

    startTransition(() => {
      void submitRsvpAction({ sessionId, status })
        .then(() => {
          toast("RSVP saved");
          void queryClient.invalidateQueries({ queryKey });
        })
        .catch((caught: unknown) => {
          if (previous) {
            queryClient.setQueryData(queryKey, previous);
          }
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
