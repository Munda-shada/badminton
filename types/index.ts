import type { Tables } from "@/types/database.types";

export type ClubRole = "admin" | "player" | "pending";
export type RsvpStatus = "in" | "tentative" | "plus" | "out";
export type PaymentStatus = "paid" | "due" | "credit" | "pending";

export type ClubUserRow = Tables<"club_users">;
export type ClubSessionRow = Tables<"club_sessions">;
export type ClubRsvpRow = Tables<"club_rsvps">;
export type ClubInviteRow = Tables<"club_invites">;
export type ClubPaymentRow = Tables<"club_payments">;

export interface ClubUser {
  id: string;
  name: string;
  email: string;
  password: string;
  role: ClubRole;
  approved: boolean;
  tier: string;
  homeVenue: string;
  bio: string;
  joinedAt: string;
  createdAt: string;
}

export interface ClubSession {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  mapLink: string;
  courtsBooked: number;
  maxPlayers: number;
  costPerPlayer: number;
  createdBy: string | null;
  createdAt: string;
}

export interface ClubRsvp {
  id: string;
  sessionId: string;
  userId: string;
  status: RsvpStatus;
  updatedAt: string;
}

export interface ClubInvite {
  id: string;
  code: string;
  label: string;
  email: string;
  usedBy: string | null;
  createdBy: string | null;
  createdAt: string;
  usedAt: string | null;
}

export interface ClubPayment {
  id: string;
  userId: string;
  sessionId: string | null;
  amount: number;
  status: PaymentStatus;
  note: string;
  createdAt: string;
}

export interface ClubDb {
  users: ClubUser[];
  sessions: ClubSession[];
  rsvps: ClubRsvp[];
  invites: ClubInvite[];
  payments: ClubPayment[];
}

export interface ClubRosterEntry extends ClubRsvp {
  user: ClubUser;
}

export interface ClubRoster {
  confirmed: ClubRosterEntry[];
  waitlist: ClubRosterEntry[];
  tentative: ClubRosterEntry[];
  out: ClubRosterEntry[];
  confirmedSlots: number;
  remainingSlots: number;
}

export interface UserPaymentView extends ClubPayment {
  session?: ClubSession;
}

export interface AdminPaymentView extends ClubPayment {
  session?: ClubSession;
  user?: ClubUser;
}

export interface PlayerHistoryEntry {
  session: ClubSession;
  response: ClubRsvp;
  roster: ClubRoster;
  payment?: ClubPayment;
}

export interface MemberSummary {
  user: ClubUser;
  currentResponse?: {
    session: ClubSession;
    response: ClubRsvp;
  };
  paidTotal: number;
  pendingTotal: number;
  attendanceCount: number;
}

export interface AdminStats {
  sessions: number;
  confirmedPlayers: number;
  waitlisted: number;
  collected: number;
  pending: number;
}
