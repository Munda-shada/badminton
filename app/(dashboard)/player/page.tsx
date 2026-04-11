import { Suspense } from "react";

import { PlayerHomeClient } from "@/components/player/PlayerHomeClient";
import { PageContentSkeleton } from "@/components/shared/PageContentSkeleton";
import { requireClubUser } from "@/lib/club-auth";

export default function PlayerDashboardPage() {
  return (
    <Suspense fallback={<PageContentSkeleton label="Checking access" />}>
      <PlayerDashboardShell />
    </Suspense>
  );
}

async function PlayerDashboardShell() {
  const { clubUser } = await requireClubUser({ allowRoles: ["admin", "player"] });
  return <PlayerHomeClient clubUser={clubUser} />;
}
