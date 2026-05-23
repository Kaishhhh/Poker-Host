import type {
  Tournament,
  BlindLevel,
  Player,
  Table,
  ActionLog,
} from "@/app/generated/prisma/client";

export type { Tournament, BlindLevel, Player, Table, ActionLog };

export interface TournamentWithRelations extends Tournament {
  blindLevels: BlindLevel[];
  players: Player[];
  tables: (Table & { players: Player[] })[];
}

export interface SpectatorSnapshot {
  serverTime: number;
  tournament: {
    id: string;
    name: string;
    slug: string;
    status: string;
    currentLevelIndex: number;
    levelStartedAt: number | null;
    isPaused: boolean;
    pausedSecondsRemaining: number | null;
    prizePool: number;
    totalEntries: number;
    activePlayers: number;
  };
  currentLevel: BlindLevel | null;
  nextLevel: BlindLevel | null;
  upcomingLevels: BlindLevel[];
  tables: { tableNumber: number; playerCount: number }[];
}
