import { prisma } from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import { ReportScoreInput } from './scores.validators';

function computeWinner(score: {
  set1Team1: number;
  set1Team2: number;
  set2Team1: number;
  set2Team2: number;
  set3Team1: number | null;
  set3Team2: number | null;
}): number {
  let team1Sets = 0;
  let team2Sets = 0;

  if (score.set1Team1 > score.set1Team2) team1Sets++;
  else if (score.set1Team2 > score.set1Team1) team2Sets++;

  if (score.set2Team1 > score.set2Team2) team1Sets++;
  else if (score.set2Team2 > score.set2Team1) team2Sets++;

  if (score.set3Team1 != null && score.set3Team2 != null) {
    if (score.set3Team1 > score.set3Team2) team1Sets++;
    else if (score.set3Team2 > score.set3Team1) team2Sets++;
  }

  return team1Sets >= team2Sets ? 1 : 2;
}

const scoreInclude = {
  reportedBy: {
    select: { id: true, firstName: true, lastName: true },
  },
  approvals: {
    include: {
      user: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
  },
};

export class ScoresService {
  async proposeScore(matchId: string, userId: string, data: ReportScoreInput) {
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

    if (match.creatorId !== userId) {
      throw new AppError('Solo el creador del partido puede proponer un resultado', 403);
    }

    // Check no active proposal exists
    const existing = await prisma.matchScore.findFirst({
      where: {
        matchId,
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
    });

    if (existing) {
      throw new AppError(
        existing.status === 'CONFIRMED'
          ? 'Este partido ya tiene un resultado confirmado'
          : 'Ya existe una propuesta de resultado pendiente',
        409,
      );
    }

    // Validate team player IDs belong to this match
    const allTeamIds = [...data.team1PlayerIds, ...data.team2PlayerIds];
    const matchPlayerIds = match.players.map((p) => p.id);
    for (const id of allTeamIds) {
      if (!matchPlayerIds.includes(id)) {
        throw new AppError(`Jugador ${id} no pertenece a este partido`, 400);
      }
    }

    // Get registered (non-guest) participants who need to approve (exclude creator)
    const otherRegisteredPlayerIds = match.players
      .filter((p) => p.userId && p.userId !== userId && !p.isGuest)
      .map((p) => p.userId as string);

    const score = await prisma.$transaction(async (tx) => {
      const created = await tx.matchScore.create({
        data: {
          matchId,
          reportedById: userId,
          set1Team1: data.set1Team1,
          set1Team2: data.set1Team2,
          set2Team1: data.set2Team1,
          set2Team2: data.set2Team2,
          set3Team1: data.set3Team1 ?? null,
          set3Team2: data.set3Team2 ?? null,
          team1PlayerIds: data.team1PlayerIds,
          team2PlayerIds: data.team2PlayerIds,
        },
      });

      // Update MatchPlayer.team for each player
      for (const pid of data.team1PlayerIds) {
        await tx.matchPlayer.update({ where: { id: pid }, data: { team: 1 } });
      }
      for (const pid of data.team2PlayerIds) {
        await tx.matchPlayer.update({ where: { id: pid }, data: { team: 2 } });
      }

      // Create approval records only for registered non-guest players (skip guests)
      if (otherRegisteredPlayerIds.length > 0) {
        await tx.scoreApproval.createMany({
          data: otherRegisteredPlayerIds.map((uid) => ({
            scoreId: created.id,
            userId: uid,
          })),
        });
      }

      // If no other participants need to approve, auto-confirm
      if (otherRegisteredPlayerIds.length === 0) {
        const winnerTeam = computeWinner(created);
        return tx.matchScore.update({
          where: { id: created.id },
          data: { status: 'CONFIRMED', winnerTeam },
          include: scoreInclude,
        });
      }

      return tx.matchScore.findUnique({
        where: { id: created.id },
        include: scoreInclude,
      });
    });

    return score;
  }

  async approveScore(matchId: string, userId: string) {
    const score = await prisma.matchScore.findFirst({
      where: { matchId, status: 'PENDING' },
      include: { approvals: true, match: { include: { players: true } } },
    });

    if (!score) {
      throw new AppError('No hay propuesta de resultado pendiente', 404);
    }

    const isParticipant = score.match.players.some((p) => p.userId === userId);
    if (!isParticipant) {
      throw new AppError('Solo los participantes pueden aprobar el resultado', 403);
    }

    if (score.reportedById === userId) {
      throw new AppError('El creador de la propuesta no necesita aprobarla', 400);
    }

    const approval = score.approvals.find((a) => a.userId === userId);
    if (!approval) {
      throw new AppError('No tienes una aprobación pendiente para este resultado', 404);
    }

    if (approval.status !== 'PENDING') {
      throw new AppError('Ya has respondido a esta propuesta', 409);
    }

    // Update approval
    await prisma.scoreApproval.update({
      where: { id: approval.id },
      data: { status: 'APPROVED' },
    });

    // Check if all approvals are now APPROVED
    const allApprovals = await prisma.scoreApproval.findMany({
      where: { scoreId: score.id },
    });

    const allApproved = allApprovals.every(
      (a) => a.id === approval.id ? true : a.status === 'APPROVED',
    );

    if (allApproved) {
      const winnerTeam = computeWinner(score);
      const confirmed = await prisma.matchScore.update({
        where: { id: score.id },
        data: { status: 'CONFIRMED', winnerTeam },
        include: scoreInclude,
      });
      return confirmed;
    }

    return prisma.matchScore.findUnique({
      where: { id: score.id },
      include: scoreInclude,
    });
  }

  async rejectScore(matchId: string, userId: string) {
    const score = await prisma.matchScore.findFirst({
      where: { matchId, status: 'PENDING' },
      include: { approvals: true, match: { include: { players: true } } },
    });

    if (!score) {
      throw new AppError('No hay propuesta de resultado pendiente', 404);
    }

    const isParticipant = score.match.players.some((p) => p.userId === userId);
    if (!isParticipant) {
      throw new AppError('Solo los participantes pueden rechazar el resultado', 403);
    }

    if (score.reportedById === userId) {
      throw new AppError('El creador de la propuesta no puede rechazarla, use eliminar', 400);
    }

    const approval = score.approvals.find((a) => a.userId === userId);
    if (!approval) {
      throw new AppError('No tienes una aprobación pendiente para este resultado', 404);
    }

    if (approval.status !== 'PENDING') {
      throw new AppError('Ya has respondido a esta propuesta', 409);
    }

    // Reject immediately: update approval + score status
    await prisma.$transaction([
      prisma.scoreApproval.update({
        where: { id: approval.id },
        data: { status: 'REJECTED' },
      }),
      prisma.matchScore.update({
        where: { id: score.id },
        data: { status: 'REJECTED' },
      }),
    ]);

    return prisma.matchScore.findUnique({
      where: { id: score.id },
      include: scoreInclude,
    });
  }

  async deleteProposal(matchId: string, userId: string) {
    const score = await prisma.matchScore.findFirst({
      where: {
        matchId,
        status: { in: ['PENDING', 'REJECTED'] },
      },
    });

    if (!score) {
      throw new AppError('No hay propuesta eliminable para este partido', 404);
    }

    if (score.reportedById !== userId) {
      throw new AppError('Solo el creador de la propuesta puede eliminarla', 403);
    }

    // Cascade deletes approvals
    await prisma.matchScore.delete({ where: { id: score.id } });

    return { message: 'Propuesta eliminada' };
  }

  async getScore(matchId: string) {
    const match = await prisma.match.findUnique({ where: { id: matchId } });
    if (!match) {
      throw new AppError('Partido no encontrado', 404);
    }

    // Return the most relevant score: CONFIRMED first, then PENDING, then most recent REJECTED
    let score = await prisma.matchScore.findFirst({
      where: { matchId, status: 'CONFIRMED' },
      include: scoreInclude,
    });
    if (!score) {
      score = await prisma.matchScore.findFirst({
        where: { matchId, status: 'PENDING' },
        include: scoreInclude,
      });
    }
    if (!score) {
      score = await prisma.matchScore.findFirst({
        where: { matchId, status: 'REJECTED' },
        orderBy: { createdAt: 'desc' },
        include: scoreInclude,
      });
    }

    return score ?? null;
  }
}

export const scoresService = new ScoresService();
