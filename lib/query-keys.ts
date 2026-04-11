export const queryKeys = {
  playerClub: (userId: string) => ["player-club-db", userId] as const,
};
