import type { SupabaseClient } from "@supabase/supabase-js";

import {
  CLUB_INVITE_COLUMNS,
  CLUB_PAYMENT_COLUMNS,
  CLUB_RSVP_COLUMNS,
  CLUB_SESSION_COLUMNS,
  CLUB_USER_COLUMNS,
} from "@/lib/club-columns";
import {
  createSeedDb,
  generateInviteCode,
  getRoster,
  mapInviteFromRow,
  mapInviteToRow,
  mapPaymentFromRow,
  mapPaymentToRow,
  mapRsvpFromRow,
  mapRsvpToRow,
  mapSessionFromRow,
  mapSessionToRow,
  mapUserFromRow,
  mapUserToRow,
  STATUS_META,
  TABLES,
} from "@/lib/club-data";
import { loadPlayerClubSnapshot } from "@/lib/player-club-remote";
import { formatDateInput, generateId, shiftDays } from "@/lib/utils";
import type {
  ClubDb,
  ClubInvite,
  ClubPayment,
  ClubRole,
  ClubRsvp,
  ClubSession,
  ClubUser,
} from "@/types";
import type { Database } from "@/types/database.types";

type TypedSupabase = SupabaseClient<Database>;

/** Sessions on or after this date plus any session referenced by loaded payments. */
const SESSION_PAGE_LOOKBACK_DAYS = 1095;

/** Admin ledger: newest payment rows per request (use load more on the client for the rest). */
export const ADMIN_PAYMENTS_PAGE_SIZE = 75;

/** Admin members / roster lists — cap to keep responses bounded. */
const ADMIN_USERS_CAP = 400;

