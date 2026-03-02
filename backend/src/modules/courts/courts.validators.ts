import { z } from 'zod';

export const createCourtSchema = z.object({
  number: z.number().int().positive('El número de cancha debe ser positivo'),
  name: z.string().trim().nullable().optional(),
  isIndoor: z.boolean().default(false),
  surface: z.string().trim().default('césped sintético'),
});

export const updateCourtSchema = createCourtSchema.partial();

export const courtIdParamSchema = z.object({
  courtId: z.string().uuid('ID de cancha inválido'),
});

export type CreateCourtInput = z.infer<typeof createCourtSchema>;
export type UpdateCourtInput = z.infer<typeof updateCourtSchema>;
