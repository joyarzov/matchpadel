import api from './api';
import type { CenterAvailability } from '@/types/availability.types';

export const availabilityService = {
  async getAvailability(city: string, date: string): Promise<CenterAvailability[]> {
    const response = await api.get<CenterAvailability[]>('/availability', {
      params: { city, date },
    });
    return response.data;
  },

  async getCities(): Promise<string[]> {
    const response = await api.get<string[]>('/availability/cities');
    return response.data;
  },
};