function minSessionDateForPages(): string {
  return formatDateInput(shiftDays(new Date(), -SESSION_PAGE_LOOKBACK_DAYS));
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

  return {
    ...partial,
    sessions: mapLegacyGamesToSessions(legacyGames ?? []),
  };
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

export async function ensureClubSeedData(supabase: TypedSupabase) {
  if (process.env.CLUB_SKIP_SEED_CHECK === "1") {
    return false;
  }

  const [usersHead, sessionsHead] = await Promise.all([
    supabase.from(TABLES.users).select("id", { count: "exact", head: true }),
    supabase.from(TABLES.sessions).select("id", { count: "exact", head: true }),
  ]);

  if (usersHead.error) {
    throw usersHead.error;
  }

  if (sessionsHead.error) {
    throw sessionsHead.error;
  }

  const userCount = usersHead.count ?? 0;
  const sessionCount = sessionsHead.count ?? 0;

  // Hot path: after initial seed, every request used to run 5 count queries. Two cheap
  // checks cover the normal case (members + sessions exist).
  if (userCount > 0 && sessionCount > 0) {
    return false;
  }

  const [invitesHead, rsvpsHead, paymentsHead] = await Promise.all([
    supabase.from(TABLES.invites).select("id", { count: "exact", head: true }),
    supabase.from(TABLES.rsvps).select("id", { count: "exact", head: true }),
    supabase.from(TABLES.payments).select("id", { count: "exact", head: true }),
  ]);

  for (const result of [invitesHead, rsvpsHead, paymentsHead]) {
    if (result.error) {
      throw result.error;
    }
  }

  const counts = [
    userCount,
    sessionCount,
    invitesHead.count ?? 0,
    rsvpsHead.count ?? 0,
    paymentsHead.count ?? 0,
  ];

  const hasAllSeedTables = counts.every((count) => count > 0);
  const hasAnySeedTableRows = counts.some((count) => count > 0);

  if (hasAllSeedTables) {
    return false;
  }

  // Seed fixtures only on a fully empty schema. Partial seeding can break foreign keys
  // because the fixtures reference specific IDs (e.g. user-admin, session-*).
  if (hasAnySeedTableRows) {
    return false;
  }

  const seed = createSeedDb();
  const seedByTable = {
    [TABLES.users]: seed.users.map(mapUserToRow),
    [TABLES.sessions]: seed.sessions.map(mapSessionToRow),
    [TABLES.invites]: seed.invites.map(mapInviteToRow),
    [TABLES.rsvps]: seed.rsvps.map(mapRsvpToRow),
    [TABLES.payments]: seed.payments.map(mapPaymentToRow),
  };

  // Insert in FK-safe order.
  await insertRows(supabase, TABLES.users, seedByTable[TABLES.users]);
  await insertRows(supabase, TABLES.sessions, seedByTable[TABLES.sessions]);
  await insertRows(supabase, TABLES.invites, seedByTable[TABLES.invites]);
  await insertRows(supabase, TABLES.rsvps, seedByTable[TABLES.rsvps]);
  await insertRows(supabase, TABLES.payments, seedByTable[TABLES.payments]);

  return true;
}

/** Full club tables — use from server actions and mutations (not cached). */
export async function fetchClubDb(supabase: TypedSupabase): Promise<ClubDb> {
  const [usersResult, sessionsResult, rsvpsResult, invitesResult, paymentsResult] =
    await Promise.all([
      supabase.from(TABLES.users).select(CLUB_USER_COLUMNS),
      supabase.from(TABLES.sessions).select(CLUB_SESSION_COLUMNS),
      supabase.from(TABLES.rsvps).select(CLUB_RSVP_COLUMNS),
      supabase.from(TABLES.invites).select(CLUB_INVITE_COLUMNS),
      supabase.from(TABLES.payments).select(CLUB_PAYMENT_COLUMNS),
    ]);

  const users = unwrapRows(usersResult, "users").map(mapUserFromRow);
  const sessions = unwrapRows(sessionsResult, "sessions").map(mapSessionFromRow);
  const rsvps = unwrapRows(rsvpsResult, "rsvps").map(mapRsvpFromRow);
  const invites = unwrapRows(invitesResult, "invites").map(mapInviteFromRow);
  const payments = unwrapRows(paymentsResult, "payments").map(mapPaymentFromRow);

  return mergeLegacyGamesIfNoSessions(supabase, { users, sessions, rsvps, invites, payments });
}

/** Scoped reads for admin dashboard pages (cached per request in `lib/club-db-cache`). */
export async function countClubPayments(supabase: TypedSupabase): Promise<number> {
  const { count, error } = await supabase
    .from(TABLES.payments)
    .select("id", { count: "exact", head: true });

  if (error) {
    throw error;
  }

  return count ?? 0;
}

export async function fetchClubDbForPageAdmin(supabase: TypedSupabase): Promise<ClubDb> {
  const [usersResult, invitesResult, paymentsResult] = await Promise.all([
    supabase.from(TABLES.users).select(CLUB_USER_COLUMNS).limit(ADMIN_USERS_CAP),
    supabase.from(TABLES.invites).select(CLUB_INVITE_COLUMNS),
    supabase
      .from(TABLES.payments)
      .select(CLUB_PAYMENT_COLUMNS)
      .order("created_at", { ascending: false })
      .range(0, ADMIN_PAYMENTS_PAGE_SIZE - 1),
  ]);

  const users = unwrapRows(usersResult, "users").map(mapUserFromRow);
  const invites = unwrapRows(invitesResult, "invites").map(mapInviteFromRow);
  const payments = unwrapRows(paymentsResult, "payments").map(mapPaymentFromRow);
  const sessionsAfterRecent = await fetchSessionsForPaymentsAndRecent(supabase, payments);

  const partial = await mergeLegacyGamesIfNoSessions(supabase, {
    users,
    sessions: sessionsAfterRecent,
    rsvps: [],
    invites,
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

/** Scoped reads for player dashboard pages (cached per request in `lib/club-db-cache`). */
export async function fetchClubDbForPagePlayer(
  supabase: TypedSupabase,
  userId: string,
): Promise<ClubDb> {
  return loadPlayerClubSnapshot(supabase, userId);
}

export async function findClubUserByEmail(supabase: TypedSupabase, email: string) {
  const normalizedEmail = String(email || "").trim().toLowerCase();

  if (!normalizedEmail) {
    return null;
  }

  const { data, error } = await supabase
    .from(TABLES.users)
    .select(CLUB_USER_COLUMNS)
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? mapUserFromRow(data) : null;
}

export async function getAuthenticatedClubUser(supabase: TypedSupabase) {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    if (isMissingSessionError(error)) {
      return { authUser: null, clubUser: null as ClubUser | null };
    }

    throw error;
  }

  if (!user?.email) {
    return { authUser: null, clubUser: null as ClubUser | null };
  }

  const clubUser = await findClubUserByEmail(supabase, user.email);
  return { authUser: user, clubUser };
}

export async function createClubUserFromInvite(
  supabase: TypedSupabase,
  {
    code,
    email,
    name,
    password,
    role = "player",
    approved = true,
  }: {
    code: string;
    email: string;
    name: string;
    password: string;
    role?: ClubRole;
    approved?: boolean;
  },
) {
  const normalizedCode = String(code || "").trim().toUpperCase();
  const normalizedEmail = String(email || "").trim().toLowerCase();

  const [{ data: invite, error: inviteError }, { data: existingUser, error: userError }] =
    await Promise.all([
      supabase.from(TABLES.invites).select(CLUB_INVITE_COLUMNS).eq("code", normalizedCode).maybeSingle(),
      supabase.from(TABLES.users).select("id").eq("email", normalizedEmail).maybeSingle(),
    ]);

  if (inviteError) {
    throw inviteError;
  }

  if (userError) {
    throw userError;
  }

  if (!invite) {
    return { errorMessage: "That invite code does not exist.", user: null };
  }

  if (invite.used_by) {
    return { errorMessage: "That invite code has already been claimed.", user: null };
  }

  if (invite.email && invite.email.toLowerCase() !== normalizedEmail) {
    return { errorMessage: "This invite is locked to a different email address.", user: null };
  }

  if (existingUser) {
    return { errorMessage: "An account with that email already exists.", user: null };
  }

  const timestamp = new Date().toISOString();
  const user: ClubUser = {
    id: generateId("user"),
    name: String(name || "").trim(),
    email: normalizedEmail,
    password: String(password || "").trim(),
    role,
    approved,
    tier: approved ? "Rookie" : "Pending",
    homeVenue: "Velocity Sports Arena",
    bio: approved
      ? "Recently invited to the club and ready for the next session."
      : "Waiting for admin approval before entering the club dashboards.",
    joinedAt: timestamp,
    createdAt: timestamp,
  };

  await insertRows(supabase, TABLES.users, [mapUserToRow(user)]);

  const { error: updateError } = await supabase
    .from(TABLES.invites)
    .update({
      used_by: user.id,
      used_at: timestamp,
    })
    .eq("id", invite.id);

  if (updateError) {
    throw updateError;
  }

  return { errorMessage: "", user };
}

export async function createPendingClubUser(
  supabase: TypedSupabase,
  {
    email,
    name,
    password,
  }: {
    email: string;
    name: string;
    password: string;
  },
) {
  const normalizedEmail = String(email || "").trim().toLowerCase();

  const { data: existingUser, error: existingUserError } = await supabase
    .from(TABLES.users)
    .select(CLUB_USER_COLUMNS)
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (existingUserError) {
    throw existingUserError;
  }

  if (existingUser) {
    return mapUserFromRow(existingUser);
  }

  const timestamp = new Date().toISOString();
  const user: ClubUser = {
    id: generateId("user"),
    name: String(name || "").trim() || normalizedEmail.split("@")[0],
    email: normalizedEmail,
    password: String(password || "").trim(),
    role: "pending",
    approved: false,
    tier: "Pending",
    homeVenue: "Awaiting assignment",
    bio: "Signed in with Google and waiting for admin approval.",
    joinedAt: timestamp,
    createdAt: timestamp,
  };

  await insertRows(supabase, TABLES.users, [mapUserToRow(user)]);
  return user;
}

export async function createClubInvite(
  supabase: TypedSupabase,
  { createdBy, email, label }: { createdBy: string; email: string; label: string },
) {
  const invite: ClubInvite = {
    id: generateId("invite"),
    code: generateInviteCode(),
    label: String(label || "").trim(),
    email: String(email || "").trim().toLowerCase(),
    usedBy: null,
    createdBy,
    createdAt: new Date().toISOString(),
    usedAt: null,
  };

  await insertRows(supabase, TABLES.invites, [mapInviteToRow(invite)]);
  return invite;
}

export async function createClubSession(supabase: TypedSupabase, session: ClubSession) {
  await insertRows(supabase, TABLES.sessions, [mapSessionToRow(session)]);
  return session;
}

export async function updateClubSession(
  supabase: TypedSupabase,
  sessionId: string,
  updates: Partial<
    Pick<
      ClubSession,
      | "title"
      | "date"
      | "startTime"
      | "endTime"
      | "location"
      | "mapLink"
      | "courtsBooked"
      | "maxPlayers"
      | "costPerPlayer"
    >
  >,
) {
  const payload: Database["public"]["Tables"]["club_sessions"]["Update"] = {};

  if (updates.title !== undefined) {
    payload.title = updates.title.trim();
  }

  if (updates.date !== undefined) {
    payload.date = updates.date;
  }

  if (updates.startTime !== undefined) {
    payload.start_time = updates.startTime;
  }

  if (updates.endTime !== undefined) {
    payload.end_time = updates.endTime;
  }

  if (updates.location !== undefined) {
    payload.location = updates.location.trim();
  }

  if (updates.mapLink !== undefined) {
    payload.map_link = updates.mapLink.trim() || null;
  }

  if (updates.courtsBooked !== undefined) {
    payload.courts_booked = Number(updates.courtsBooked || 0);
  }

  if (updates.maxPlayers !== undefined) {
    payload.max_players = Number(updates.maxPlayers || 0);
  }

  if (updates.costPerPlayer !== undefined) {
    payload.cost_per_player = Number(updates.costPerPlayer || 0);
  }

  const { data, error } = await supabase
    .from(TABLES.sessions)
    .update(payload)
    .eq("id", sessionId)
    .select("id")
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error("Session update failed. The session was not found or update access is blocked.");
  }
}

export async function saveClubRsvp(supabase: TypedSupabase, rsvp: ClubRsvp) {
  const { data: existing, error: existingError } = await supabase
    .from(TABLES.rsvps)
    .select("id")
    .eq("session_id", rsvp.sessionId)
    .eq("user_id", rsvp.userId)
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  if (existing) {
    const { error: updateError } = await supabase
      .from(TABLES.rsvps)
      .update(mapRsvpToRow({ ...rsvp, id: existing.id }))
      .eq("id", existing.id);

    if (updateError) {
      throw updateError;
    }
  } else {
    await insertRows(supabase, TABLES.rsvps, [mapRsvpToRow(rsvp)]);
  }

  return rsvp;
}

export async function updateClubUserApproval(
  supabase: TypedSupabase,
  {
    userId,
    approved,
    role,
  }: {
    userId: string;
    approved: boolean;
    role?: ClubRole;
  },
) {
  const { data, error } = await supabase
    .from(TABLES.users)
    .update({
      approved,
      role: role ?? (approved ? "player" : "pending"),
      tier: approved ? "Rookie" : "Pending",
    })
    .eq("id", userId)
    .select("id, role, approved")
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error("Approval update failed. The user was not found or update access is blocked.");
  }
}

export async function updateClubUserProfile(
  supabase: TypedSupabase,
  {
    userId,
    tier,
    homeVenue,
  }: {
    userId: string;
    tier: string;
    homeVenue: string;
  },
) {
  const { data, error } = await supabase
    .from(TABLES.users)
    .update({
      tier: tier.trim(),
      home_venue: homeVenue.trim(),
    })
    .eq("id", userId)
    .select("id, tier, home_venue")
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error("Profile update failed. The user was not found or update access is blocked.");
  }
}

