"use client";

import { useEffect } from "react";

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="route-error">
      <h2>Something went wrong</h2>
      <p>{error.message || "Please go back and try again."}</p>
      <button className="primary-button" onClick={() => reset()} type="button">
        Try again
      </button>
    </div>
  );
}
