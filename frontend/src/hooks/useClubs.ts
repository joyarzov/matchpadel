import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clubService } from '@/services/clubService';
import type { CreateClubRequest, UpdateClubRequest, CreateCourtRequest } from '@/types/club.types';

export function useClubs() {
  return useQuery({
    queryKey: ['clubs'],
    queryFn: () => clubService.getClubs(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useClub(id: string) {
  return useQuery({
    queryKey: ['clubs', id],
    queryFn: () => clubService.getClub(id),
    enabled: !!id,
  });
}

export function useCreateClub() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateClubRequest) => clubService.createClub(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clubs'] });
    },
  });
}

export function useUpdateClub() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateClubRequest }) =>
      clubService.updateClub(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['clubs', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['clubs'] });
    },
  });
}

export function useDeleteClub() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => clubService.deleteClub(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clubs'] });
    },
  });
}

export function useCourts(clubId: string) {
  return useQuery({
    queryKey: ['clubs', clubId, 'courts'],
    queryFn: () => clubService.getCourts(clubId),
    enabled: !!clubId,
  });
}

export function useCreateCourt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCourtRequest) => clubService.createCourt(data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['clubs', variables.clubId, 'courts'] });
      queryClient.invalidateQueries({ queryKey: ['clubs'] });
    },
  });
}
