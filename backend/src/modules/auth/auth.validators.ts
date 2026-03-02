import { z } from 'zod';
import { PlayerCategory } from '@prisma/client';

export const registerSchema = z.object({
  email: z.string().email('Email inválido').toLowerCase().trim(),
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/[A-Z]/, 'La contraseña debe contener al menos una mayúscula')
    .regex(/[0-9]/, 'La contraseña debe contener al menos un número')
    .regex(/[^A-Za-z0-9]/, 'La contraseña debe contener al menos un carácter especial'),
  firstName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').trim(),
  lastName: z.string().min(2, 'El apellido debe tener al menos 2 caracteres').trim(),
  phone: z
    .string()
    .regex(/^\+569\d{8}$/, 'El teléfono debe tener formato +569XXXXXXXX'),
  category: z.nativeEnum(PlayerCategory).optional().default('SEXTA'),
});

export const loginSchema = z.object({
  email: z.string().email('Email inválido').toLowerCase().trim(),
  password: z.string().min(1, 'La contraseña es requerida'),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token es requerido'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
