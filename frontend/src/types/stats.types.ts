export interface UserStats {
  matchesPlayed: number;
  matchesCreated: number;
  favoriteClub: { id: string; name: string } | null;
  memberSince: string;
}

export interface RankingEntry {
  position: number;
  userId: string;
  firstName: string;
  lastName: string;
  category: string | null;
  avatarUrl: string | null;
  matchesPlayed: number;
}

export interface MatchScoreData {
  id: string;
  matchId: string;
  reportedById: string;
  reportedBy: { firstName: string; lastName: string };
  set1Team1: number;
  set1Team2: number;
  set2Team1: number;
  set2Team2: number;
  set3Team1: number | null;
  set3Team2: number | null;
  createdAt: string;
}

export interface ReportScoreRequest {
  set1Team1: number;
  set1Team2: number;
  set2Team1: number;
  set2Team2: number;
  set3Team1?: number | null;
  set3Team2?: number | null;
}
