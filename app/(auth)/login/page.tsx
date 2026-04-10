import { redirect } from "next/navigation";

import { signInWithGoogleAction } from "@/actions/auth";
import { getHomePathForUser, getOptionalClubUser } from "@/lib/club-auth";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const ERROR_MESSAGES: Record<string, string> = {
  oauth: "Google sign-in could not start. Try again in a moment.",
  unknown: "Something interrupted the sign-in flow. Try again.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const { authUser, clubUser } = await getOptionalClubUser();

  if (authUser && clubUser?.approved && clubUser.role !== "pending") {
    redirect(getHomePathForUser(clubUser));
  }

  if (authUser && (!clubUser || !clubUser.approved || clubUser.role === "pending")) {
    redirect("/unauthorized?reason=pending");
  }

  const errorKey = Array.isArray(params.error) ? params.error[0] : params.error;
  const next = Array.isArray(params.next) ? params.next[0] : params.next;
  const errorMessage = errorKey ? ERROR_MESSAGES[errorKey] || ERROR_MESSAGES.unknown : "";

  return (
    <main className="auth-layout">
      <section className="auth-showcase">
        <div className="showcase-grid-line" />
        <div className="showcase-topline">
          <span className="showcase-chip">Private group access</span>
          <span className="showcase-live">
            <span className="status-dot" />
            Network active
          </span>
        </div>

        <div className="showcase-copy">
          <p className="eyebrow">Invite-Only Badminton Hub</p>
          <h1>
            Enter the arena.
            <span>Sign in to continue.</span>
          </h1>
        </div>

        <div className="showcase-stats">
          <div className="showcase-stat">
            <strong>4</strong>
            <span>RSVP states</span>
          </div>
          <div className="showcase-stat">
            <strong>1h</strong>
            <span>Auto-lock before play</span>
          </div>
          <div className="showcase-stat">
            <strong>Live</strong>
            <span>Roster visibility</span>
          </div>
        </div>

        <div className="showcase-cards">
          <article className="highlight-card">
            <p className="eyebrow">Roster Lock</p>
            <h3>Exactly 1 hour before play</h3>
            <p className="subtle-copy">
              Every vote flips to read-only automatically so the final lineup stays stable.
            </p>
          </article>
          <article className="highlight-card">
            <p className="eyebrow">Live Visibility</p>
            <h3>See every player status</h3>
            <p className="subtle-copy">
              Confirmed, tentative, +1, and waitlist stay visible on the same session card.
            </p>
          </article>
          <article className="highlight-card">
            <p className="eyebrow">Admin Control</p>
            <h3>Google-gated access</h3>
            <p className="subtle-copy">
              Only approved players can sign up, log in, and join the private group.
            </p>
          </article>
        </div>
      </section>

      <section className="auth-panel">
        <div className="auth-panel__inner">
          <div className="panel-badge">Authorized athletes only</div>

          <div className="brand-block">
            <span className="brand-mark">SC</span>
            <div>
              <p className="eyebrow">Smash Club</p>
              <h2>Sign into the club</h2>
            </div>
          </div>

          <p className="panel-copy">
            Use the Google account linked to your club membership to enter the dashboard.
          </p>

          {errorMessage ? <div className="notice-card notice-card--error">{errorMessage}</div> : null}

          <form action={signInWithGoogleAction} className="form-stack">
            <input name="next" type="hidden" value={next || "/"} />

            <div className="auth-provider-card">
              <span className="label-line">Authentication provider</span>
              <strong>Google only</strong>
              <p className="subtle-copy">We verify that your Google email is registered with the club.</p>
            </div>

            <button className="primary-button" type="submit">
              Continue with Google
            </button>
          </form>

        </div>
      </section>
    </main>
  );
}
