import Link from "next/link";

import { AvatarGroup } from "@/components/shared/AvatarGroup";
import { EmptyState } from "@/components/shared/EmptyState";
import { InfoChip } from "@/components/shared/InfoChip";
import { StatusPill } from "@/components/shared/StatusPill";
import {
  formatCurrency,
  formatDateLong,
  formatDuration,
  formatOptionalCurrency,
  formatTime,
} from "@/lib/formatters";
import { loadAdminClubDb } from "@/lib/club-db-cache";
import { getAdminStats, getLockState, getRoster, getUpcomingSessions } from "@/lib/club-data";
import { requireClubUser } from "@/lib/club-auth";
import { getRequestNow } from "@/lib/request-time";

export default async function AdminDashboardPage() {
  await requireClubUser({ allowRoles: ["admin"] });
  const db = await loadAdminClubDb();
  const now = await getRequestNow();
  const sessions = getUpcomingSessions(db.sessions, now);
  const adminStats = getAdminStats(db, now);
  const nextSession = sessions[0];
  const nextRoster = nextSession ? getRoster(nextSession, db) : null;
  const nextLockState = nextSession ? getLockState(nextSession, now) : null;
  const openInvites = db.invites.filter((invite) => !invite.usedBy).length;
  const pendingApprovals = db.users.filter((user) => !user.approved || user.role === "pending").length;
  const pendingCostCount = sessions.filter((session) => session.costPerPlayer <= 0).length;

  return (
    <section className="screen-stack admin-hub">
      <header className="admin-hub__header">
        <div>
          <p className="eyebrow">Admin dashboard</p>
          <h2>Club operations at a glance</h2>
          <p className="panel-copy">
            Stay on top of the next session, open polls, pending approvals, and collections
            without bouncing between screens.
          </p>
        </div>

        <div className="admin-hub__actions">
          <Link className="primary-button" href="/admin/games">
            Manage polls
          </Link>
          <Link className="secondary-button" href="/admin/ledger">
            Review ledger
          </Link>
          <Link className="secondary-button" href="/admin/members">
            Members
          </Link>
        </div>
      </header>

      <section className="admin-overview">
        <article className="admin-focus-card">
          {nextSession && nextRoster && nextLockState ? (
            <>
              <div className="admin-focus-card__header">
                <div>
                  <p className="eyebrow">Next session</p>
                  <h3>{nextSession.title}</h3>
                  <p className="subtle-copy">
                    {formatDateLong(nextSession.date)} · {formatTime(nextSession.startTime)} to{" "}
                    {formatTime(nextSession.endTime)} · {nextSession.location}
                  </p>
                </div>
                <StatusPill
                  tone={
                    nextLockState.isLocked
                      ? "warning"
                      : nextRoster.waitlist.length
                        ? "danger"
                        : "positive"
                  }
                >
                  {nextLockState.isLocked
                    ? "Roster locked"
                    : `Locks in ${formatDuration(nextLockState.remainingMs)}`}
                </StatusPill>
              </div>

              <div className="admin-focus-card__stats">
                <InfoChip label="Confirmed" value={`${nextRoster.confirmedSlots}/${nextSession.maxPlayers}`} />
                <InfoChip label="Courts" value={nextSession.courtsBooked} />
                <InfoChip label="Waitlist" value={nextRoster.waitlist.length} />
                <InfoChip label="Cost" value={formatOptionalCurrency(nextSession.costPerPlayer)} />
              </div>

              <div className="progress-cluster">
                <div className="progress-cluster__head">
                  <span>{nextRoster.confirmedSlots} players committed</span>
                  <span>{nextRoster.remainingSlots} spots still open</span>
                </div>
                <div className="progress-track">
                  <div
                    className={`progress-fill ${
                      nextRoster.confirmedSlots / Math.max(1, nextSession.maxPlayers) > 0.84
                        ? "is-hot"
                        : ""
                    }`}
                    style={{
                      width: `${Math.min(
                        100,
                        Math.round(
                          (nextRoster.confirmedSlots / Math.max(1, nextSession.maxPlayers)) * 100,
                        ),
                      )}%`,
                    }}
                  />
                </div>
              </div>

              <div className="admin-focus-card__footer">
                <div>
                  <span className="label-line">Visible lineup</span>
                  <AvatarGroup
                    entries={nextRoster.confirmed.map((entry) => ({
                      id: entry.id,
                      name: entry.user.name,
                      plus: entry.status === "plus",
                    }))}
                    max={5}
                  />
                </div>

                <div className="admin-focus-card__footer-actions">
                  <Link className="secondary-button secondary-button--small" href="/admin/games">
                    Open poll manager
                  </Link>
                  <Link className="secondary-button secondary-button--small" href="/admin/ledger">
                    Update charges
                  </Link>
                </div>
              </div>
            </>
          ) : (
            <EmptyState message="No upcoming sessions are published yet." />
          )}
        </article>

        <aside className="admin-overview__rail">
          <article className="admin-summary-card">
            <span>Live polls</span>
            <strong>{adminStats.sessions}</strong>
            <p className="subtle-copy">Open session cards currently visible to players.</p>
          </article>
          <article className="admin-summary-card">
            <span>Pending collections</span>
            <strong>{formatCurrency(adminStats.pending)}</strong>
            <p className="subtle-copy">Outstanding dues across all live and recent sessions.</p>
          </article>
          <article className="admin-summary-card">
            <span>Needs attention</span>
            <strong>{pendingApprovals + pendingCostCount + adminStats.waitlisted}</strong>
            <p className="subtle-copy">
              {pendingApprovals} approvals, {pendingCostCount} unset costs, {adminStats.waitlisted} waitlisted.
            </p>
          </article>
        </aside>
      </section>

      <div className="admin-dashboard-grid">
        <section className="panel panel--main">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Schedule board</p>
              <h3>Upcoming polls from the database</h3>
              <p className="panel-copy">
                Open every live poll, edit courts and cost, or override player RSVP status from the
                poll manager.
              </p>
            </div>
            <Link className="secondary-button secondary-button--small" href="/admin/games">
              Open poll manager
            </Link>
          </div>

          {sessions.length ? (
            <div className="admin-session-list admin-session-list--board">
              {sessions.map((session) => {
                const roster = getRoster(session, db);
                const lockState = getLockState(session, now);

                return (
                  <article className="admin-session-row admin-session-row--board" key={session.id}>
                    <div className="admin-session-row__date">
                      <span>{new Date(`${session.date}T00:00:00`).toLocaleString(undefined, { month: "short" })}</span>
                      <strong>{new Date(`${session.date}T00:00:00`).getDate()}</strong>
                    </div>

                    <div className="admin-session-row__main">
                      <div>
                        <h4>{session.title}</h4>
                        <p className="subtle-copy">
                          {session.location} · {formatTime(session.startTime)} to{" "}
                          {formatTime(session.endTime)}
                        </p>
                      </div>
                      <AvatarGroup
                        entries={roster.confirmed.map((entry) => ({
                          id: entry.id,
                          name: entry.user.name,
                          plus: entry.status === "plus",
                        }))}
                      />
                    </div>

                    <div className="admin-session-row__stats admin-session-row__stats--board">
                      <InfoChip label="Fill" value={`${roster.confirmedSlots}/${session.maxPlayers}`} />
                      <InfoChip label="Courts" value={session.courtsBooked} />
                      <InfoChip label="Cost" value={formatOptionalCurrency(session.costPerPlayer)} />
                      <StatusPill
                        tone={lockState.isLocked ? "warning" : roster.waitlist.length ? "danger" : "info"}
                      >
                        {lockState.isLocked
                          ? "Locked"
                          : roster.waitlist.length
                            ? `${roster.waitlist.length} waitlist`
                            : `Locks in ${formatDuration(lockState.remainingMs)}`}
                      </StatusPill>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <EmptyState message="No upcoming sessions are published yet." />
          )}
        </section>

        <aside className="panel panel--side">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Operations</p>
              <h3>Quick signals</h3>
            </div>
          </div>

          <div className="admin-ops-list">
            <article className="admin-ops-card">
              <span>Collected so far</span>
              <strong>{formatCurrency(adminStats.collected)}</strong>
              <p className="subtle-copy">Marked paid or cleared through credit.</p>
            </article>

            <article className="admin-ops-card">
              <span>Open invite codes</span>
              <strong>{openInvites}</strong>
              <p className="subtle-copy">Unused access codes still available for the group.</p>
            </article>

            <article className="admin-ops-card">
              <span>Pending approvals</span>
              <strong>{pendingApprovals}</strong>
              <p className="subtle-copy">New Google sign-ins waiting for admin approval.</p>
            </article>
          </div>
        </aside>
      </div>
    </section>
  );
}
