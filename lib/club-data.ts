import type {
  AdminPaymentView,
  AdminStats,
  ClubDb,
  ClubInvite,
  ClubInviteRow,
  ClubPayment,
  ClubPaymentRow,
  ClubRole,
  ClubRoster,
  ClubRsvp,
  ClubRsvpRow,
  ClubSession,
  ClubSessionRow,
  ClubUser,
  ClubUserRow,
  MemberSummary,
  PaymentStatus,
  PlayerHistoryEntry,
  RsvpStatus,
  UserPaymentView,
} from "@/types";
import { buildSessionDate, formatDateInput, generateInviteCode, shiftDays, toTimestamp } from "@/lib/utils";

export const TABLES = {
  users: "club_users",
  sessions: "club_sessions",
  rsvps: "club_rsvps",
  invites: "club_invites",
  payments: "club_payments",
} as const;

export const PENDING_INVITE_COOKIE = "smash-club.pending-invite";

export const STATUS_META: Record<
  RsvpStatus,
  { label: string; shortLabel: string; hint: string; slots: number }
> = {
  in: {
    label: "In",
    shortLabel: "Confirmed",
    hint: "Locked into the match",
    slots: 1,
  },
  tentative: {
    label: "Tentative",
    shortLabel: "Maybe",
    hint: "Still deciding",
    slots: 0,
  },
  plus: {
    label: "+1",
    shortLabel: "Bringing a friend",
    hint: "Counts as two spots",
    slots: 2,
  },
  out: {
    label: "Out",
    shortLabel: "Unavailable",
    hint: "Not coming",
    slots: 0,
  },
};

export const PAYMENT_STATUS_META: Record<PaymentStatus, { label: string; tone: string }> = {
  paid: {
    label: "Settled",
    tone: "positive",
  },
  due: {
    label: "Pending",
    tone: "warning",
  },
  pending: {
    label: "Submitted",
    tone: "info",
  },
  credit: {
    label: "Credit",
    tone: "info",
  },
};

