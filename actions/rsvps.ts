"use server";

import { revalidatePath } from "next/cache";

import { getLockState, getRoster, getUserRsvp } from "@/lib/club-data";
import { fetchClubDb, saveClubRsvp, syncClubSessionCharges } from "@/lib/club-data-service";
import { requireClubUser } from "@/lib/club-auth";
import { generateId } from "@/lib/utils";
import type { RsvpStatus } from "@/types";

export async function submitRsvpAction({
  sessionId,
  status,
}: {
  sessionId: string;
  status: RsvpStatus;
}) {
  const { supabase, clubUser } = await requireClubUser({ allowRoles: ["admin", "player"] });
  const db = await fetchClubDb(supabase);
  const session = db.sessions.find((entry) => entry.id === sessionId);

  if (!session) {
    throw new Error("That session could not be found.");
  }

  if (getLockState(session, Date.now()).isLocked) {
    throw new Error("This roster is locked.");
  }

  const timestamp = new Date().toISOString();
  const existing = getUserRsvp(sessionId, clubUser.id, db);
  const nextRsvp = existing
    ? { ...existing, status, updatedAt: timestamp }
    : {
        id: generateId("rsvp"),
        sessionId,
        userId: clubUser.id,
        status,
        updatedAt: timestamp,
  };

  await saveClubRsvp(supabase, nextRsvp);
  await syncClubSessionCharges(supabase, {
    sessionId,
    costPerPlayer: session.costPerPlayer,
  });

  const nextDb = {
    ...db,
    rsvps: existing
      ? db.rsvps.map((entry) => (entry.id === existing.id ? nextRsvp : entry))
      : [...db.rsvps, nextRsvp],
  };
  const roster = getRoster(session, nextDb);
  const waitlisted = roster.waitlist.some((entry) => entry.user.id === clubUser.id);

  revalidatePath("/player");
  revalidatePath("/admin");

  return {
    status,
    waitlisted,
  };
}

export async function adminOverrideRsvpAction(formData: FormData) {
  const { supabase } = await requireClubUser({ allowRoles: ["admin"] });
  const sessionId = String(formData.get("sessionId") || "").trim();
  const userId = String(formData.get("userId") || "").trim();
  const nextStatus = String(formData.get("status") || "").trim();

  if (!sessionId || !userId || !isRsvpStatus(nextStatus)) {
    throw new Error("Choose a session, player, and valid RSVP state.");
  }

  const db = await fetchClubDb(supabase);
  const session = db.sessions.find((entry) => entry.id === sessionId);

  if (!session) {
    throw new Error("That session could not be found.");
  }

  const timestamp = new Date().toISOString();
  const existing = getUserRsvp(sessionId, userId, db);
  const nextRsvp = existing
    ? { ...existing, status: nextStatus, updatedAt: timestamp }
    : {
        id: generateId("rsvp"),
        sessionId,
        userId,
        status: nextStatus,
        updatedAt: timestamp,
      };

  await saveClubRsvp(supabase, nextRsvp);
  await syncClubSessionCharges(supabase, {
    sessionId,
    costPerPlayer: session.costPerPlayer,
  });

  revalidatePath("/admin");
  revalidatePath("/admin/games");
  revalidatePath("/admin/ledger");
  revalidatePath("/player");
  revalidatePath("/player/ledger");
}

function isRsvpStatus(value: string): value is RsvpStatus {
  return value === "in" || value === "tentative" || value === "plus" || value === "out";
}
