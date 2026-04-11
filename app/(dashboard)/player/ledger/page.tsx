import { Suspense } from "react";

import { PlayerLedgerClient } from "@/components/player/PlayerLedgerClient";
import { PageContentSkeleton } from "@/components/shared/PageContentSkeleton";
import { requireClubUser } from "@/lib/club-auth";

export default function PlayerLedgerPage() {
  return (
    <Suspense fallback={<PageContentSkeleton label="Checking access" />}>
      <PlayerLedgerShell />
    </Suspense>
  );
}

async function PlayerLedgerShell() {
  const { clubUser } = await requireClubUser({ allowRoles: ["admin", "player"] });
  return <PlayerLedgerClient clubUser={clubUser} />;
}
