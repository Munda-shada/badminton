-- Speed up common club queries (payments by member/session, RSVPs by session, sessions by date).
CREATE INDEX IF NOT EXISTS club_payments_user_id_idx ON public.club_payments (user_id);
CREATE INDEX IF NOT EXISTS club_payments_session_id_idx ON public.club_payments (session_id);
CREATE INDEX IF NOT EXISTS club_rsvps_session_id_idx ON public.club_rsvps (session_id);
CREATE INDEX IF NOT EXISTS club_sessions_date_idx ON public.club_sessions (date);
