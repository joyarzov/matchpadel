import { create } from 'zustand';
import type { User } from '@/types/auth.types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setRefreshToken: (token: string | null) => void;
  login: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
}

const getStoredToken = (): string | null => {
  try {
    return localStorage.getItem('matchpadel_token');
  } catch {
    return null;
  }
};

const getStoredRefreshToken = (): string | null => {
  try {
    return localStorage.getItem('matchpadel_refresh_token');
  } catch {
    return null;
  }
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: getStoredToken(),
  refreshToken: getStoredRefreshToken(),
  isAuthenticated: false,
  isLoading: true,

  setUser: (user) =>
    set({
      user,
      isAuthenticated: !!user,
    }),

  setToken: (token) => {
    if (token) {
      localStorage.setItem('matchpadel_token', token);
    } else {
      localStorage.removeItem('matchpadel_token');
    }
    set({ accessToken: token });
  },

  setRefreshToken: (token) => {
    if (token) {
      localStorage.setItem('matchpadel_refresh_token', token);
    } else {
      localStorage.removeItem('matchpadel_refresh_token');
    }
    set({ refreshToken: token });
  },

  login: (user, accessToken, refreshToken) => {
    localStorage.setItem('matchpadel_token', accessToken);
    localStorage.setItem('matchpadel_refresh_token', refreshToken);
    set({
      user,
      accessToken,
      refreshToken,
      isAuthenticated: true,
      isLoading: false,
    });
  },

  logout: () => {
    localStorage.removeItem('matchpadel_token');
    localStorage.removeItem('matchpadel_refresh_token');
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  setLoading: (loading) => set({ isLoading: loading }),
}));
