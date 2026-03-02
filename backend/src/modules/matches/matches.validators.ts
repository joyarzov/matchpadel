import { z } from 'zod';
import { PlayerCategory, MatchStatus } from '@prisma/client';

export const createMatchSchema = z.object({
  clubId: z.string().uuid('ID de club inválido'),
  courtId: z.string().uuid('ID de cancha inválido').nullable().optional(),
  category: z.nativeEnum(PlayerCategory),
  scheduledDate: z.string().refine(
    (val) => !isNaN(Date.parse(val)),
    'Fecha inválida'
  ),
  scheduledTime: z.string().regex(
    /^([01]\d|2[0-3]):([0-5]\d)$/,
    'Hora debe tener formato HH:MM'
  ),
  durationMinutes: z.number().int().min(30).max(180).default(90),
  maxPlayers: z.number().int().min(2).max(8).default(4),
  initialPlayers: z.number().int().min(1).max(7).default(1),
  notes: z.string().max(500).nullable().optional(),
  isPrivate: z.boolean().default(false),
});

export const updateMatchSchema = z.object({
  courtId: z.string().uuid('ID de cancha inválido').nullable().optional(),
  scheduledDate: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), 'Fecha inválida')
    .optional(),
  scheduledTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Hora debe tener formato HH:MM')
    .optional(),
  durationMinutes: z.number().int().min(30).max(180).optional(),
  notes: z.string().max(500).nullable().optional(),
  isPrivate: z.boolean().optional(),
});

export const matchFiltersSchema = z.object({
  status: z.nativeEnum(MatchStatus).optional(),
  category: z.nativeEnum(PlayerCategory).optional(),
  clubId: z.string().uuid().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('20'),
});

export const matchIdParamSchema = z.object({
  matchId: z.string().uuid('ID de partido inválido'),
});

export type CreateMatchInput = z.infer<typeof createMatchSchema>;
export type UpdateMatchInput = z.infer<typeof updateMatchSchema>;
export type MatchFilters = z.infer<typeof matchFiltersSchema>;
