import { Suspense } from "react";

import { approveMemberAction } from "@/actions/users";
import { Avatar } from "@/components/shared/Avatar";
import { SubmitButton } from "@/components/shared/SubmitButton";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageContentSkeleton } from "@/components/shared/PageContentSkeleton";
import { InfoTile } from "@/components/shared/InfoTile";
import { PageHero } from "@/components/shared/PageHero";
import { formatCurrency } from "@/lib/formatters";
import { loadAdminClubDb } from "@/lib/club-db-cache";
import { getMemberSummaries, STATUS_META } from "@/lib/club-data";
import { requireClubUser } from "@/lib/club-auth";
import { getRequestNow } from "@/lib/request-time";

export default function AdminMembersPage() {
  return (
    <Suspense fallback={<PageContentSkeleton label="Checking access" />}>
      <AdminMembersShell />
    </Suspense>
  );
}

async function AdminMembersShell() {
  await requireClubUser({ allowRoles: ["admin"] });
  return (
    <Suspense fallback={<PageContentSkeleton label="Loading members" />}>
      <AdminMembersWithData />
    </Suspense>
  );
}

async function AdminMembersWithData() {
  const db = await loadAdminClubDb();
  const now = await getRequestNow();
  const summaries = getMemberSummaries(db, now);
  const pendingMembers = summaries.filter((entry) => !entry.user.approved || entry.user.role === "pending");
  const activeMembers = summaries.filter((entry) => entry.user.approved && entry.user.role !== "pending");

  return (
    <section className="screen-stack">
      <PageHero
        eyebrow="Members"
        metrics={[
          { label: "Active players", value: activeMembers.length },
          {
            label: "Pending balances",
            value: formatCurrency(activeMembers.reduce((total, entry) => total + entry.pendingTotal, 0)),
          },
          { label: "Unused invites", value: db.invites.filter((invite) => !invite.usedBy).length },
        ]}
        subtitle="A clean roster of who belongs in the private group."
        title="Manage members, approval, and invites from one board."
      />

      <section className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Pending access</p>
              <h3>Players awaiting approval</h3>
            </div>
          </div>

          {pendingMembers.length ? (
            <div className="member-list">
              {pendingMembers.map((entry) => (
                <article className="member-card" key={entry.user.id}>
                  <div className="member-card__identity">
                    <Avatar name={entry.user.name} />
                    <div>
                      <h4>{entry.user.name}</h4>
                      <p className="subtle-copy">{entry.user.email}</p>
                    </div>
                  </div>
                  <div className="member-card__grid">
                    <InfoTile label="Status" value="Pending approval" />
                    <InfoTile label="Tier" value={entry.user.tier} />
                    <InfoTile label="Home venue" value={entry.user.homeVenue} />
                    <form action={approveMemberAction}>
                      <input name="userId" type="hidden" value={entry.user.id} />
                      <SubmitButton
                        className="primary-button primary-button--small"
                        pendingLabel="Approving…"
                        type="submit"
                      >
                        Approve
                      </SubmitButton>
                    </form>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState message="No players are waiting for approval right now." />
          )}

          <div className="panel-heading">
            <div>
              <p className="eyebrow">Member roster</p>
              <h3>Approved players</h3>
            </div>
          </div>

          {activeMembers.length ? (
            <div className="member-list">
              {activeMembers.map((entry) => (
                <article className="member-card" key={entry.user.id}>
                  <div className="member-card__identity">
                    <Avatar name={entry.user.name} />
                    <div>
                      <h4>{entry.user.name}</h4>
                      <p className="subtle-copy">{entry.user.email}</p>
                    </div>
                  </div>
                  <div className="member-card__grid">
                    <InfoTile label="Tier" value={entry.user.tier} />
                    <InfoTile
                      label="Current status"
                      value={
                        entry.currentResponse
                          ? STATUS_META[entry.currentResponse.response.status].shortLabel
                          : "No RSVP"
                      }
                    />
                    <InfoTile label="Attendance" value={entry.attendanceCount} />
                    <InfoTile label="Pending" value={formatCurrency(entry.pendingTotal)} />
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState message="No approved members yet." />
          )}
      </section>
    </section>
  );
}
