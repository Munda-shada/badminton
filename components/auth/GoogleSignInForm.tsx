"use client";

import { signInWithGoogleAction } from "@/actions/auth";
import { SubmitButton } from "@/components/shared/SubmitButton";

export function GoogleSignInForm({ nextPath }: { nextPath: string }) {
  return (
    <form action={signInWithGoogleAction} className="form-stack">
      <input name="next" type="hidden" value={nextPath || "/"} />

      <div className="auth-provider-card">
        <span className="label-line">Authentication provider</span>
        <strong>Google only</strong>
        <p className="subtle-copy">We verify that your Google email is registered with the club.</p>
      </div>

      <SubmitButton className="primary-button" pendingLabel="Redirecting to Google…" type="submit">
        Continue with Google
      </SubmitButton>
    </form>
  );
}
