"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { Avatar } from "@/components/shared/Avatar";
import { InfoTile } from "@/components/shared/InfoTile";
import { PageContentSkeleton } from "@/components/shared/PageContentSkeleton";
import { PageHero } from "@/components/shared/PageHero";
import { SubmitButton } from "@/components/shared/SubmitButton";
import { useToast } from "@/components/shared/ToastProvider";
import { updatePlayerProfileAction } from "@/actions/users";
import { formatCurrency } from "@/lib/formatters";
import { getPlayerHistory, getUpcomingSessions, getUserPayments } from "@/lib/club-data";
import { getActionErrorMessage } from "@/lib/action-errors";
import { queryKeys } from "@/lib/query-keys";
import { usePlayerClubDb } from "@/hooks/usePlayerClubDb";
import { useNow } from "@/hooks/useNow";
import type { ClubUser } from "@/types";

export function PlayerProfileClient({ clubUser }: { clubUser: ClubUser }) {
  const { data: db, isPending, isError, error, refetch } = usePlayerClubDb(clubUser.id);
  const now = useNow(60_000);
  const queryClient = useQueryClient();
  const toast = useToast();
  const [formError, setFormError] = useState<string | null>(null);

  if (isPending && !db) {
    return <PageContentSkeleton label="Loading profile" />;
  }

  if (isError || !db) {
    return (
      <section className="screen-stack">
        <div className="route-error">
          <h2>Could not load profile data</h2>
          <p>{error instanceof Error ? error.message : "Something went wrong."}</p>
          <button className="primary-button" onClick={() => void refetch()} type="button">
            Retry
          </button>
        </div>
      </section>
    );
  }

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

        <form
          className="form-grid"
          onSubmit={async (event) => {
            event.preventDefault();
            setFormError(null);
            const formData = new FormData(event.currentTarget);
            try {
              await updatePlayerProfileAction(formData);
              toast("Profile saved");
              await queryClient.invalidateQueries({ queryKey: queryKeys.playerClub(clubUser.id) });
            } catch (caught) {
              setFormError(getActionErrorMessage(caught));
            }
          }}
          style={{ marginTop: 18 }}
        >
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
          {formError ? (
            <p className="form-error-inline" role="alert">
              {formError}
            </p>
          ) : null}
          <div className="form-actions is-wide">
            <SubmitButton className="primary-button" pendingLabel="Saving…" type="submit">
              Save profile
            </SubmitButton>
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
