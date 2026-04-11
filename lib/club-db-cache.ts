import { cache } from "react";

import {
  countClubPayments,
  fetchClubDbForPageAdmin,
  fetchClubDbForPagePlayer,
} from "@/lib/club-data-service";
import { getRequestSupabase } from "@/lib/supabase/server";

export const loadAdminClubDb = cache(async () => {
  const supabase = await getRequestSupabase();
  return fetchClubDbForPageAdmin(supabase);
});

export const loadPlayerClubDb = cache(async (userId: string) => {
  const supabase = await getRequestSupabase();
  return fetchClubDbForPagePlayer(supabase, userId);
});

export const loadAdminPaymentTotalCount = cache(async () => {
  const supabase = await getRequestSupabase();
  return countClubPayments(supabase);
});
