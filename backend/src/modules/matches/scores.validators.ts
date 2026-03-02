import { z } from 'zod';

export const reportScoreSchema = z.object({
  set1Team1: z.number().int().min(0).max(7),
  set1Team2: z.number().int().min(0).max(7),
  set2Team1: z.number().int().min(0).max(7),
  set2Team2: z.number().int().min(0).max(7),
  set3Team1: z.number().int().min(0).max(7).nullable().optional(),
  set3Team2: z.number().int().min(0).max(7).nullable().optional(),
});

export type ReportScoreInput = z.infer<typeof reportScoreSchema>;
