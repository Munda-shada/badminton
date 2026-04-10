import { redirect } from "next/navigation";

import { ensureClubSeedData, getAuthenticatedClubUser } from "@/lib/club-data-service";
import { createClient } from "@/lib/supabase/server";
import type { ClubRole, ClubUser } from "@/types";

export async function getOptionalClubUser() {
  const supabase = await createClient();
  await ensureClubSeedData(supabase);
  const { authUser, clubUser } = await getAuthenticatedClubUser(supabase);

  return {
    supabase,
    authUser,
    clubUser,
  };
}

export async function requireClubUser(options?: { allowRoles?: ClubRole[] }) {
  const { supabase, authUser, clubUser } = await getOptionalClubUser();

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
