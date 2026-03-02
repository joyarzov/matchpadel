import type { User, PlayerCategory } from './auth.types';
import type { Club, Court } from './club.types';

export type MatchStatus = 'OPEN' | 'FULL' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface MatchPlayer {
  id: string;
  matchId: string;
  userId: string;
  joinedAt: string;
  user: User;
}

export interface Match {
  id: string;
  creatorId: string;
  clubId: string;
  courtId: string | null;
  date: string;
  startTime: string;
  endTime: string;
  category: PlayerCategory;
  maxPlayers: number;
  currentPlayers: number;
  pricePerPlayer: number | null;
  status: MatchStatus;
  description: string | null;
  isPrivate: boolean;
  whatsappGroupLink: string | null;
  createdAt: string;
  updatedAt: string;
  creator: User;
  club: Club;
  court: Court | null;
  players: MatchPlayer[];
}

export interface CreateMatchRequest {
  clubId: string;
  courtId?: string | null;
  scheduledDate: string;
  scheduledTime: string;
  durationMinutes: number;
  category: PlayerCategory;
  maxPlayers?: number;
  initialPlayers?: number;
  notes?: string | null;
  isPrivate?: boolean;
}

export interface UpdateMatchRequest {
  courtId?: string | null;
  scheduledDate?: string;
  scheduledTime?: string;
  durationMinutes?: number;
  notes?: string | null;
  isPrivate?: boolean;
}

export interface MatchFilters {
  status?: MatchStatus;
  category?: PlayerCategory;
  clubId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
