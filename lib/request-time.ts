import { headers } from "next/headers";
import { cache } from "react";

export const getRequestNow = cache(async () => {
  const headerStore = await headers();
  const value = headerStore.get("x-smash-request-time");
  const parsed = Number(value);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
});
