import { NextResponse } from "next/server";

import { getHomePathForUser } from "@/lib/club-auth";
import {
  createPendingClubUser,
  ensureClubSeedData,
  getAuthenticatedClubUser,
} from "@/lib/club-data-service";
import { getRequestSupabase } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  let next = searchParams.get("next") ?? "/";

  if (!next.startsWith("/")) {
    next = "/";
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/auth/auth-code-error`);
  }

  const supabase = await getRequestSupabase();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin}/auth/auth-code-error`);
  }

  await ensureClubSeedData(supabase);

  const { authUser, clubUser } = await getAuthenticatedClubUser(supabase);

  if (!authUser?.email) {
    return NextResponse.redirect(`${origin}/login?error=unknown`);
  }

  let resolvedClubUser = clubUser;

  if (!resolvedClubUser) {
    resolvedClubUser = await createPendingClubUser(supabase, {
      email: authUser.email,
      name:
        authUser.user_metadata?.full_name ||
        authUser.user_metadata?.name ||
        authUser.email.split("@")[0],
      password: `google-oauth:${authUser.id}`,
    });
  }

  if (
    !resolvedClubUser.approved ||
    (resolvedClubUser.role !== "admin" && resolvedClubUser.role !== "player")
  ) {
    return NextResponse.redirect(`${origin}/unauthorized?reason=pending`);
  }

  const destination = next === "/" ? getHomePathForUser(resolvedClubUser) : next;
  return NextResponse.redirect(`${origin}${destination}`);
}
