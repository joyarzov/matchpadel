export type UserRole = 'PLAYER' | 'ADMIN';

export type PlayerCategory =
  | 'PRIMERA'
  | 'SEGUNDA'
  | 'TERCERA'
  | 'CUARTA'
  | 'QUINTA'
  | 'SEXTA';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  category: PlayerCategory | null;
  role: UserRole;
  avatarUrl: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  category?: PlayerCategory;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface TokenPayload {
  sub: string;
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
}
