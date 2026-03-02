export type CourtType = 'INDOOR' | 'OUTDOOR' | 'COVERED';

export interface Court {
  id: string;
  clubId: string;
  name: string;
  type: CourtType;
  isActive: boolean;
  createdAt: string;
}

export interface Club {
  id: string;
  name: string;
  address: string;
  city: string;
  region: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  logoUrl: string | null;
  description: string | null;
  latitude: number | null;
  longitude: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  courts: Court[];
}

export interface CreateClubRequest {
  name: string;
  address: string;
  city: string;
  region: string;
  phone?: string;
  email?: string;
  website?: string;
  description?: string;
  latitude?: number;
  longitude?: number;
}

export interface UpdateClubRequest {
  name?: string;
  address?: string;
  city?: string;
  region?: string;
  phone?: string;
  email?: string;
  website?: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  isActive?: boolean;
}

export interface CreateCourtRequest {
  clubId: string;
  name: string;
  type: CourtType;
}
