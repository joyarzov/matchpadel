import api from './api';
import type { User, UserRole } from '@/types/auth.types';
import type { UpdateProfileRequest, ChangePasswordRequest } from '@/types/user.types';

export const userService = {
  async getProfile(): Promise<User> {
    const response = await api.get<User>('/users/profile');
    return response.data;
  },

  async updateProfile(data: UpdateProfileRequest): Promise<User> {
    const response = await api.put<User>('/users/profile', data);
    return response.data;
  },

  async changePassword(data: ChangePasswordRequest): Promise<{ message: string }> {
    const response = await api.put<{ message: string }>('/users/change-password', data);
    return response.data;
  },

  async getUsers(): Promise<User[]> {
    const response = await api.get<User[]>('/users');
    return response.data;
  },

  async updateRole(userId: string, role: UserRole): Promise<User> {
    const response = await api.patch<User>(`/users/${userId}/role`, { role });
    return response.data;
  },

  async deleteUser(userId: string): Promise<void> {
    await api.delete(`/users/${userId}`);
  },
};
