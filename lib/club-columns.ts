/** PostgREST column lists — avoid `*` for smaller payloads and faster mapping. */

export const CLUB_USER_COLUMNS =
  "id,name,email,password,role,approved,tier,home_venue,bio,joined_at,created_at";

export const CLUB_SESSION_COLUMNS =
  "id,title,date,start_time,end_time,location,map_link,courts_booked,max_players,cost_per_player,created_by,created_at";

export const CLUB_RSVP_COLUMNS = "id,session_id,user_id,status,updated_at";

export const CLUB_INVITE_COLUMNS = "id,code,label,email,used_by,created_by,created_at,used_at";

export const CLUB_PAYMENT_COLUMNS = "id,user_id,session_id,amount,status,note,created_at";
