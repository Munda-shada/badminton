type ErrorContext = Record<string, unknown>;

/**
 * Central hook for production error reporting. Extend with Sentry/OpenTelemetry when ready.
 */
export function reportError(error: unknown, context?: ErrorContext) {
  const payload = context && Object.keys(context).length ? context : undefined;

  if (payload) {
    console.error("[report-error]", payload, error);
  } else {
    console.error("[report-error]", error);
  }
}
