const PUBLIC_KEYS = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"] as const;

const SERVER_KEYS = ["SUPABASE_SERVICE_ROLE_KEY"] as const;

/**
 * Validates required env vars in production. Call from instrumentation (Node runtime).
 */
export function assertProductionEnv() {
  if (process.env.NODE_ENV !== "production") {
    return;
  }

  for (const key of PUBLIC_KEYS) {
    if (!process.env[key]?.trim()) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  }

  for (const key of SERVER_KEYS) {
    if (!process.env[key]?.trim()) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  }
}
