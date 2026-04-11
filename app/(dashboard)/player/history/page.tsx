import { Suspense } from "react";

import { PlayerHistoryClient } from "@/components/player/PlayerHistoryClient";
import { PageContentSkeleton } from "@/components/shared/PageContentSkeleton";
import { requireClubUser } from "@/lib/club-auth";

export default function PlayerHistoryPage() {
  return (
    <Suspense fallback={<PageContentSkeleton label="Checking access" />}>
      <PlayerHistoryShell />
    </Suspense>
  );
}

async function PlayerHistoryShell() {
  const { clubUser } = await requireClubUser({ allowRoles: ["admin", "player"] });
  return <PlayerHistoryClient clubUser={clubUser} />;
}