export async function setClubPaymentStatus(
  supabase: TypedSupabase,
  paymentId: string,
  status: ClubPayment["status"],
) {
  const { error } = await supabase
    .from(TABLES.payments)
    .update({
      status,
    })
    .eq("id", paymentId);

  if (error) {
    throw error;
  }
}

export async function settleClubSession(
  supabase: TypedSupabase,
  {
    sessionId,
    totalCost,
    note,
  }: {
    sessionId: string;
    totalCost: number;
    note?: string;
  },
) {
  const db = await fetchClubDb(supabase);
  const session = db.sessions.find((entry) => entry.id === sessionId);

  if (!session) {
    throw new Error("That session could not be found.");
  }

  const roster = getRoster(session, db);

  if (!roster.confirmedSlots) {
    return { paymentsCreated: 0, perSlotCost: 0 };
  }

  const perSlotCost = Math.round(totalCost / roster.confirmedSlots);
  const existingPayments = db.payments.filter((payment) => payment.sessionId === sessionId);
  const timestamp = new Date().toISOString();

  await Promise.all(
    roster.confirmed.map(async (entry) => {
      const slots = STATUS_META[entry.status].slots;
      const amount = perSlotCost * slots;
      const existingPayment = existingPayments.find((payment) => payment.userId === entry.userId);
      const nextNote =
        note?.trim() ||
        (entry.status === "plus" ? "Settled for player + guest" : "Settled court cost");

      if (existingPayment) {
        const { error } = await supabase
          .from(TABLES.payments)
          .update({
            amount,
            note: nextNote,
            status: existingPayment.status === "credit" ? "credit" : "due",
          })
          .eq("id", existingPayment.id);

        if (error) {
          throw error;
        }
      } else {
        const payment: ClubPayment = {
          id: generateId("pay"),
          userId: entry.userId,
          sessionId,
          amount,
          status: "due",
          note: nextNote,
          createdAt: timestamp,
        };

        await insertRows(supabase, TABLES.payments, [mapPaymentToRow(payment)]);
      }
    }),
  );

  return {
    paymentsCreated: roster.confirmed.length,
    perSlotCost,
  };
}

