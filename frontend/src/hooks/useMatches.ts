import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { matchService } from '@/services/matchService';
import type {
  MatchFilters,
  CreateMatchRequest,
  UpdateMatchRequest,
} from '@/types/match.types';
import type { ReportScoreRequest } from '@/types/stats.types';

export function useMatches(filters?: MatchFilters) {
  return useQuery({
    queryKey: ['matches', filters],
    queryFn: () => matchService.getMatches(filters),
    staleTime: 30 * 1000,
  });
}

export function useMatch(id: string) {
  return useQuery({
    queryKey: ['matches', id],
    queryFn: () => matchService.getMatch(id),
    enabled: !!id,
  });
}

export function useMyMatches() {
  return useQuery({
    queryKey: ['matches', 'my'],
    queryFn: () => matchService.getMyMatches(),
  });
}

export function useCreateMatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateMatchRequest) => matchService.createMatch(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches'] });
    },
  });
}

export function useUpdateMatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateMatchRequest }) =>
      matchService.updateMatch(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['matches', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['matches'] });
    },
  });
}

export function useCancelMatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => matchService.cancelMatch(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['matches', id] });
      queryClient.invalidateQueries({ queryKey: ['matches'] });
    },
  });
}

export function useJoinMatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => matchService.joinMatch(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['matches', id] });
      queryClient.invalidateQueries({ queryKey: ['matches'] });
    },
  });
}

export function useLeaveMatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => matchService.leaveMatch(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['matches', id] });
      queryClient.invalidateQueries({ queryKey: ['matches'] });
    },
  });
}

export function useMatchScore(matchId: string) {
  return useQuery({
    queryKey: ['matchScore', matchId],
    queryFn: () => matchService.getScore(matchId),
    enabled: !!matchId,
  });
}

export function useProposeScore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ matchId, data }: { matchId: string; data: ReportScoreRequest }) =>
      matchService.proposeScore(matchId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['matchScore', variables.matchId] });
    },
  });
}

export function useApproveScore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (matchId: string) => matchService.approveScore(matchId),
    onSuccess: (_data, matchId) => {
      queryClient.invalidateQueries({ queryKey: ['matchScore', matchId] });
    },
  });
}

export function useRejectScore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (matchId: string) => matchService.rejectScore(matchId),
    onSuccess: (_data, matchId) => {
      queryClient.invalidateQueries({ queryKey: ['matchScore', matchId] });
    },
  });
}

export function useDeleteProposal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (matchId: string) => matchService.deleteProposal(matchId),
    onSuccess: (_data, matchId) => {
      queryClient.invalidateQueries({ queryKey: ['matchScore', matchId] });
    },
  });
}
