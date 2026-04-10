import { redirect } from "next/navigation";

import { getHomePathForUser, getOptionalClubUser } from "@/lib/club-auth";

export default async function HomePage() {
  const { authUser, clubUser } = await getOptionalClubUser();

  if (!authUser) {
    redirect("/login");
  }

  if (!clubUser || !clubUser.approved || clubUser.role === "pending") {
    redirect("/unauthorized");
  }

  redirect(getHomePathForUser(clubUser));
}
