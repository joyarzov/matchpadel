import { z } from 'zod';

export const reportScoreSchema = z.object({
  set1Team1: z.number().int().min(0).max(7),
  set1Team2: z.number().int().min(0).max(7),
  set2Team1: z.number().int().min(0).max(7),
  set2Team2: z.number().int().min(0).max(7),
  set3Team1: z.number().int().min(0).max(7).nullable().optional(),
  set3Team2: z.number().int().min(0).max(7).nullable().optional(),
  team1PlayerIds: z.array(z.string().uuid()).length(2),
  team2PlayerIds: z.array(z.string().uuid()).length(2),
}).refine(
  (data) => {
    const allIds = [...data.team1PlayerIds, ...data.team2PlayerIds];
    return new Set(allIds).size === 4;
  },
  { message: 'Los 4 jugadores deben ser únicos' },
);

export type ReportScoreInput = z.infer<typeof reportScoreSchema>;
