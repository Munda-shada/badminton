import { Suspense } from "react";

import { PlayerProfileClient } from "@/components/player/PlayerProfileClient";
import { PageContentSkeleton } from "@/components/shared/PageContentSkeleton";
import { requireClubUser } from "@/lib/club-auth";

export default function PlayerProfilePage() {
  return (
    <Suspense fallback={<PageContentSkeleton label="Checking access" />}>
      <PlayerProfileShell />
    </Suspense>
  );
}

async function PlayerProfileShell() {
  const { clubUser } = await requireClubUser({ allowRoles: ["admin", "player"] });
  return <PlayerProfileClient clubUser={clubUser} />;
}