export async function syncClubSessionCharges(
  supabase: TypedSupabase,
  {
    sessionId,
    costPerPlayer,
    note,
    audit,
  }: {
    sessionId: string;
    costPerPlayer: number;
    note?: string;
    audit?: { actorId: string };
  },
) {
  const db = await fetchClubDb(supabase);
  const session = db.sessions.find((entry) => entry.id === sessionId);

  if (!session) {
    throw new Error("That session could not be found.");
  }

  const existingPayments = db.payments.filter((payment) => payment.sessionId === sessionId);

  if (costPerPlayer <= 0) {
    await Promise.all(
      existingPayments
        .filter((payment) => payment.status === "due")
        .map(async (payment) => {
          const { error } = await supabase.from(TABLES.payments).delete().eq("id", payment.id);

          if (error) {
            throw error;
          }
        }),
    );

    return {
      paymentsUpdated: 0,
      paymentsRemoved: existingPayments.filter((payment) => payment.status === "due").length,
    };
  }

  const roster = getRoster(session, db);
  const timestamp = new Date().toISOString();
  const confirmedCharges = new Map(
    roster.confirmed.map((entry) => {
      const slots = STATUS_META[entry.status].slots;
      const amount = costPerPlayer * slots;
      const baseNote =
        note?.trim() ||
        (entry.status === "plus"
          ? `Session charge at ${costPerPlayer} per spot for player + guest`
          : `Session charge at ${costPerPlayer} per player`);
      const nextNote = audit
        ? `${baseNote} [SETTLED_BY:${audit.actorId}|${timestamp}]`
        : baseNote;

      return [entry.userId, { amount, note: nextNote }];
    }),
  );

  await Promise.all(
    existingPayments.map(async (payment) => {
      const nextCharge = confirmedCharges.get(payment.userId);

      if (!nextCharge) {
        if (payment.status !== "due") {
          return;
        }

        const { error } = await supabase.from(TABLES.payments).delete().eq("id", payment.id);

        if (error) {
          throw error;
        }

        return;
      }

      const nextStatus =
        payment.status === "credit"
          ? "credit"
          : payment.status === "paid" && payment.amount === nextCharge.amount
            ? "paid"
            : "due";

      const { error } = await supabase
        .from(TABLES.payments)
        .update({
          amount: nextCharge.amount,
          note: nextCharge.note,
          status: nextStatus,
        })
        .eq("id", payment.id);

      if (error) {
        throw error;
      }

      confirmedCharges.delete(payment.userId);
    }),
  );

  await Promise.all(
    Array.from(confirmedCharges.entries()).map(async ([userId, charge]) => {
      const payment: ClubPayment = {
        id: generateId("pay"),
        userId,
        sessionId,
        amount: charge.amount,
        status: "due",
        note: charge.note,
        createdAt: timestamp,
      };

      await insertRows(supabase, TABLES.payments, [mapPaymentToRow(payment)]);
    }),
  );

  return {
    paymentsUpdated: roster.confirmed.length,
    paymentsRemoved: existingPayments.length - roster.confirmed.length,
  };
}

