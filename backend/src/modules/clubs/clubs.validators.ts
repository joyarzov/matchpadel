import { z } from 'zod';

export const createClubSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').trim(),
  address: z.string().min(5, 'La dirección debe tener al menos 5 caracteres').trim(),
  city: z.string().trim().default('Valdivia'),
  region: z.string().trim().default('Los Ríos'),
  phone: z.string().nullable().optional(),
  email: z.string().email('Email inválido').nullable().optional(),
  imageUrl: z.string().url('URL de imagen inválida').nullable().optional(),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
});

export const updateClubSchema = createClubSchema.partial();

export const clubIdParamSchema = z.object({
  clubId: z.string().uuid('ID de club inválido'),
});

export type CreateClubInput = z.infer<typeof createClubSchema>;
export type UpdateClubInput = z.infer<typeof updateClubSchema>;