export function createSeedDb(): ClubDb {
  const now = new Date();
  const pastA = shiftDays(now, -14);
  const pastB = shiftDays(now, -6);
  const futureA = shiftDays(now, 1);
  const futureB = shiftDays(now, 3);
  const futureC = shiftDays(now, 6);
  const futureD = shiftDays(now, 9);

  const users: ClubUser[] = [
    createUser("user-admin", "Court Captain", "admin@smashclub.app", "admin", {
      tier: "Director",
      homeVenue: "Velocity Sports Arena",
      bio: "Coordinates bookings, lineups, and player access.",
      joinedAt: shiftDays(now, -120).toISOString(),
    }),
    createUser("user-mira", "Mira Patel", "mira@smashclub.app", "player", {
      tier: "Gold Tier",
      homeVenue: "Velocity Sports Arena",
      bio: "Fast doubles specialist with a love for high-tempo evening sessions.",
      joinedAt: shiftDays(now, -84).toISOString(),
    }),
    createUser("user-arjun", "Arjun Nair", "arjun@smashclub.app", "player", {
      tier: "Platinum",
      homeVenue: "Bluebird Badminton Hub",
      bio: "Brings guests often and helps fill late-session spots.",
      joinedAt: shiftDays(now, -66).toISOString(),
    }),
    createUser("user-sana", "Sana Roy", "sana@smashclub.app", "player", {
      tier: "Silver",
      homeVenue: "Northline Shuttle Club",
      bio: "Prefers weekend rallies and early lock-ins.",
      joinedAt: shiftDays(now, -51).toISOString(),
    }),
    createUser("user-dev", "Dev Menon", "dev@smashclub.app", "player", {
      tier: "Silver",
      homeVenue: "Velocity Sports Arena",
      bio: "Usually confirms close to match time and handles venue split payments.",
      joinedAt: shiftDays(now, -42).toISOString(),
    }),
    createUser("user-isha", "Isha Kapoor", "isha@smashclub.app", "player", {
      tier: "Rising",
      homeVenue: "Northline Shuttle Club",
      bio: "Consistent attendance and quick roster responses.",
      joinedAt: shiftDays(now, -28).toISOString(),
    }),
  ];

  const sessions: ClubSession[] = [
    createSession("session-past-1", pastA, "19:00", "21:00", {
      location: "Velocity Sports Arena",
      mapLink: "https://maps.google.com/?q=Velocity%20Sports%20Arena",
      courtsBooked: 2,
      maxPlayers: 8,
      costPerPlayer: 320,
      title: "Wednesday Power Rotation",
      createdBy: "user-admin",
    }),
    createSession("session-past-2", pastB, "07:00", "09:00", {
      location: "Northline Shuttle Club",
      mapLink: "https://maps.google.com/?q=Northline%20Shuttle%20Club",
      courtsBooked: 2,
      maxPlayers: 6,
      costPerPlayer: 260,
      title: "Sunrise Ladder Matches",
      createdBy: "user-admin",
    }),
    createSession("session-1", futureA, "19:00", "21:00", {
      location: "Velocity Sports Arena",
      mapLink: "https://maps.google.com/?q=Velocity%20Sports%20Arena",
      courtsBooked: 2,
      maxPlayers: 8,
      costPerPlayer: 320,
      title: "Prime Court Night",
      createdBy: "user-admin",
    }),
    createSession("session-2", futureB, "18:30", "20:30", {
      location: "Bluebird Badminton Hub",
      mapLink: "https://maps.google.com/?q=Bluebird%20Badminton%20Hub",
      courtsBooked: 3,
      maxPlayers: 10,
      costPerPlayer: 280,
      title: "Thursday Ladder Session",
      createdBy: "user-admin",
    }),
    createSession("session-3", futureC, "07:00", "09:00", {
      location: "Northline Shuttle Club",
      mapLink: "https://maps.google.com/?q=Northline%20Shuttle%20Club",
      courtsBooked: 2,
      maxPlayers: 6,
      costPerPlayer: 260,
      title: "Weekend Sunrise Run",
      createdBy: "user-admin",
    }),
    createSession("session-4", futureD, "20:00", "22:00", {
      location: "Rally Works Indoor Arena",
      mapLink: "https://maps.google.com/?q=Rally%20Works%20Indoor%20Arena",
      courtsBooked: 3,
      maxPlayers: 12,
      costPerPlayer: 300,
      title: "Club Championship Mixer",
      createdBy: "user-admin",
    }),
  ];

  const rsvps: ClubRsvp[] = [
    createRsvp("rsvp-p1-1", "session-past-1", "user-mira", "in", pastA, -18),
    createRsvp("rsvp-p1-2", "session-past-1", "user-arjun", "plus", pastA, -17),
    createRsvp("rsvp-p1-3", "session-past-1", "user-sana", "in", pastA, -15),
    createRsvp("rsvp-p1-4", "session-past-1", "user-dev", "out", pastA, -12),
    createRsvp("rsvp-p1-5", "session-past-1", "user-isha", "in", pastA, -10),
    createRsvp("rsvp-p2-1", "session-past-2", "user-mira", "plus", pastB, -14),
    createRsvp("rsvp-p2-2", "session-past-2", "user-arjun", "in", pastB, -13),
    createRsvp("rsvp-p2-3", "session-past-2", "user-sana", "tentative", pastB, -11),
    createRsvp("rsvp-p2-4", "session-past-2", "user-dev", "in", pastB, -9),
    createRsvp("rsvp-p2-5", "session-past-2", "user-isha", "in", pastB, -8),
    createRsvp("rsvp-1", "session-1", "user-mira", "in", futureA, -8),
    createRsvp("rsvp-2", "session-1", "user-arjun", "plus", futureA, -7),
    createRsvp("rsvp-3", "session-1", "user-sana", "tentative", futureA, -6),
    createRsvp("rsvp-4", "session-1", "user-dev", "in", futureA, -5),
    createRsvp("rsvp-5", "session-1", "user-isha", "in", futureA, -4),
    createRsvp("rsvp-6", "session-2", "user-mira", "plus", futureB, -3),
    createRsvp("rsvp-7", "session-2", "user-arjun", "in", futureB, -2),
    createRsvp("rsvp-8", "session-2", "user-sana", "in", futureB, -1.5),
    createRsvp("rsvp-9", "session-2", "user-dev", "out", futureB, -1),
    createRsvp("rsvp-10", "session-3", "user-isha", "in", futureC, -2),
    createRsvp("rsvp-11", "session-3", "user-mira", "tentative", futureC, -1.5),
    createRsvp("rsvp-12", "session-4", "user-arjun", "in", futureD, -1),
  ];

  const invites: ClubInvite[] = [
    {
      id: "invite-1",
      code: "COURT-LITE-77",
      label: "Friday open invite",
      email: "",
      usedBy: null,
      createdBy: "user-admin",
      createdAt: now.toISOString(),
      usedAt: null,
    },
    {
      id: "invite-2",
      code: "SMASH-NET-18",
      label: "Reserved guest slot",
      email: "guest@smashclub.app",
      usedBy: null,
      createdBy: "user-admin",
      createdAt: shiftDays(now, -1).toISOString(),
      usedAt: null,
    },
  ];

  const payments: ClubPayment[] = [
    createPayment("pay-1", "user-mira", "session-past-1", 320, "paid", pastA, "Court split"),
    createPayment("pay-2", "user-arjun", "session-past-1", 640, "paid", pastA, "Player + guest"),
    createPayment("pay-3", "user-isha", "session-past-1", 320, "paid", pastA, "Court split"),
    createPayment("pay-4", "user-mira", "session-past-2", 520, "paid", pastB, "Player + guest"),
    createPayment("pay-5", "user-dev", "session-past-2", 260, "paid", pastB, "Court split"),
    createPayment("pay-6", "user-isha", "session-past-2", 260, "paid", pastB, "Court split"),
    createPayment("pay-7", "user-mira", "session-1", 320, "due", futureA, "Tonight's slot"),
    createPayment("pay-8", "user-arjun", "session-1", 640, "due", futureA, "Player + guest"),
    createPayment("pay-9", "user-dev", "session-1", 320, "due", futureA, "Tonight's slot"),
    createPayment("pay-10", "user-isha", "session-1", 320, "due", futureA, "Tonight's slot"),
    createPayment("pay-11", "user-mira", "session-2", 560, "due", futureB, "Doubles + guest"),
    createPayment("pay-12", "user-arjun", "session-2", 280, "paid", futureB, "Advance booking"),
    createPayment("pay-13", "user-sana", "session-2", 280, "credit", futureB, "Paid from wallet credit"),
    createPayment("pay-14", "user-isha", "session-3", 260, "due", futureC, "Sunrise booking"),
    createPayment("pay-15", "user-arjun", "session-4", 300, "due", futureD, "Mixer booking"),
  ];

  return {
    users,
    sessions,
    rsvps,
    invites,
    payments,
  };
}