async function insertRows<T extends keyof Database["public"]["Tables"]>(
  supabase: TypedSupabase,
  table: T,
  rows: Database["public"]["Tables"][T]["Insert"][],
) {
  const { error } = await supabase
    .from(table)
    .insert(rows as never);

  if (error) {
    throw error;
  }
}

function unwrapRows<T>(
  result: { error: { message: string } | null; data: T[] | null },
  label: string,
) {
  if (result.error) {
    throw new Error(`Failed to load ${label}: ${result.error.message}`);
  }

  return result.data || [];
}

function isMissingSessionError(error: { message?: string; name?: string; status?: number }) {
  return (
    error.name === "AuthSessionMissingError" ||
    error.message === "Auth session missing!" ||
    error.status === 400
  );
}

function mapLegacyGamesToSessions(
  rows: Database["public"]["Tables"]["games"]["Row"][],
): ClubSession[] {
  return rows
    .filter((row) => row.status !== "cancelled")
    .map((row) => {
      const startTime = normalizeLegacyTime(row.time);
      return {
        id: row.id,
        title: "Legacy session",
        date: row.date,
        startTime,
        endTime: addHours(startTime, 2),
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
    .sort((a, b) => new Date(`${a.date}T${a.startTime}:00`).getTime() - new Date(`${b.date}T${b.startTime}:00`).getTime());
}

function normalizeLegacyTime(value: string) {
  return value.slice(0, 5);
}

function addHours(time: string, hoursToAdd: number) {
  const [hour, minute] = time.split(":").map(Number);
  const total = (hour * 60 + minute + hoursToAdd * 60) % (24 * 60);
  const nextHour = `${Math.floor(total / 60)}`.padStart(2, "0");
  const nextMinute = `${total % 60}`.padStart(2, "0");
  return `${nextHour}:${nextMinute}`;
}
