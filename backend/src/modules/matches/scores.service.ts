import { prisma } from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import { ReportScoreInput } from './scores.validators';

export class ScoresService {
  async reportScore(matchId: string, userId: string, data: ReportScoreInput) {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { players: true },
    });

    if (!match) {
      throw new AppError('Partido no encontrado', 404);
    }

    if (match.status !== 'COMPLETED' && match.status !== 'IN_PROGRESS') {
      throw new AppError('Solo se puede registrar resultado en partidos completados o en progreso', 400);
    }

    const isParticipant =
      match.creatorId === userId || match.players.some((p) => p.userId === userId);

    if (!isParticipant) {
      throw new AppError('Solo los participantes pueden registrar resultados', 403);
    }

    const existing = await prisma.matchScore.findUnique({
      where: { matchId_reportedById: { matchId, reportedById: userId } },
    });

    if (existing) {
      throw new AppError('Ya has registrado un resultado para este partido', 409);
    }

    const score = await prisma.matchScore.create({
      data: {
        matchId,
        reportedById: userId,
        set1Team1: data.set1Team1,
        set1Team2: data.set1Team2,
        set2Team1: data.set2Team1,
        set2Team2: data.set2Team2,
        set3Team1: data.set3Team1 ?? null,
        set3Team2: data.set3Team2 ?? null,
      },
      include: {
        reportedBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    return score;
  }

  async getScores(matchId: string) {
    const match = await prisma.match.findUnique({ where: { id: matchId } });
    if (!match) {
      throw new AppError('Partido no encontrado', 404);
    }

    const scores = await prisma.matchScore.findMany({
      where: { matchId },
      include: {
        reportedBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return scores;
  }
}

export const scoresService = new ScoresService();