export function getSortedSessions(sessions: ClubSession[]) {
  return [...sessions].sort((left, right) => {
    const leftDate = buildSessionDate(left.date, left.startTime);
    const rightDate = buildSessionDate(right.date, right.startTime);
    return leftDate.getTime() - rightDate.getTime();
  });
}

export function getUpcomingSessions(sessions: ClubSession[], now = Date.now()) {
  const currentTime = toTimestamp(now);
  return getSortedSessions(sessions).filter(
    (session) => buildSessionDate(session.date, session.endTime).getTime() >= currentTime,
  );
}

export function getPastSessions(sessions: ClubSession[], now = Date.now()) {
  const currentTime = toTimestamp(now);
  return getSortedSessions(sessions)
    .filter((session) => buildSessionDate(session.date, session.endTime).getTime() < currentTime)
    .reverse();
}

export function getRoster(session: ClubSession, db: Pick<ClubDb, "users" | "rsvps">): ClubRoster {
  const responses = db.rsvps
    .filter((entry) => entry.sessionId === session.id)
    .map((entry) => ({
      ...entry,
      user: db.users.find((user) => user.id === entry.userId),
    }))
    .filter((entry): entry is ClubRoster["confirmed"][number] => Boolean(entry.user))
    .sort((left, right) => new Date(left.updatedAt).getTime() - new Date(right.updatedAt).getTime());

  const confirmed: ClubRoster["confirmed"] = [];
  const waitlist: ClubRoster["waitlist"] = [];
  const tentative: ClubRoster["tentative"] = [];
  const out: ClubRoster["out"] = [];
  let confirmedSlots = 0;

  responses.forEach((entry) => {
    if (entry.status === "tentative") {
      tentative.push(entry);
      return;
    }

    if (entry.status === "out") {
      out.push(entry);
      return;
    }

    const neededSlots = STATUS_META[entry.status].slots;

    if (confirmedSlots + neededSlots <= session.maxPlayers) {
      confirmed.push(entry);
      confirmedSlots += neededSlots;
    } else {
      waitlist.push(entry);
    }
  });

  return {
    confirmed,
    waitlist,
    tentative,
    out,
    confirmedSlots,
    remainingSlots: Math.max(0, session.maxPlayers - confirmedSlots),
  };
}

export function getLockState(session: ClubSession, now = Date.now()) {
  const sessionStart = buildSessionDate(session.date, session.startTime);
  const lockTime = new Date(sessionStart.getTime() - 60 * 60 * 1000);
  const currentTime = toTimestamp(now);

  return {
    isLocked: currentTime >= lockTime.getTime(),
    lockTime,
    remainingMs: Math.max(0, lockTime.getTime() - currentTime),
    sessionStart,
  };
}

