import { headers } from "next/headers";

export async function getRequestNow() {
  const headerStore = await headers();
  const value = headerStore.get("x-smash-request-time");
  const parsed = Number(value);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}
