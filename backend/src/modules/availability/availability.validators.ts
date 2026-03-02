import { z } from 'zod';

export const availabilityQuerySchema = z.object({
  city: z.string().min(1, 'Ciudad es requerida'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)'),
});