export function getUserRsvp(sessionId: string, userId: string, db: Pick<ClubDb, "rsvps">) {
  return db.rsvps.find((entry) => entry.sessionId === sessionId && entry.userId === userId);
}

export function getAdminStats(db: ClubDb, now = Date.now()): AdminStats {
  const upcomingSessions = getUpcomingSessions(db.sessions, now);
  const paidPayments = db.payments.filter((payment) => payment.status === "paid");
  const pendingPayments = db.payments.filter((payment) => payment.status === "due");

  return {
    sessions: upcomingSessions.length,
    confirmedPlayers: upcomingSessions.reduce(
      (total, session) => total + getRoster(session, db).confirmedSlots,
      0,
    ),
    waitlisted: upcomingSessions.reduce(
      (total, session) => total + getRoster(session, db).waitlist.length,
      0,
    ),
    collected: paidPayments.reduce((total, payment) => total + payment.amount, 0),
    pending: pendingPayments.reduce((total, payment) => total + payment.amount, 0),
  };
}

export function getPlayerHistory(userId: string, db: ClubDb, now = Date.now()): PlayerHistoryEntry[] {
  return getPastSessions(db.sessions, now).flatMap((session) => {
    const response = getUserRsvp(session.id, userId, db);

    if (!response) {
      return [];
    }

    return [
      {
        session,
        response,
        roster: getRoster(session, db),
        payment: db.payments.find(
          (payment) => payment.sessionId === session.id && payment.userId === userId,
        ),
      },
    ];
  });
}

export function getUserPayments(userId: string, db: ClubDb): UserPaymentView[] {
  return [...db.payments]
    .filter((payment) => payment.userId === userId)
    .map((payment) => ({
      ...payment,
      session: db.sessions.find((session) => session.id === payment.sessionId),
    }))
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
}

export function getAdminPayments(db: ClubDb): AdminPaymentView[] {
  return [...db.payments]
    .map((payment) => ({
      ...payment,
      user: db.users.find((user) => user.id === payment.userId),
      session: db.sessions.find((session) => session.id === payment.sessionId),
    }))
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
}

export function getMemberSummaries(db: ClubDb, now = Date.now()): MemberSummary[] {
  const upcomingSessions = getUpcomingSessions(db.sessions, now);

  return db.users
    .filter((user) => user.role !== "admin")
    .map((user) => {
      const currentResponse = upcomingSessions
        .map((session) => ({
          session,
          response: getUserRsvp(session.id, user.id, db),
        }))
        .find((entry): entry is { session: ClubSession; response: ClubRsvp } => Boolean(entry.response));

      const payments = getUserPayments(user.id, db);
      const paidTotal = payments
        .filter((payment) => payment.status === "paid" || payment.status === "credit")
        .reduce((total, payment) => total + payment.amount, 0);
      const pendingTotal = payments
        .filter((payment) => payment.status === "due")
        .reduce((total, payment) => total + payment.amount, 0);
      const history = getPlayerHistory(user.id, db, now);

      return {
        user,
        currentResponse: currentResponse?.response ? currentResponse : undefined,
        paidTotal,
        pendingTotal,
        attendanceCount: history.filter((entry) => entry.response.status !== "out").length,
      };
    })
    .sort((left, right) => left.user.name.localeCompare(right.user.name));
}

export function mapUserToRow(user: ClubUser): ClubUserRow {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    password: user.password,
    role: user.role,
    approved: Boolean(user.approved),
    tier: user.tier || null,
    home_venue: user.homeVenue || null,
    bio: user.bio || null,
    joined_at: user.joinedAt || user.createdAt || new Date().toISOString(),
    created_at: user.createdAt || user.joinedAt || new Date().toISOString(),
  };
}

export function mapSessionToRow(session: ClubSession): ClubSessionRow {
  return {
    id: session.id,
    title: session.title,
    date: session.date,
    start_time: session.startTime,
    end_time: session.endTime,
    location: session.location,
    map_link: session.mapLink || null,
    courts_booked: Number(session.courtsBooked || 0),
    max_players: Number(session.maxPlayers || 0),
    cost_per_player: Number(session.costPerPlayer || 0),
    created_by: session.createdBy || null,
    created_at: session.createdAt || new Date().toISOString(),
  };
}

export function mapRsvpToRow(rsvp: ClubRsvp): ClubRsvpRow {
  return {
    id: rsvp.id,
    session_id: rsvp.sessionId,
    user_id: rsvp.userId,
    status: rsvp.status,
    updated_at: rsvp.updatedAt || new Date().toISOString(),
  };
}

