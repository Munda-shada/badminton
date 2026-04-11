import { redirect } from "next/navigation";
import { cache } from "react";

import { ensureClubSeedData, getAuthenticatedClubUser } from "@/lib/club-data-service";
import { getRequestSupabase } from "@/lib/supabase/server";
import type { ClubRole, ClubUser } from "@/types";

const loadAuthContext = cache(async () => {
  const supabase = await getRequestSupabase();
  await ensureClubSeedData(supabase);
  const { authUser, clubUser } = await getAuthenticatedClubUser(supabase);

  return {
    supabase,
    authUser,
    clubUser,
  };
});

export async function getOptionalClubUser() {
  return loadAuthContext();
}

export async function requireClubUser(options?: { allowRoles?: ClubRole[] }) {
  const { supabase, authUser, clubUser } = await loadAuthContext();

  if (!authUser) {
    redirect("/login");
  }

  if (!clubUser) {
    redirect("/unauthorized?reason=invite");
  }

  if (!clubUser.approved || clubUser.role === "pending") {
    redirect("/unauthorized?reason=pending");
  }

  if (options?.allowRoles && !options.allowRoles.includes(clubUser.role)) {
    redirect(getHomePathForUser(clubUser));
  }

  return {
    supabase,
    authUser,
    clubUser,
  };
}

export function getHomePathForUser(user: Pick<ClubUser, "role">) {
  return user.role === "admin" ? "/admin" : "/player";
}
