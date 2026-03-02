import api from './api';
import type {
  Club,
  Court,
  CreateClubRequest,
  UpdateClubRequest,
  CreateCourtRequest,
} from '@/types/club.types';

export const clubService = {
  async getClubs(): Promise<Club[]> {
    const response = await api.get<Club[]>('/clubs');
    return response.data;
  },

  async getClub(id: string): Promise<Club> {
    const response = await api.get<Club>(`/clubs/${id}`);
    return response.data;
  },

  async createClub(data: CreateClubRequest): Promise<Club> {
    const response = await api.post<Club>('/clubs', data);
    return response.data;
  },

  async updateClub(id: string, data: UpdateClubRequest): Promise<Club> {
    const response = await api.put<Club>(`/clubs/${id}`, data);
    return response.data;
  },

  async deleteClub(id: string): Promise<void> {
    await api.delete(`/clubs/${id}`);
  },

  async getCourts(clubId: string): Promise<Court[]> {
    const response = await api.get<Court[]>(`/clubs/${clubId}/courts`);
    return response.data;
  },

  async createCourt(data: CreateCourtRequest): Promise<Court> {
    const response = await api.post<Court>(`/clubs/${data.clubId}/courts`, data);
    return response.data;
  },

  async updateCourt(
    clubId: string,
    courtId: string,
    data: Partial<CreateCourtRequest>,
  ): Promise<Court> {
    const response = await api.put<Court>(`/clubs/${clubId}/courts/${courtId}`, data);
    return response.data;
  },

  async deleteCourt(clubId: string, courtId: string): Promise<void> {
    await api.delete(`/clubs/${clubId}/courts/${courtId}`);
  },
};
