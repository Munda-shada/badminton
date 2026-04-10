import Link from "next/link";

export default function AuthCodeErrorPage() {
  return (
    <main className="auth-layout auth-layout--centered">
      <section className="denied-panel">
        <p className="eyebrow">Sign-in interrupted</p>
        <h1>Google authentication did not finish.</h1>
        <p className="lede">
          The OAuth callback could not be completed. Go back to login and try again.
        </p>
        <Link className="primary-button" href="/login">
          Return to login
        </Link>
      </section>
    </main>
  );
}
