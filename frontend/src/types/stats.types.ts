export type ScoreStatus = 'PENDING' | 'CONFIRMED' | 'REJECTED';
export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface ScoreApproval {
  id: string;
  scoreId: string;
  userId: string;
  user: { id: string; firstName: string; lastName: string };
  status: ApprovalStatus;
  createdAt: string;
  updatedAt: string;
}

export interface UserStats {
  matchesPlayed: number;
  matchesCreated: number;
  wins: number;
  losses: number;
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
  wins: number;
  losses: number;
  matchesPlayed: number;
}

export interface MatchScoreData {
  id: string;
  matchId: string;
  reportedById: string;
  reportedBy: { id: string; firstName: string; lastName: string };
  set1Team1: number;
  set1Team2: number;
  set2Team1: number;
  set2Team2: number;
  set3Team1: number | null;
  set3Team2: number | null;
  team1PlayerIds: string[];
  team2PlayerIds: string[];
  status: ScoreStatus;
  winnerTeam: number | null;
  approvals: ScoreApproval[];
  createdAt: string;
  updatedAt: string;
}

export interface ReportScoreRequest {
  set1Team1: number;
  set1Team2: number;
  set2Team1: number;
  set2Team2: number;
  set3Team1?: number | null;
  set3Team2?: number | null;
  team1PlayerIds: string[];
  team2PlayerIds: string[];
}
