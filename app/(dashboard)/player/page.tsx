import { EmptyState } from "@/components/shared/EmptyState";
import { PageHero } from "@/components/shared/PageHero";
import { GameCard } from "@/components/player/GameCard";
import { formatCurrency, formatDateLong, formatDuration, formatTime } from "@/lib/formatters";
import { loadPlayerClubDb } from "@/lib/club-db-cache";
import {
  getLockState,
  getUpcomingSessions,
  getUserPayments,
  getUserRsvp,
  getRoster,
} from "@/lib/club-data";
import { requireClubUser } from "@/lib/club-auth";
import { getRequestNow } from "@/lib/request-time";

export default async function PlayerDashboardPage() {
  const { clubUser } = await requireClubUser({ allowRoles: ["admin", "player"] });
  const db = await loadPlayerClubDb(clubUser.id);
  const now = await getRequestNow();
  const sessions = getUpcomingSessions(db.sessions, now);
  const featuredSession = sessions[0];
  const urgentSession = sessions.find((session) => {
    const lockState = getLockState(session, now);
    return !lockState.isLocked && lockState.remainingMs < 5 * 60 * 60 * 1000;
  });
  const payments = getUserPayments(clubUser.id, db);

  return (
    <section className="screen-stack">
      <PageHero
        eyebrow="Upcoming Polls"
        metrics={[
          { label: "Upcoming sessions", value: sessions.length },
          {
            label: "Your active RSVPs",
            value: sessions.filter((session) => {
              const response = getUserRsvp(session.id, clubUser.id, db);
              return response?.status && response.status !== "out";
            }).length,
          },
          {
            label: "Pending payments",
            value: formatCurrency(
              payments
                .filter((payment) => payment.status === "due")
                .reduce((total, payment) => total + payment.amount, 0),
            ),
          },
        ]}
        sidePanel={
          featuredSession ? (
            <div className="signal-card">
              <p className="eyebrow">Next lock</p>
              <h3>{featuredSession.location}</h3>
              <p className="subtle-copy">
                {formatDateLong(featuredSession.date)} · {formatTime(featuredSession.startTime)} to{" "}
                {formatTime(featuredSession.endTime)}
              </p>
              <strong className="signal-card__value">
                {getLockState(featuredSession, now).isLocked
                  ? "Roster Locked"
                  : `Locks in ${formatDuration(getLockState(featuredSession, now).remainingMs)}`}
              </strong>
            </div>
          ) : null
        }
        subtitle="Influence the next rally before the lock hits."
        title="Influence the next rally before the lock hits."
      />

      <div className="dashboard-grid">
        <section className="panel panel--main">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Match Polls</p>
              <h3>Upcoming sessions</h3>
            </div>
            <span className="panel-caption">
              {sessions.length} live card{sessions.length === 1 ? "" : "s"}
            </span>
          </div>

          {sessions.length ? (
            <div className="session-feed">
              {sessions.map((session) => (
                <GameCard
                  currentStatus={getUserRsvp(session.id, clubUser.id, db)?.status}
                  currentUserId={clubUser.id}
                  key={session.id}
                  roster={getRoster(session, db)}
                  session={session}
                />
              ))}
            </div>
          ) : (
            <EmptyState message="No sessions are live yet." />
          )}
        </section>

        <aside className="panel panel--side">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Last Call</p>
              <h3>Urgent vote</h3>
            </div>
          </div>

          {urgentSession ? (
            <div className="signal-card signal-card--urgent">
              <p className="eyebrow">Last call</p>
              <h3>{urgentSession.title}</h3>
              <p className="subtle-copy">
                {urgentSession.location} · {formatDateLong(urgentSession.date)}
              </p>
              <strong className="signal-card__value">
                {formatDuration(getLockState(urgentSession, now).remainingMs)}
              </strong>
              <span className="subtle-copy">remaining until the roster freeze.</span>
            </div>
          ) : (
            <EmptyState message="No session is close to the freeze window yet." />
          )}
        </aside>
      </div>
    </section>
  );
}