export function mapInviteToRow(invite: ClubInvite): ClubInviteRow {
  return {
    id: invite.id,
    code: invite.code,
    label: invite.label || null,
    email: invite.email || null,
    used_by: invite.usedBy || null,
    created_by: invite.createdBy || null,
    created_at: invite.createdAt || new Date().toISOString(),
    used_at: invite.usedAt || null,
  };
}

export function mapPaymentToRow(payment: ClubPayment): ClubPaymentRow {
  return {
    id: payment.id,
    user_id: payment.userId,
    session_id: payment.sessionId || null,
    amount: Number(payment.amount || 0),
    status: payment.status,
    note: payment.note || null,
    created_at: payment.createdAt || new Date().toISOString(),
  };
}

export function mapUserFromRow(row: ClubUserRow): ClubUser {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    password: row.password,
    role: (row.role || "player") as ClubRole,
    approved: Boolean(row.approved),
    tier: row.tier || "Club",
    homeVenue: row.home_venue || "Velocity Sports Arena",
    bio: row.bio || "",
    joinedAt: row.joined_at || row.created_at,
    createdAt: row.created_at || row.joined_at,
  };
}

export function mapSessionFromRow(row: ClubSessionRow): ClubSession {
  return {
    id: row.id,
    title: row.title,
    date: row.date,
    startTime: row.start_time.slice(0, 5),
    endTime: row.end_time.slice(0, 5),
    location: row.location,
    mapLink: row.map_link || "",
    courtsBooked: Number(row.courts_booked || 0),
    maxPlayers: Number(row.max_players || 0),
    costPerPlayer: Number(row.cost_per_player || 0),
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}

export function mapRsvpFromRow(row: ClubRsvpRow): ClubRsvp {
  return {
    id: row.id,
    sessionId: row.session_id,
    userId: row.user_id,
    status: row.status as RsvpStatus,
    updatedAt: row.updated_at,
  };
}

export function mapInviteFromRow(row: ClubInviteRow): ClubInvite {
  return {
    id: row.id,
    code: row.code,
    label: row.label || "",
    email: row.email || "",
    usedBy: row.used_by,
    createdBy: row.created_by,
    createdAt: row.created_at,
    usedAt: row.used_at,
  };
}

export function mapPaymentFromRow(row: ClubPaymentRow): ClubPayment {
  return {
    id: row.id,
    userId: row.user_id,
    sessionId: row.session_id,
    amount: Number(row.amount || 0),
    status: row.status as PaymentStatus,
    note: row.note || "",
    createdAt: row.created_at,
  };
}

function createUser(
  id: string,
  name: string,
  email: string,
  role: ClubRole,
  details: Partial<ClubUser> = {},
): ClubUser {
  return {
    id,
    name,
    email,
    password: `${role}-seed-password`,
    role,
    approved: role !== "pending",
    tier: "Club",
    homeVenue: "Velocity Sports Arena",
    bio: "",
    joinedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    ...details,
  };
}

function createSession(
  id: string,
  dateValue: Date,
  startTime: string,
  endTime: string,
  details: Pick<
    ClubSession,
    "location" | "mapLink" | "courtsBooked" | "maxPlayers" | "costPerPlayer" | "title" | "createdBy"
  >,
): ClubSession {
  return {
    id,
    date: formatDateInput(dateValue),
    startTime,
    endTime,
    location: details.location,
    mapLink: details.mapLink,
    courtsBooked: details.courtsBooked,
    maxPlayers: details.maxPlayers,
    costPerPlayer: details.costPerPlayer,
    title: details.title,
    createdBy: details.createdBy,
    createdAt: new Date().toISOString(),
  };
}

function createRsvp(
  id: string,
  sessionId: string,
  userId: string,
  status: RsvpStatus,
  anchorDate: Date,
  hoursBefore: number,
): ClubRsvp {
  return {
    id,
    sessionId,
    userId,
    status,
    updatedAt: new Date(anchorDate.getTime() + hoursBefore * 60 * 60 * 1000).toISOString(),
  };
}

function createPayment(
  id: string,
  userId: string,
  sessionId: string | null,
  amount: number,
  status: PaymentStatus,
  anchorDate: Date,
  note: string,
): ClubPayment {
  return {
    id,
    userId,
    sessionId,
    amount,
    status,
    note,
    createdAt: new Date(anchorDate.getTime()).toISOString(),
  };
}

export { generateInviteCode };
