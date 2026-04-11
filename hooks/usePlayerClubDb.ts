"use client";

import { useQuery } from "@tanstack/react-query";

import { createClient } from "@/lib/supabase/client";
import { loadPlayerClubSnapshot } from "@/lib/player-club-remote";
import { queryKeys } from "@/lib/query-keys";

export function usePlayerClubDb(userId: string) {
  return useQuery({
    queryKey: queryKeys.playerClub(userId),
    queryFn: () => loadPlayerClubSnapshot(createClient(), userId),
    enabled: Boolean(userId),
  });
}
