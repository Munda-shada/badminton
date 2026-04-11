"use client";

import { EmptyState } from "@/components/shared/EmptyState";
import { PageContentSkeleton } from "@/components/shared/PageContentSkeleton";
import { PageHero } from "@/components/shared/PageHero";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatCurrency, formatDateStamp, formatTime } from "@/lib/formatters";
import { getPastSessions, getPlayerHistory, PAYMENT_STATUS_META } from "@/lib/club-data";
import { usePlayerClubDb } from "@/hooks/usePlayerClubDb";
import { useNow } from "@/hooks/useNow";
import type { ClubUser } from "@/types";

export function PlayerHistoryClient({ clubUser }: { clubUser: ClubUser }) {
  const { data: db, isPending, isError, error, refetch } = usePlayerClubDb(clubUser.id);
  const now = useNow(60_000);

  if (isPending && !db) {
    return <PageContentSkeleton label="Loading match history" />;
  }

  if (isError || !db) {
    return (
      <section className="screen-stack">
        <div className="route-error">
          <h2>Could not load match history</h2>
          <p>{error instanceof Error ? error.message : "Something went wrong."}</p>
          <button className="primary-button" onClick={() => void refetch()} type="button">
            Retry
          </button>
        </div>
      </section>
    );
  }

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
