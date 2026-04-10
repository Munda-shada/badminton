"use client";

import { useEffect, useState } from "react";

import { Avatar } from "@/components/shared/Avatar";
import { AvatarGroup } from "@/components/shared/AvatarGroup";
import { InfoChip } from "@/components/shared/InfoChip";
import { StatusPill } from "@/components/shared/StatusPill";
import {
  formatDateLong,
  formatDuration,
  formatOptionalCurrency,
  formatTime,
} from "@/lib/formatters";
import { getLockState, STATUS_META } from "@/lib/club-data";
import type { ClubRoster, ClubSession, RsvpStatus } from "@/types";

import { RsvpControls } from "@/components/player/RsvpControls";

export function GameCard({
  currentStatus,
  currentUserId,
  roster,
  session,
}: {
  currentStatus?: RsvpStatus;
  currentUserId: string;
  roster: ClubRoster;
  session: ClubSession;
}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  const lockState = getLockState(session, now);
  const progress = Math.min(100, Math.round((roster.confirmedSlots / session.maxPlayers) * 100));
  const isWaitlisted = roster.waitlist.some((entry) => entry.user.id === currentUserId);

  return (
    <article className="session-card">
      <div className="session-card__header">
        <div>
          <p className="eyebrow">{formatDateLong(session.date)}</p>
          <h4>{session.title}</h4>
          <p className="subtle-copy">
            {session.location} · {formatTime(session.startTime)} to {formatTime(session.endTime)}
          </p>
        </div>
        <div className="session-card__pills">
          <StatusPill tone={lockState.isLocked ? "warning" : "info"}>
            {lockState.isLocked ? "Roster locked" : `${roster.remainingSlots} spots left`}
          </StatusPill>
          {roster.waitlist.length ? (
            <StatusPill tone="danger">{roster.waitlist.length} waitlist</StatusPill>
          ) : null}
        </div>
      </div>

      <div className="session-card__meta">
        <InfoChip label="Courts" value={session.courtsBooked} />
        <InfoChip label="Cost" value={formatOptionalCurrency(session.costPerPlayer)} />
        <InfoChip label="Capacity" value={`${roster.confirmedSlots}/${session.maxPlayers}`} />
      </div>

      <div className="progress-cluster">
        <div className="progress-cluster__head">
          <span>{roster.confirmedSlots}/{session.maxPlayers} players confirmed</span>
          <span>
            {lockState.isLocked ? "Roster frozen" : `Locks in ${formatDuration(lockState.remainingMs)}`}
          </span>
        </div>
        <div className="progress-track">
          <div className={`progress-fill ${progress > 84 ? "is-hot" : ""}`} style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="session-card__social">
        <div>
          <span className="label-line">Visible roster</span>
          <AvatarGroup
            entries={roster.confirmed.map((entry) => ({
              id: entry.id,
              name: entry.user.name,
              plus: entry.status === "plus",
            }))}
          />
        </div>
        <div className="subtle-copy">
          {lockState.isLocked
            ? "This roster is frozen and now read-only."
            : ""}
        </div>
      </div>

      <RsvpControls currentStatus={currentStatus} isLocked={lockState.isLocked} sessionId={session.id} />

      <div className="notice-card">
        {isWaitlisted
          ? "You are currently on the waitlist. If a spot opens, the group can see the promotion immediately."
          : lockState.isLocked
            ? "This session is locked, so the final lineup is now fixed."
            : "The waitlist turns on automatically once the player cap is full."}
      </div>

      {session.mapLink ? (
        <a className="inline-link" href={session.mapLink} rel="noreferrer" target="_blank">
          Open Google Maps
        </a>
      ) : null}

      <div className="roster-grid">
        <RosterColumn count={roster.confirmedSlots} entries={roster.confirmed} title="Confirmed" />
        <RosterColumn entries={roster.waitlist} title="Waitlist" />
        <RosterColumn entries={roster.tentative} title="Tentative" />
        <RosterColumn entries={roster.out} title="Out" />
      </div>
    </article>
  );
}

function RosterColumn({
  count,
  entries,
  title,
}: {
  count?: number;
  entries: ClubRoster["confirmed"];
  title: string;
}) {
  const displayCount = count ?? entries.length;

  return (
    <section className="roster-column">
      <div className="roster-column__head">
        <h5>{title}</h5>
        <span>{displayCount}</span>
      </div>
      {entries.length ? (
        <div className="roster-list">
          {entries.map((entry) => (
            <div className="roster-list__item" key={entry.id}>
              <Avatar compact name={entry.user.name} plus={entry.status === "plus"} />
              <div>
                <strong>{entry.status === "plus" ? `${entry.user.name} +1` : entry.user.name}</strong>
                <span>{STATUS_META[entry.status].shortLabel}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <span className="subtle-copy">No players yet.</span>
      )}
    </section>
  );
}
