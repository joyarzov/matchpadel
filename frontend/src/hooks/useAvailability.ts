import { useQuery } from '@tanstack/react-query';
import { availabilityService } from '@/services/availabilityService';

export function useAvailability(city: string, date: string) {
  return useQuery({
    queryKey: ['availability', city, date],
    queryFn: () => availabilityService.getAvailability(city, date),
    enabled: !!city && !!date,
    staleTime: 2 * 60 * 1000,
  });
}

export function useCities() {
  return useQuery({
    queryKey: ['availability-cities'],
    queryFn: () => availabilityService.getCities(),
    staleTime: 24 * 60 * 60 * 1000,
  });
}
