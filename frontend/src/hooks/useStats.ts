import { useQuery } from '@tanstack/react-query';
import { statsService } from '@/services/statsService';

export function useUserStats() {
  return useQuery({
    queryKey: ['userStats'],
    queryFn: () => statsService.getUserStats(),
  });
}

export function useRanking(limit: number = 10) {
  return useQuery({
    queryKey: ['ranking', limit],
    queryFn: () => statsService.getRanking(limit),
    staleTime: 60 * 1000,
  });
}
