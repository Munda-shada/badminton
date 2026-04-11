import { Suspense } from "react";

import { updateGameDetailsAction } from "@/actions/games";
import { adminOverrideRsvpAction } from "@/actions/rsvps";
import { GameForm } from "@/components/admin/GameForm";
import { RsvpToggleButtons } from "@/components/admin/RsvpToggleButtons";
import { Avatar } from "@/components/shared/Avatar";
import { SubmitButton } from "@/components/shared/SubmitButton";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageContentSkeleton } from "@/components/shared/PageContentSkeleton";
import { PageHero } from "@/components/shared/PageHero";
import { StatusPill } from "@/components/shared/StatusPill";
import {
  formatDateLong,
  formatDuration,
  formatOptionalCurrency,
  formatTime,
} from "@/lib/formatters";
import { loadAdminClubDb } from "@/lib/club-db-cache";
import { getLockState, getRoster, getUpcomingSessions, STATUS_META } from "@/lib/club-data";
import { requireClubUser } from "@/lib/club-auth";
import { getRequestNow } from "@/lib/request-time";
import type { ClubRosterEntry, RsvpStatus } from "@/types";

export default function AdminGamesPage() {
  return (
    <Suspense fallback={<PageContentSkeleton label="Checking access" />}>
      <AdminGamesShell />
    </Suspense>
  );
}

async function AdminGamesShell() {
  await requireClubUser({ allowRoles: ["admin"] });
  return (
    <Suspense fallback={<PageContentSkeleton label="Loading games" />}>
      <AdminGamesWithData />
    </Suspense>
  );
}

async function AdminGamesWithData() {
  const db = await loadAdminClubDb();
  const now = await getRequestNow();
  const sessions = getUpcomingSessions(db.sessions, now);
  const waitlistedTotal = sessions.reduce((total, session) => total + getRoster(session, db).waitlist.length, 0);
  const pendingCostCount = sessions.filter((session) => session.costPerPlayer <= 0).length;

  return (
    <section className="screen-stack">
      <PageHero
        eyebrow="Poll Control"
        metrics={[
          { label: "Open polls", value: sessions.length },
          { label: "Waitlisted slots", value: waitlistedTotal },
          { label: "Costs to assign", value: pendingCostCount },
        ]}
        subtitle="Create sessions, edit courts and cost later, and move players between RSVP states without leaving the admin workspace."
        title="Open polls and roster control."
      />

      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">New poll</p>
            <h3>Create the next badminton session</h3>
            <p className="panel-copy">
              Cost per player is optional during creation. You can publish the poll first and settle
              the charges later from this same board.
            </p>
          </div>
        </div>
        <GameForm />
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Open polls</p>
            <h3>Live database sessions</h3>
            <p className="panel-copy">
              Every active poll below is loaded from the database and stays editable from the UI.
            </p>
          </div>
          <span className="panel-caption">
            {sessions.length} open poll{sessions.length === 1 ? "" : "s"}
          </span>
        </div>

        {sessions.length ? (
          <div className="poll-manager-list">
            {sessions.map((session, index) => {
              const roster = getRoster(session, db);
              const lockState = getLockState(session, now);
              const rosterEntries = [
                ...roster.confirmed.map((entry) => ({ entry, waitlisted: false })),
                ...roster.waitlist.map((entry) => ({ entry, waitlisted: true })),
                ...roster.tentative.map((entry) => ({ entry, waitlisted: false })),
                ...roster.out.map((entry) => ({ entry, waitlisted: false })),
              ];

              return (
                <details className="poll-manager-card" key={session.id} open={index === 0}>
                  <summary className="poll-manager-card__summary">
                    <div className="poll-manager-card__summary-main">
                      <p className="eyebrow">{formatDateLong(session.date)}</p>
                      <h3>{session.title}</h3>
                      <p className="subtle-copy">
                        {session.location} · {formatTime(session.startTime)} to {formatTime(session.endTime)}
                      </p>
                    </div>

                    <div className="poll-manager-card__summary-stats">
                      <div className="poll-manager-stat">
                        <span>Confirmed</span>
                        <strong>
                          {roster.confirmedSlots}/{session.maxPlayers}
                        </strong>
                      </div>
                      <div className="poll-manager-stat">
                        <span>Courts</span>
                        <strong>{session.courtsBooked}</strong>
                      </div>
                      <div className="poll-manager-stat">
                        <span>Cost</span>
                        <strong>{formatOptionalCurrency(session.costPerPlayer)}</strong>
                      </div>
                      <StatusPill
                        tone={
                          roster.waitlist.length ? "danger" : lockState.isLocked ? "warning" : "info"
                        }
                      >
                        {lockState.isLocked
                          ? "Roster locked"
                          : `Locks in ${formatDuration(lockState.remainingMs)}`}
                      </StatusPill>
                    </div>
                  </summary>

                  <div className="poll-manager-card__body">
                    <section className="poll-editor">
                      <div className="poll-editor__head">
                        <div>
                          <p className="eyebrow">Poll details</p>
                          <h4>Edit schedule and pricing</h4>
                        </div>
                        <StatusPill tone={session.costPerPlayer > 0 ? "positive" : "warning"}>
                          {session.costPerPlayer > 0 ? "Cost live" : "Cost pending"}
                        </StatusPill>
                      </div>

                      <form action={updateGameDetailsAction} className="form-grid">
                        <input name="sessionId" type="hidden" value={session.id} />
                        <Field
                          className="is-wide"
                          defaultValue={session.title}
                          label="Poll title"
                          name="title"
                        />
                        <Field defaultValue={session.date} label="Date" name="date" type="date" />
                        <Field
                          defaultValue={session.startTime}
                          label="Start time"
                          name="startTime"
                          type="time"
                        />
                        <Field
                          defaultValue={session.endTime}
                          label="End time"
                          name="endTime"
                          type="time"
                        />
                        <Field
                          defaultValue={String(session.courtsBooked)}
                          label="Courts booked"
                          min="1"
                          name="courtsBooked"
                          type="number"
                        />
                        <Field
                          defaultValue={String(session.maxPlayers)}
                          label="Max players"
                          min="2"
                          name="maxPlayers"
                          type="number"
                        />
                        <Field
                          className="is-wide"
                          defaultValue={session.location}
                          label="Location"
                          name="location"
                        />
                        <Field
                          className="is-wide"
                          defaultValue={session.mapLink}
                          label="Google Maps link"
                          name="mapLink"
                          required={false}
                          type="url"
                        />
                        <Field
                          defaultValue={session.costPerPlayer ? String(session.costPerPlayer) : ""}
                          hint="Leave blank to keep the poll open without charges. Saving a value updates every confirmed player ledger row."
                          label="Cost per player"
                          min="0"
                          name="costPerPlayer"
                          required={false}
                          type="number"
                        />
                        <div className="form-actions is-wide">
                          <SubmitButton className="primary-button" pendingLabel="Saving poll…" type="submit">
                            Save poll changes
                          </SubmitButton>
                        </div>
                      </form>
                    </section>

                    <section className="poll-roster-panel">
                      <div className="poll-editor__head">
                        <div>
                          <p className="eyebrow">Roster control</p>
                          <h4>Move players between states</h4>
                        </div>
                        {roster.waitlist.length ? (
                          <StatusPill tone="danger">{roster.waitlist.length} on waitlist</StatusPill>
                        ) : (
                          <StatusPill tone="positive">{roster.remainingSlots} spots open</StatusPill>
                        )}
                      </div>

                      {rosterEntries.length ? (
                        <div className="poll-roster-list">
                          {rosterEntries.map(({ entry, waitlisted }) => (
                            <RosterRow
                              entry={entry}
                              key={entry.id}
                              sessionId={session.id}
                              waitlisted={waitlisted}
                            />
                          ))}
                        </div>
                      ) : (
                        <EmptyState message="No RSVPs yet on this poll." />
                      )}
                    </section>
                  </div>
                </details>
              );
            })}
          </div>
        ) : (
          <EmptyState message="Publish a session to see the live poll manager here." />
        )}
      </section>
    </section>
  );
}

