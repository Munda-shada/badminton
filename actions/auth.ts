"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export async function signInWithGoogleAction(formData: FormData) {
  const next = normalizeNextPath(String(formData.get("next") || "/"));
  const supabase = await createClient();
  const headerStore = await headers();

  const origin = resolveOrigin(headerStore);
  const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent(next)}`;
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      queryParams: {
        prompt: "select_account",
      },
    },
  });

  if (error || !data.url) {
    redirect("/login?error=oauth");
  }

  redirect(data.url);
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

function resolveOrigin(headerStore: Awaited<ReturnType<typeof headers>>) {
  const directOrigin = headerStore.get("origin");

  if (directOrigin) {
    return directOrigin;
  }

  const forwardedProto = headerStore.get("x-forwarded-proto");
  const forwardedHost = headerStore.get("x-forwarded-host");
  const host = forwardedHost || headerStore.get("host") || "localhost:3000";
  const protocol =
    forwardedProto || (host.includes("localhost") || host.startsWith("192.168.") ? "http" : "https");

  return `${protocol}://${host}`;
}

function normalizeNextPath(value: string) {
  if (!value.startsWith("/")) {
    return "/";
  }

  return value;
}
