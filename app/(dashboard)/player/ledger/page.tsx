import { EmptyState } from "@/components/shared/EmptyState";
import { PageHero } from "@/components/shared/PageHero";
import { PayPendingDialog } from "@/components/player/PayPendingDialog";
import { PaymentRow } from "@/components/shared/PaymentRow";
import { formatCurrency } from "@/lib/formatters";
import { loadPlayerClubDb } from "@/lib/club-db-cache";
import { getUserPayments } from "@/lib/club-data";
import { isPaymentSubmittedNote } from "@/lib/payment-submission";
import { requireClubUser } from "@/lib/club-auth";

export default async function PlayerLedgerPage() {
  const { clubUser } = await requireClubUser({ allowRoles: ["admin", "player"] });
  const db = await loadPlayerClubDb(clubUser.id);
  const payments = getUserPayments(clubUser.id, db);
  const duePayments = payments.filter(
    (payment) => payment.status === "due" && !isPaymentSubmittedNote(payment.note),
  );

  return (
    <section className="screen-stack">
      <PageHero
        eyebrow="Payments"
        metrics={[
          {
            label: "Settled",
            value: formatCurrency(
              payments
                .filter(
                  (payment) =>
                    payment.status === "paid" ||
                    payment.status === "credit" ||
                    (payment.status === "due" && isPaymentSubmittedNote(payment.note)),
                )
                .reduce((total, payment) => total + payment.amount, 0),
            ),
          },
          {
            label: "Pending",
            value: formatCurrency(
              payments
                .filter((payment) => payment.status === "due" && !isPaymentSubmittedNote(payment.note))
                .reduce((total, payment) => total + payment.amount, 0),
            ),
          },
          { label: "Transactions", value: payments.length },
        ]}
        subtitle="Upcoming dues, settled sessions, and wallet credits stay grouped under the same design language as your match feed."
        title="Track every club payment without leaving the player hub."
      />

      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Club ledger</p>
            <h3>Your transaction history</h3>
          </div>
          <PayPendingDialog
            duePayments={duePayments.map((payment) => ({
              id: payment.id,
              amount: payment.amount,
              label: `${payment.session?.title || "Club charge"} · ${
                payment.session?.location || "Private group"
              }`,
            }))}
          />
        </div>

        {payments.length ? (
          <div className="ledger-list">
            {payments.map((payment) => (
              <PaymentRow
                amount={payment.amount}
                date={payment.createdAt}
                key={payment.id}
                note={payment.note}
                sessionLabel={`${payment.session?.title || "Club charge"} · ${
                  payment.session?.location || "Private group"
                }`}
                status={payment.status === "due" && isPaymentSubmittedNote(payment.note) ? "pending" : payment.status}
              />
            ))}
          </div>
        ) : (
          <EmptyState message="No payments are on your ledger yet." />
        )}
      </section>
    </section>
  );
}
