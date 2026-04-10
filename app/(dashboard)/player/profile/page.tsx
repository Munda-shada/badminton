import { Avatar } from "@/components/shared/Avatar";
import { InfoTile } from "@/components/shared/InfoTile";
import { PageHero } from "@/components/shared/PageHero";
import { updatePlayerProfileAction } from "@/actions/users";
import { formatCurrency } from "@/lib/formatters";
import { loadPlayerClubDb } from "@/lib/club-db-cache";
import { getPlayerHistory, getUpcomingSessions, getUserPayments } from "@/lib/club-data";
import { requireClubUser } from "@/lib/club-auth";
import { getRequestNow } from "@/lib/request-time";

export default async function PlayerProfilePage() {
  const { clubUser } = await requireClubUser({ allowRoles: ["admin", "player"] });
  const db = await loadPlayerClubDb(clubUser.id);
  const now = await getRequestNow();
  const upcomingSessions = getUpcomingSessions(db.sessions, now);
  const history = getPlayerHistory(clubUser.id, db, now);
  const payments = getUserPayments(clubUser.id, db);
  const settledTotal = payments
    .filter((payment) => payment.status === "paid" || payment.status === "credit")
    .reduce((total, payment) => total + payment.amount, 0);
  const pendingTotal = payments
    .filter((payment) => payment.status === "due")
    .reduce((total, payment) => total + payment.amount, 0);
  const joinedDateLabel = new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(clubUser.joinedAt));

  return (
    <section className="screen-stack">
      <PageHero
        eyebrow="Player Profile"
        metrics={[
          { label: "Upcoming sessions", value: upcomingSessions.length },
          { label: "Sessions joined", value: history.filter((entry) => entry.response.status !== "out").length },
          { label: "Pending", value: formatCurrency(pendingTotal) },
        ]}
        subtitle="Your club identity, attendance snapshot, and payment totals in one profile screen."
        title="Your player profile"
      />

      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Identity</p>
            <h3>Player details</h3>
          </div>
        </div>

        <div className="profile-grid">
          <div className="profile-header">
            <Avatar large name={clubUser.name} />
            <div>
              <h3>{clubUser.name}</h3>
              <p className="subtle-copy">{clubUser.email}</p>
            </div>
          </div>
          <InfoTile label="Joined" value={joinedDateLabel} />
        </div>

        <form action={updatePlayerProfileAction} className="form-grid" style={{ marginTop: 18 }}>
          <label className="form-field">
            <span>Tier</span>
            <select defaultValue={clubUser.tier} name="tier" required>
              <option value="Beginner">Beginner</option>
              <option value="Beginner+">Beginner+</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Intermediate+">Intermediate+</option>
              <option value="Advanced">Advanced</option>
              <option value="Professional">Professional</option>
            </select>
          </label>
          <label className="form-field">
            <span>Home Venue</span>
            <input defaultValue={clubUser.homeVenue} name="homeVenue" required type="text" />
          </label>
          <div className="form-actions is-wide">
            <button className="primary-button" type="submit">
              Save profile
            </button>
          </div>
        </form>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Account snapshot</p>
            <h3>Attendance and wallet summary</h3>
          </div>
        </div>

        <div className="profile-grid">
          <InfoTile label="Settled amount" value={formatCurrency(settledTotal)} />
          <InfoTile label="Pending amount" value={formatCurrency(pendingTotal)} />
          <InfoTile label="Guest appearances" value={history.filter((entry) => entry.response.status === "plus").length} />
          <InfoTile label="Attendance count" value={history.filter((entry) => entry.response.status !== "out").length} />
          <InfoTile label="Ledger entries" value={payments.length} />
          <InfoTile label="Past sessions" value={history.length} />
        </div>
      </section>
    </section>
  );
}
