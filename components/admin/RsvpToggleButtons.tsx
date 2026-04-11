"use client";

import { useFormStatus } from "react-dom";

import { STATUS_META } from "@/lib/club-data";
import type { RsvpStatus } from "@/types";

const RSVP_STATES: RsvpStatus[] = ["in", "tentative", "plus", "out"];

export function RsvpToggleButtons({ currentStatus }: { currentStatus: RsvpStatus }) {
  const { pending } = useFormStatus();

  return (
    <>
      {pending ? <span className="subtle-copy roster-pending-hint">Updating roster…</span> : null}
      {RSVP_STATES.map((status) => (
        <button
          className={`status-toggle ${currentStatus === status ? "is-active" : ""}`}
          disabled={currentStatus === status || pending}
          key={status}
          name="status"
          type="submit"
          value={status}
        >
          {STATUS_META[status].label}
        </button>
      ))}
    </>
  );
}
