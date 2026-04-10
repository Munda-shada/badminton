"use client";

import { useEffect } from "react";

export default function DashboardError({
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
      <h2>This view could not be loaded</h2>
      <p>{error.message || "An unexpected error occurred."}</p>
      <button className="primary-button" onClick={() => reset()} type="button">
        Try again
      </button>
    </div>
  );
}
