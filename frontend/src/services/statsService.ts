import api from './api';
import type { UserStats, RankingEntry } from '@/types/stats.types';

export const statsService = {
  async getUserStats(): Promise<UserStats> {
    const response = await api.get<UserStats>('/users/stats');
    return response.data;
  },

  async getRanking(limit: number = 10): Promise<RankingEntry[]> {
    const response = await api.get<RankingEntry[]>('/users/ranking', {
      params: { limit },
    });
    return response.data;
  },
};
