import { MarkPaymentPaidForm } from "@/components/admin/MarkPaymentPaidForm";
import { SettleGameDialog } from "@/components/admin/SettleGameDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHero } from "@/components/shared/PageHero";
import { PaymentRow } from "@/components/shared/PaymentRow";
import { formatCurrency, formatDateLong, formatOptionalCurrency, formatTime } from "@/lib/formatters";
import { loadAdminClubDb } from "@/lib/club-db-cache";
import { getAdminPayments, getRoster, getSortedSessions } from "@/lib/club-data";
import { isPaymentSubmittedNote } from "@/lib/payment-submission";
import { requireClubUser } from "@/lib/club-auth";
import { getRequestNow } from "@/lib/request-time";
import { buildSessionDate } from "@/lib/utils";

const SETTLE_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;

export default async function AdminLedgerPage() {
  await requireClubUser({ allowRoles: ["admin"] });
  const db = await loadAdminClubDb();
  const payments = getAdminPayments(db);
  const requestNow = await getRequestNow();
  const sortedSessions = [...getSortedSessions(db.sessions)].reverse();
  const sessions =
    requestNow > 0
      ? sortedSessions.filter((session) => {
          const start = buildSessionDate(session.date, session.startTime).getTime();
          return start >= requestNow - SETTLE_WINDOW_MS && start <= requestNow;
        })
      : sortedSessions;
  const collected = payments
    .filter((payment) => payment.status === "paid")
    .reduce((total, payment) => total + payment.amount, 0);
  const pending = payments
    .filter((payment) => payment.status === "due" || isPaymentSubmittedNote(payment.note))
    .reduce((total, payment) => total + payment.amount, 0);
  const pendingPayments = payments.filter((payment) => payment.status === "due");

  const bySession = pendingPayments.reduce<Record<string, typeof pendingPayments>>((acc, payment) => {
    const key = payment.session?.id || "unknown-session";
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(payment);
    return acc;
  }, {});

  const byUser = payments.reduce<Record<string, typeof payments>>((acc, payment) => {
    const key = payment.user?.id || "unknown-user";
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(payment);
    return acc;
  }, {});

  return (
    <section className="screen-stack">
      <PageHero
        eyebrow="Admin Payments"
        metrics={[
          { label: "Collected", value: formatCurrency(collected) },
          { label: "Pending", value: formatCurrency(pending) },
          { label: "Ledger rows", value: payments.length },
        ]}
        subtitle="Mark dues paid, apply credits, and settle sessions without leaving this board."
        title="Club ledger"
      />

      <section className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Settle sessions</p>
              <h3>Apply or revise session charges</h3>
              {requestNow > 0 ? (
                <p className="panel-caption">
                  Showing sessions from the last 14 days (past games only).
                </p>
              ) : null}
            </div>
          </div>

          {sessions.length ? (
            <div className="admin-session-list">
              {sessions.map((session) => {
                const roster = getRoster(session, db);

                return (
                  <article className="admin-session-row" key={session.id}>
                    <div>
                      <p className="eyebrow">{formatDateLong(session.date)}</p>
                      <h4>{session.title}</h4>
                      <p className="subtle-copy">
                        {session.location} · {formatTime(session.startTime)} to {formatTime(session.endTime)}
                      </p>
                      <p className="subtle-copy">
                        Current session cost: {formatOptionalCurrency(session.costPerPlayer)}
                      </p>
                    </div>
                    <div className="admin-session-row__stats">
                      <span className="subtle-copy">
                        {roster.confirmedSlots} confirmed slots · {session.maxPlayers} cap
                      </span>
                      <SettleGameDialog confirmedSlots={roster.confirmedSlots} session={session} />
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <EmptyState message="No sessions are available to settle yet." />
          )}

          <div className="panel-heading">
            <div>
              <p className="eyebrow">Payment approvals</p>
              <h3>Review submitted payments</h3>
            </div>
          </div>

          {Object.keys(bySession).length || Object.keys(byUser).length ? (
            <div className="poll-manager-list">
              <details className="poll-manager-card" open>
                <summary className="poll-manager-card__summary">
                  <div className="poll-manager-card__summary-main">
                    <p className="eyebrow">Select view</p>
                    <h3>Game wise</h3>
                    <p className="subtle-copy">
                      Expand a game to see participating players and payment status.
                    </p>
                  </div>
                </summary>
                <div className="poll-manager-card__body">
                  <section className="poll-editor">
                    <div className="ledger-list">
                      {Object.entries(bySession).map(([key, entries]) => (
                        <details className="status-card" key={key}>
                          <summary className="poll-manager-card__summary">
                            <div className="poll-manager-card__summary-main">
                              <p className="eyebrow">{entries[0]?.session?.title || "Session"}</p>
                              <h3>{entries[0]?.session?.location || "Private group"}</h3>
                              <p className="subtle-copy">
                                {entries.length} payment row{entries.length === 1 ? "" : "s"} ·{" "}
                                {formatCurrency(entries.reduce((total, entry) => total + entry.amount, 0))}
                              </p>
                            </div>
                          </summary>
                          <div className="ledger-list">
                            {entries.map((payment) => {
                              const submitted = isPaymentSubmittedNote(payment.note);
                              return (
                                <PaymentRow
                                  actions={
                                    submitted && payment.status === "due" ? (
                                      <MarkPaymentPaidForm paymentId={payment.id} />
                                    ) : null
                                  }
                                  amount={payment.amount}
                                  date={payment.createdAt}
                                  key={payment.id}
                                  note={payment.note}
                                  sessionLabel={`${payment.user?.name || "Member"} · ${
                                    payment.session?.title || "Session"
                                  }`}
                                  status={payment.status === "due" && submitted ? "pending" : payment.status}
                                />
                              );
                            })}
                          </div>
                        </details>
                      ))}
                    </div>
                  </section>
                </div>
              </details>

              <details className="poll-manager-card">
                <summary className="poll-manager-card__summary">
                  <div className="poll-manager-card__summary-main">
                    <p className="eyebrow">Select view</p>
                    <h3>Player wise</h3>
                    <p className="subtle-copy">
                      Expand a player to see pending total and full game payment history.
                    </p>
                  </div>
                </summary>
                <div className="poll-manager-card__body">
                  <section className="poll-editor">
                    <div className="ledger-list">
                      {Object.entries(byUser).map(([key, entries]) => (
                        <details className="status-card" key={key}>
                          <summary className="poll-manager-card__summary">
                            <div className="poll-manager-card__summary-main">
                              <p className="eyebrow">{entries[0]?.user?.name || "Member"}</p>
                              <h3>{entries[0]?.user?.email || "No email"}</h3>
                              <p className="subtle-copy">
                                Pending:{" "}
                                {formatCurrency(
                                  entries
                                    .filter((entry) => entry.status === "due")
                                    .reduce((total, entry) => total + entry.amount, 0),
                                )}{" "}
                                · Total history:{" "}
                                {formatCurrency(entries.reduce((total, entry) => total + entry.amount, 0))}
                              </p>
                            </div>
                          </summary>
                          <div className="ledger-list">
                            {entries.map((payment) => {
                              const submitted = isPaymentSubmittedNote(payment.note);
                              return (
                                <PaymentRow
                                  actions={
                                    submitted && payment.status === "due" ? (
                                      <MarkPaymentPaidForm paymentId={payment.id} />
                                    ) : null
                                  }
                                  amount={payment.amount}
                                  date={payment.createdAt}
                                  key={payment.id}
                                  note={payment.note}
                                  sessionLabel={`${payment.user?.name || "Member"} · ${
                                    payment.session?.title || "Session"
                                  }`}
                                  status={payment.status === "due" && submitted ? "pending" : payment.status}
                                />
                              );
                            })}
                          </div>
                        </details>
                      ))}
                    </div>
                  </section>
                </div>
              </details>
            </div>
          ) : (
            <EmptyState message="No submitted payments yet." />
          )}
      </section>
    </section>
  );
}
