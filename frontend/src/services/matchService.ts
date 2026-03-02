import api from './api';
import type {
  Match,
  CreateMatchRequest,
  UpdateMatchRequest,
  MatchFilters,
  PaginatedResponse,
} from '@/types/match.types';
import type { MatchScoreData, ReportScoreRequest } from '@/types/stats.types';

export const matchService = {
  async getMatches(filters?: MatchFilters): Promise<PaginatedResponse<Match>> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }
    const response = await api.get<PaginatedResponse<Match>>('/matches', { params });
    return response.data;
  },

  async getMatch(id: string): Promise<Match> {
    const response = await api.get<Match>(`/matches/${id}`);
    return response.data;
  },

  async createMatch(data: CreateMatchRequest): Promise<Match> {
    const response = await api.post<Match>('/matches', data);
    return response.data;
  },

  async updateMatch(id: string, data: UpdateMatchRequest): Promise<Match> {
    const response = await api.put<Match>(`/matches/${id}`, data);
    return response.data;
  },

  async cancelMatch(id: string): Promise<Match> {
    const response = await api.patch<Match>(`/matches/${id}/cancel`);
    return response.data;
  },

  async joinMatch(id: string): Promise<Match> {
    const response = await api.post<Match>(`/matches/${id}/join`);
    return response.data;
  },

  async leaveMatch(id: string): Promise<Match> {
    const response = await api.delete<Match>(`/matches/${id}/leave`);
    return response.data;
  },

  async getMyMatches(page: number = 1, limit: number = 20): Promise<PaginatedResponse<Match>> {
    const response = await api.get<PaginatedResponse<Match>>('/matches/me/matches', {
      params: { page, limit },
    });
    return response.data;
  },

  async getWhatsAppLink(id: string): Promise<{ whatsappLink: string }> {
    const response = await api.get<{ whatsappLink: string }>(`/matches/${id}/whatsapp`);
    return response.data;
  },

  async reportScore(matchId: string, data: ReportScoreRequest): Promise<MatchScoreData> {
    const response = await api.post<MatchScoreData>(`/matches/${matchId}/score`, data);
    return response.data;
  },

  async getScores(matchId: string): Promise<MatchScoreData[]> {
    const response = await api.get<MatchScoreData[]>(`/matches/${matchId}/scores`);
    return response.data;
  },
};
