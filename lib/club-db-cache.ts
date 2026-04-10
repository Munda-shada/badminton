import { cache } from "react";

import { fetchClubDbForPageAdmin, fetchClubDbForPagePlayer } from "@/lib/club-data-service";
import { createClient } from "@/lib/supabase/server";

export const loadAdminClubDb = cache(async () => {
  const supabase = await createClient();
  return fetchClubDbForPageAdmin(supabase);
});

export const loadPlayerClubDb = cache(async (userId: string) => {
  const supabase = await createClient();
  return fetchClubDbForPagePlayer(supabase, userId);
});
