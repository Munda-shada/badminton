import { EmptyState } from "@/components/shared/EmptyState";
import { PageHero } from "@/components/shared/PageHero";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatCurrency, formatDateStamp, formatTime } from "@/lib/formatters";
import { loadPlayerClubDb } from "@/lib/club-db-cache";
import { getPastSessions, getPlayerHistory, PAYMENT_STATUS_META } from "@/lib/club-data";
import { requireClubUser } from "@/lib/club-auth";
import { getRequestNow } from "@/lib/request-time";

export default async function PlayerHistoryPage() {
  const { clubUser } = await requireClubUser({ allowRoles: ["admin", "player"] });
  const db = await loadPlayerClubDb(clubUser.id);
  const now = await getRequestNow();
  const history = getPlayerHistory(clubUser.id, db, now);
  const pastSessions = getPastSessions(db.sessions, now);

  return (
    <section className="screen-stack">
      <PageHero
        eyebrow="Match History"
        metrics={[
          { label: "Past sessions", value: pastSessions.length },
          {
            label: "Sessions joined",
            value: history.filter((entry) => entry.response.status !== "out").length,
          },
          {
            label: "Guest appearances",
            value: history.filter((entry) => entry.response.status === "plus").length,
          },
        ]}
        subtitle="Track attendance, locations, and how your previous RSVPs turned into court time."
        title="A running ledger of every past session."
      />

      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Recent sessions</p>
            <h3>Attendance timeline</h3>
          </div>
        </div>

        {history.length ? (
          <div className="history-list">
            {history.map((entry) => (
              <article className="history-card" key={entry.session.id}>
                <div className="history-card__header">
                  <div>
                    <p className="eyebrow">{formatDateStamp(entry.session.date)}</p>
                    <h4>{entry.session.title}</h4>
                    <p className="subtle-copy">
                      {entry.session.location} · {formatTime(entry.session.startTime)} to{" "}
                      {formatTime(entry.session.endTime)}
                    </p>
                  </div>
                  <StatusBadge status={entry.response.status} />
                </div>

                <div className="history-card__body">
                  <div>
                    <span className="label-line">Final roster</span>
                    <strong>{entry.roster.confirmedSlots} confirmed player spots</strong>
                  </div>
                  <div>
                    <span className="label-line">Payment</span>
                    <strong>
                      {entry.payment
                        ? `${formatCurrency(entry.payment.amount)} · ${PAYMENT_STATUS_META[entry.payment.status].label}`
                        : "No transaction"}
                    </strong>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState message="No historical sessions are available yet." />
        )}
      </section>
    </section>
  );
}
