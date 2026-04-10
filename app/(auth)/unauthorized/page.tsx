import Link from "next/link";

import { signOutAction } from "@/actions/auth";
import { getOptionalClubUser } from "@/lib/club-auth";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function UnauthorizedPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const reason = Array.isArray(params.reason) ? params.reason[0] : params.reason;
  const { authUser, clubUser } = await getOptionalClubUser();
  const email = clubUser?.email || authUser?.email || "No authenticated email";
  const name = clubUser?.name || authUser?.user_metadata?.full_name || "Player";

  const copy =
    reason === "invite"
      ? "This Google account is signed in, but the invite code did not match the club roster. Try a different invite or ask the admin for the correct one."
      : "Your Google account is signed in and waiting for approval. Once the admin marks your role as admin or player, you will land in the right dashboard automatically.";

  return (
    <main className="auth-layout auth-layout--centered">
      <section className="denied-panel">
        <p className="eyebrow">{reason === "invite" ? "Access restricted" : "Pending approval"}</p>
        <h1>{reason === "invite" ? "Invite not accepted." : "Membership is under review."}</h1>
        <p className="lede">
          {name}, {copy}
        </p>
        <div className="credential-card">
          <strong>Current account</strong>
          <span>{email}</span>
          {clubUser?.role ? <span>Current role: {clubUser.role}</span> : null}
        </div>
        <div className="stack-actions">
          <form action={signOutAction}>
            <button className="primary-button" type="submit">
              Exit portal
            </button>
          </form>
          {reason === "invite" ? (
            <Link className="secondary-button" href="/login?mode=invite">
              Try another invite
            </Link>
          ) : null}
        </div>
      </section>
    </main>
  );
}
