"use server";

import { revalidatePath } from "next/cache";

import { createClubInvite, updateClubUserApproval, updateClubUserProfile } from "@/lib/club-data-service";
import { requireClubUser } from "@/lib/club-auth";
import { createAdminClient } from "@/lib/supabase/server";

export async function createInviteAction(formData: FormData) {
  const { supabase, clubUser } = await requireClubUser({ allowRoles: ["admin"] });

  await createClubInvite(supabase, {
    createdBy: clubUser.id,
    email: String(formData.get("email") || "")
      .trim()
      .toLowerCase(),
    label: String(formData.get("label") || "").trim(),
  });

  revalidatePath("/admin/members");
}

export async function approveMemberAction(formData: FormData) {
  await requireClubUser({ allowRoles: ["admin"] });
  const userId = String(formData.get("userId") || "").trim();

  if (!userId) {
    return;
  }

  const adminSupabase = createAdminClient();

  await updateClubUserApproval(adminSupabase, {
    userId,
    approved: true,
    role: "player",
  });

  revalidatePath("/admin/members");
}

const PROFILE_TIERS = new Set([
  "Beginner",
  "Beginner+",
  "Intermediate",
  "Intermediate+",
  "Advanced",
  "Professional",
]);

export async function updatePlayerProfileAction(formData: FormData) {
  const { clubUser } = await requireClubUser({ allowRoles: ["admin", "player"] });
  const tier = String(formData.get("tier") || "").trim();
  const homeVenue = String(formData.get("homeVenue") || "").trim();

  if (!PROFILE_TIERS.has(tier)) {
    throw new Error("Choose a valid tier.");
  }

  if (!homeVenue) {
    throw new Error("Home venue is required.");
  }

  const adminSupabase = createAdminClient();
  await updateClubUserProfile(adminSupabase, {
    userId: clubUser.id,
    tier,
    homeVenue,
  });

  revalidatePath("/player");
  revalidatePath("/player/profile");
}
