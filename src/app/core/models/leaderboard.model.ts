export interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
  rounds: number;
  date: string; // ISO date string
}

export const LEADERBOARD_SIZE = 5;
