/**
 * Player club snapshot for browser Supabase (and server reuse).
 * Requires RLS policies that allow authenticated members to read club_users, club_sessions,
 * club_rsvps, and their own (or all club) club_payments as your schema allows.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

import {
  CLUB_PAYMENT_COLUMNS,
  CLUB_RSVP_COLUMNS,
  CLUB_SESSION_COLUMNS,
  CLUB_USER_COLUMNS,
} from "@/lib/club-columns";
import {
  mapPaymentFromRow,
  mapRsvpFromRow,
  mapSessionFromRow,
  mapUserFromRow,
  TABLES,
} from "@/lib/club-data";
import { formatDateInput, shiftDays } from "@/lib/utils";
import type { ClubDb, ClubPayment, ClubSession } from "@/types";
import type { Database } from "@/types/database.types";

type TypedSupabase = SupabaseClient<Database>;

const SESSION_PAGE_LOOKBACK_DAYS = 1095;

function minSessionDateForPages(): string {
  return formatDateInput(shiftDays(new Date(), -SESSION_PAGE_LOOKBACK_DAYS));
}

function unwrapRows<T>(
  result: { error: { message: string } | null; data: T[] | null },
  label: string,
): T[] {
  if (result.error) {
    throw new Error(`Failed to load ${label}: ${result.error.message}`);
  }

  return result.data || [];
}

async function mergeLegacyGamesIfNoSessions(
  supabase: TypedSupabase,
  partial: ClubDb,
): Promise<ClubDb> {
  if (partial.sessions.length > 0) {
    return partial;
  }

  const { data: legacyGames, error: legacyGamesError } = await supabase.from("games").select("*");

  if (legacyGamesError) {
    return partial;
  }

  const rows = legacyGames ?? [];
  const sessions: ClubSession[] = rows
    .filter((row) => row.status !== "cancelled")
    .map((row) => {
      const startTime = row.time.slice(0, 5);
      const endHour = (() => {
        const [hour, minute] = startTime.split(":").map(Number);
        const total = (hour * 60 + minute + 2 * 60) % (24 * 60);
        const h = `${Math.floor(total / 60)}`.padStart(2, "0");
        const m = `${total % 60}`.padStart(2, "0");
        return `${h}:${m}`;
      })();

      return {
        id: row.id,
        title: "Legacy session",
        date: row.date,
        startTime,
        endTime: endHour,
        location: row.location,
        mapLink: "",
        courtsBooked: 1,
        maxPlayers: Number(row.max_capacity || 0),
        costPerPlayer:
          Number(row.total_cost || 0) > 0 && Number(row.max_capacity || 0) > 0
            ? Math.round(Number(row.total_cost) / Number(row.max_capacity))
            : 0,
        createdBy: null,
        createdAt: row.created_at || new Date().toISOString(),
      };
    })
    .sort(
      (a, b) =>
        new Date(`${a.date}T${a.startTime}:00`).getTime() - new Date(`${b.date}T${b.startTime}:00`).getTime(),
    );

  return { ...partial, sessions };
}

async function fetchSessionsForPaymentsAndRecent(
  supabase: TypedSupabase,
  paymentRows: ClubPayment[],
): Promise<ClubSession[]> {
  const minDate = minSessionDateForPages();
  const recentResult = await supabase
    .from(TABLES.sessions)
    .select(CLUB_SESSION_COLUMNS)
    .gte("date", minDate);
  const recent = unwrapRows(recentResult, "sessions").map(mapSessionFromRow);
  const recentIds = new Set(recent.map((session) => session.id));
  const orphanIds = [
    ...new Set(
      paymentRows
        .map((payment) => payment.sessionId)
        .filter((id): id is string => typeof id === "string" && id.length > 0 && !recentIds.has(id)),
    ),
  ];

  let extra: ClubSession[] = [];

  for (let index = 0; index < orphanIds.length; index += 100) {
    const chunk = orphanIds.slice(index, index + 100);
    const chunkResult = await supabase
      .from(TABLES.sessions)
      .select(CLUB_SESSION_COLUMNS)
      .in("id", chunk);
    extra = extra.concat(unwrapRows(chunkResult, "sessions").map(mapSessionFromRow));
  }

  const byId = new Map<string, ClubSession>();
  for (const session of [...recent, ...extra]) {
    byId.set(session.id, session);
  }

  return Array.from(byId.values());
}

export async function loadPlayerClubSnapshot(supabase: TypedSupabase, userId: string): Promise<ClubDb> {
  const paymentsResult = await supabase
    .from(TABLES.payments)
    .select(CLUB_PAYMENT_COLUMNS)
    .eq("user_id", userId);
  const payments = unwrapRows(paymentsResult, "payments").map(mapPaymentFromRow);
  const usersResult = await supabase.from(TABLES.users).select(CLUB_USER_COLUMNS);
  const users = unwrapRows(usersResult, "users").map(mapUserFromRow);

  const sessionsAfterRecent = await fetchSessionsForPaymentsAndRecent(supabase, payments);
  const partial = await mergeLegacyGamesIfNoSessions(supabase, {
    users,
    sessions: sessionsAfterRecent,
    rsvps: [],
    invites: [],
    payments,
  });

  const sessionIds = partial.sessions.map((session) => session.id);

  if (!sessionIds.length) {
    return partial;
  }

  const rsvpsResult = await supabase
    .from(TABLES.rsvps)
    .select(CLUB_RSVP_COLUMNS)
    .in("session_id", sessionIds);
  const rsvps = unwrapRows(rsvpsResult, "rsvps").map(mapRsvpFromRow);

  return { ...partial, rsvps };
}
