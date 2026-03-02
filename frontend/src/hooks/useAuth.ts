import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { authService } from '@/services/authService';
import type { LoginRequest, RegisterRequest } from '@/types/auth.types';

export function useAuth() {
  const { user, accessToken, isAuthenticated, isLoading, login, logout, setUser, setLoading } =
    useAuthStore();

  const {
    data: currentUser,
    isLoading: isFetchingUser,
    error,
  } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => authService.getMe(),
    enabled: !!accessToken && !user,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (currentUser) {
      setUser(currentUser);
      setLoading(false);
    }
  }, [currentUser, setUser, setLoading]);

  useEffect(() => {
    if (error) {
      logout();
    }
  }, [error, logout]);

  useEffect(() => {
    if (!accessToken) {
      setLoading(false);
    }
  }, [accessToken, setLoading]);

  const handleLogin = async (data: LoginRequest) => {
    const response = await authService.login(data);
    login(response.user, response.accessToken, response.refreshToken);
    return response;
  };

  const handleRegister = async (data: RegisterRequest) => {
    const response = await authService.register(data);
    login(response.user, response.accessToken, response.refreshToken);
    return response;
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch {
      // Ignore logout API errors
    } finally {
      logout();
    }
  };

  return {
    user,
    isAuthenticated,
    isLoading: isLoading || isFetchingUser,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
  };
}