function RosterRow({
  entry,
  sessionId,
  waitlisted,
}: {
  entry: ClubRosterEntry;
  sessionId: string;
  waitlisted: boolean;
}) {
  return (
    <article className="poll-roster-row">
      <div className="poll-roster-row__identity">
        <Avatar compact name={entry.user.name} plus={entry.status === "plus"} />
        <div>
          <strong>{entry.status === "plus" ? `${entry.user.name} +1` : entry.user.name}</strong>
          <div className="poll-roster-row__meta">
            <StatusPill tone={waitlisted ? "danger" : toneForStatus(entry.status)}>
              {STATUS_META[entry.status].shortLabel}
            </StatusPill>
            {waitlisted ? <StatusPill tone="warning">Waitlist</StatusPill> : null}
          </div>
        </div>
      </div>

      <form action={adminOverrideRsvpAction} className="status-toggle-group">
        <input name="sessionId" type="hidden" value={sessionId} />
        <input name="userId" type="hidden" value={entry.userId} />
        <RsvpToggleButtons currentStatus={entry.status} />
      </form>
    </article>
  );
}

function Field({
  className = "",
  defaultValue,
  hint,
  label,
  min,
  name,
  required = true,
  type = "text",
}: {
  className?: string;
  defaultValue?: string;
  hint?: string;
  label: string;
  min?: string;
  name: string;
  required?: boolean;
  type?: string;
}) {
  return (
    <label className={`form-field ${className}`}>
      <span>{label}</span>
      <input
        defaultValue={defaultValue}
        min={min}
        name={name}
        required={required}
        type={type}
      />
      {hint ? <small>{hint}</small> : null}
    </label>
  );
}

function toneForStatus(status: RsvpStatus): "positive" | "warning" | "info" {
  if (status === "in" || status === "plus") {
    return "positive";
  }

  if (status === "tentative") {
    return "warning";
  }

  return "info";
}
