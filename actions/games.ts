"use server";

import { revalidatePath } from "next/cache";

import { createClubSession, syncClubSessionCharges, updateClubSession } from "@/lib/club-data-service";
import { requireClubUser } from "@/lib/club-auth";
import { createAdminClient } from "@/lib/supabase/server";
import { generateId } from "@/lib/utils";

export async function createGameAction(formData: FormData) {
  const { clubUser } = await requireClubUser({ allowRoles: ["admin"] });
  const adminSupabase = createAdminClient();
  const costPerPlayer = parseOptionalNumber(formData.get("costPerPlayer"));

  const session = {
    id: generateId("session"),
    title: String(formData.get("title") || "").trim(),
    date: String(formData.get("date") || ""),
    startTime: String(formData.get("startTime") || ""),
    endTime: String(formData.get("endTime") || ""),
    location: String(formData.get("location") || "").trim(),
    mapLink: String(formData.get("mapLink") || "").trim(),
    courtsBooked: Number(formData.get("courtsBooked") || 0),
    maxPlayers: Number(formData.get("maxPlayers") || 0),
    costPerPlayer,
    createdBy: clubUser.id,
    createdAt: new Date().toISOString(),
  };

  if (
    !session.title ||
    !session.date ||
    !session.startTime ||
    !session.endTime ||
    !session.location
  ) {
    throw new Error("Complete every session field before publishing.");
  }

  if (session.endTime <= session.startTime) {
    throw new Error("End time needs to be later than the start time.");
  }

  await createClubSession(adminSupabase, session);
  revalidatePath("/admin");
  revalidatePath("/admin/games");
  revalidatePath("/admin/ledger");
  revalidatePath("/player");
}

export async function updateGameDetailsAction(formData: FormData) {
  await requireClubUser({ allowRoles: ["admin"] });
  const adminSupabase = createAdminClient();
  const sessionId = String(formData.get("sessionId") || "").trim();

  if (!sessionId) {
    throw new Error("Choose a session before saving changes.");
  }

  const nextSession = {
    title: String(formData.get("title") || "").trim(),
    date: String(formData.get("date") || ""),
    startTime: String(formData.get("startTime") || ""),
    endTime: String(formData.get("endTime") || ""),
    location: String(formData.get("location") || "").trim(),
    mapLink: String(formData.get("mapLink") || "").trim(),
    courtsBooked: Number(formData.get("courtsBooked") || 0),
    maxPlayers: Number(formData.get("maxPlayers") || 0),
    costPerPlayer: parseOptionalNumber(formData.get("costPerPlayer")),
  };

  if (
    !nextSession.title ||
    !nextSession.date ||
    !nextSession.startTime ||
    !nextSession.endTime ||
    !nextSession.location
  ) {
    throw new Error("Complete every session field before saving.");
  }

  if (nextSession.endTime <= nextSession.startTime) {
    throw new Error("End time needs to be later than the start time.");
  }

  await updateClubSession(adminSupabase, sessionId, nextSession);
  await syncClubSessionCharges(adminSupabase, {
    sessionId,
    costPerPlayer: nextSession.costPerPlayer,
  });

  revalidatePath("/admin");
  revalidatePath("/admin/games");
  revalidatePath("/admin/ledger");
  revalidatePath("/player");
  revalidatePath("/player/ledger");
}

function parseOptionalNumber(value: FormDataEntryValue | null) {
  const rawValue = String(value || "").trim();

  if (!rawValue) {
    return 0;
  }

  return Number(rawValue);
}
