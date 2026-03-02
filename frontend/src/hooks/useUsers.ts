import { useQuery } from '@tanstack/react-query';
import { userService } from '@/services/userService';

export function useUserSearch(query: string) {
  return useQuery({
    queryKey: ['userSearch', query],
    queryFn: () => userService.searchUsers(query),
    enabled: query.length >= 2,
    staleTime: 30 * 1000,
  });
}
