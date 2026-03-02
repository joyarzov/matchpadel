import { z } from 'zod';
import { PlayerCategory, UserRole, Gender } from '@prisma/client';

export const updateProfileSchema = z.object({
  firstName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').trim().optional(),
  lastName: z.string().min(2, 'El apellido debe tener al menos 2 caracteres').trim().optional(),
  phone: z
    .string()
    .regex(/^\+569\d{8}$/, 'El teléfono debe tener formato +569XXXXXXXX')
    .optional(),
  category: z.nativeEnum(PlayerCategory).optional(),
  avatarUrl: z.string().url('URL de avatar inválida').nullable().optional(),
  gender: z.nativeEnum(Gender).optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'La contraseña actual es requerida'),
  newPassword: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/[A-Z]/, 'La contraseña debe contener al menos una mayúscula')
    .regex(/[0-9]/, 'La contraseña debe contener al menos un número')
    .regex(/[^A-Za-z0-9]/, 'La contraseña debe contener al menos un carácter especial'),
});

export const updateRoleSchema = z.object({
  role: z.nativeEnum(UserRole),
});

export const userIdParamSchema = z.object({
  id: z.string().uuid('ID de usuario inválido'),
});

export const searchUsersSchema = z.object({
  q: z.string().min(2, 'La búsqueda debe tener al menos 2 caracteres'),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
export type SearchUsersInput = z.infer<typeof searchUsersSchema>;
