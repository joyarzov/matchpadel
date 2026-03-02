import { prisma } from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import { CreateMatchInput, UpdateMatchInput, MatchFilters } from './matches.validators';
import { Prisma } from '@prisma/client';
import { getMatchWhatsAppLink } from '../../utils/whatsapp';

export class MatchesService {
  async createMatch(creatorId: string, data: CreateMatchInput) {
    // Verify club exists
    const club = await prisma.club.findUnique({ where: { id: data.clubId } });
    if (!club || !club.isActive) {
      throw new AppError('Club no encontrado o inactivo', 404);
    }

    // Verify court if provided
    if (data.courtId) {
      const court = await prisma.court.findFirst({
        where: { id: data.courtId, clubId: data.clubId, isActive: true },
      });
      if (!court) {
        throw new AppError('Cancha no encontrada o inactiva en este club', 404);
      }
    }

    // Validate initialPlayers doesn't exceed maxPlayers
    const initialPlayers = data.initialPlayers ?? 1;
    if (initialPlayers > data.maxPlayers) {
      throw new AppError('La cantidad de jugadores iniciales no puede superar el máximo de jugadores', 400);
    }

    const initialStatus = initialPlayers >= data.maxPlayers ? 'FULL' : 'OPEN';

    // Create match and add creator as first player in a transaction
    const match = await prisma.$transaction(async (tx) => {
      const newMatch = await tx.match.create({
        data: {
          creatorId,
          clubId: data.clubId,
          courtId: data.courtId || null,
          category: data.category,
          scheduledDate: new Date(data.scheduledDate),
          scheduledTime: data.scheduledTime,
          durationMinutes: data.durationMinutes,
          maxPlayers: data.maxPlayers,
          confirmedCount: initialPlayers,
          genderMode: data.genderMode,
          requiredMales: data.genderMode === 'MIXED' ? data.requiredMales ?? null : null,
          requiredFemales: data.genderMode === 'MIXED' ? data.requiredFemales ?? null : null,
          notes: data.notes || null,
          isPrivate: data.isPrivate,
          status: initialStatus,
        },
        include: {
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              category: true,
              gender: true,
            },
          },
          club: { select: { id: true, name: true } },
          court: { select: { id: true, number: true, name: true } },
        },
      });

      // Add creator as first player
      await tx.matchPlayer.create({
        data: {
          matchId: newMatch.id,
          userId: creatorId,
        },
      });

      // Add guests if any
      const guests = data.guests ?? [];
      for (let i = 0; i < guests.length; i++) {
        const guest = guests[i];
        if (guest.userId) {
          // Registered user as guest
          const guestUser = await tx.user.findUnique({ where: { id: guest.userId } });
          if (!guestUser) {
            throw new AppError(`Usuario invitado no encontrado: ${guest.userId}`, 404);
          }
          await tx.matchPlayer.create({
            data: {
              matchId: newMatch.id,
              userId: guest.userId,
              isGuest: true,
              addedById: creatorId,
            },
          });
        } else {
          // Anonymous guest
          await tx.matchPlayer.create({
            data: {
              matchId: newMatch.id,
              userId: null,
              isGuest: true,
              guestName: guest.name || `Jugador ${i + 2}`,
              addedById: creatorId,
            },
          });
        }
      }

      return newMatch;
    });

    return match;
  }

  async listMatches(filters: MatchFilters) {
    const { status, category, clubId, dateFrom, dateTo, page, limit } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.MatchWhereInput = {};

    if (status) where.status = status;
    if (category) where.category = category;
    if (clubId) where.clubId = clubId;

    if (dateFrom || dateTo) {
      where.scheduledDate = {};
      if (dateFrom) where.scheduledDate.gte = new Date(dateFrom);
      if (dateTo) where.scheduledDate.lte = new Date(dateTo);
    }

    const [matches, total] = await Promise.all([
      prisma.match.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ scheduledDate: 'asc' }, { scheduledTime: 'asc' }],
        include: {
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              category: true,
              gender: true,
            },
          },
          club: { select: { id: true, name: true, address: true } },
          court: { select: { id: true, number: true, name: true } },
          players: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  category: true,
                  gender: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
      }),
      prisma.match.count({ where }),
    ]);

    return { matches, total };
  }

  async getMatchById(matchId: string) {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            category: true,
            gender: true,
            avatarUrl: true,
          },
        },
        club: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            phone: true,
          },
        },
        court: {
          select: {
            id: true,
            number: true,
            name: true,
            isIndoor: true,
            surface: true,
          },
        },
        players: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                category: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: { joinedAt: 'asc' },
        },
      },
    });

    if (!match) {
      throw new AppError('Partido no encontrado', 404);
    }

    return match;
  }

  async updateMatch(matchId: string, userId: string, data: UpdateMatchInput) {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
    });

    if (!match) {
      throw new AppError('Partido no encontrado', 404);
    }

    if (match.creatorId !== userId) {
      throw new AppError('Solo el creador puede modificar el partido', 403);
    }

    if (match.status === 'CANCELLED' || match.status === 'COMPLETED') {
      throw new AppError('No se puede modificar un partido cancelado o completado', 400);
    }

    // Verify court if being updated
    if (data.courtId) {
      const court = await prisma.court.findFirst({
        where: { id: data.courtId, clubId: match.clubId, isActive: true },
      });
      if (!court) {
        throw new AppError('Cancha no encontrada o inactiva en este club', 404);
      }
    }

    const updateData: Prisma.MatchUpdateInput = {};
    if (data.courtId !== undefined) updateData.court = data.courtId ? { connect: { id: data.courtId } } : { disconnect: true };
    if (data.scheduledDate) updateData.scheduledDate = new Date(data.scheduledDate);
    if (data.scheduledTime) updateData.scheduledTime = data.scheduledTime;
    if (data.durationMinutes) updateData.durationMinutes = data.durationMinutes;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.isPrivate !== undefined) updateData.isPrivate = data.isPrivate;

    const updated = await prisma.match.update({
      where: { id: matchId },
      data: updateData,
      include: {
        creator: {
          select: { id: true, firstName: true, lastName: true, category: true, gender: true },
        },
        club: { select: { id: true, name: true } },
        court: { select: { id: true, number: true, name: true } },
      },
    });

    return updated;
  }

  async cancelMatch(matchId: string, userId: string) {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
    });

    if (!match) {
      throw new AppError('Partido no encontrado', 404);
    }

    if (match.creatorId !== userId) {
      throw new AppError('Solo el creador puede cancelar el partido', 403);
    }

    if (match.status === 'CANCELLED') {
      throw new AppError('El partido ya está cancelado', 400);
    }

    if (match.status === 'COMPLETED') {
      throw new AppError('No se puede cancelar un partido completado', 400);
    }

    const updated = await prisma.match.update({
      where: { id: matchId },
      data: { status: 'CANCELLED' },
      select: {
        id: true,
        status: true,
      },
    });

    return updated;
  }

  async joinMatch(matchId: string, userId: string) {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        players: {
          include: {
            user: { select: { id: true, gender: true } },
          },
        },
      },
    });

    if (!match) {
      throw new AppError('Partido no encontrado', 404);
    }

    if (match.status !== 'OPEN') {
      throw new AppError('El partido no está abierto para unirse', 400);
    }

    const alreadyJoined = match.players.some((p) => p.userId === userId);
    if (alreadyJoined) {
      throw new AppError('Ya estás inscrito en este partido', 409);
    }

    if (match.confirmedCount >= match.maxPlayers) {
      throw new AppError('El partido está lleno', 400);
    }

    // Gender validation
    const joiningUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { gender: true },
    });

    if (!joiningUser) {
      throw new AppError('Usuario no encontrado', 404);
    }

    if (match.genderMode === 'MALE_ONLY' && joiningUser.gender !== 'MALE') {
      throw new AppError('Este partido es solo para hombres', 403);
    }

    if (match.genderMode === 'FEMALE_ONLY' && joiningUser.gender !== 'FEMALE') {
      throw new AppError('Este partido es solo para mujeres', 403);
    }

    if (match.genderMode === 'MIXED') {
      const currentMales = match.players.filter((p) => p.user?.gender === 'MALE').length;
      const currentFemales = match.players.filter((p) => p.user?.gender === 'FEMALE').length;

      if (joiningUser.gender === 'MALE' && match.requiredMales != null && currentMales >= match.requiredMales) {
        throw new AppError('Ya se completaron los cupos para hombres', 403);
      }

      if (joiningUser.gender === 'FEMALE' && match.requiredFemales != null && currentFemales >= match.requiredFemales) {
        throw new AppError('Ya se completaron los cupos para mujeres', 403);
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      await tx.matchPlayer.create({
        data: {
          matchId,
          userId,
        },
      });

      const newCount = match.confirmedCount + 1;
      const newStatus = newCount >= match.maxPlayers ? 'FULL' : 'OPEN';

      const updatedMatch = await tx.match.update({
        where: { id: matchId },
        data: {
          confirmedCount: newCount,
          status: newStatus,
        },
        include: {
          creator: {
            select: { id: true, firstName: true, lastName: true, gender: true },
          },
          club: { select: { id: true, name: true } },
          court: { select: { id: true, number: true, name: true } },
          players: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  category: true,
                  gender: true,
                  avatarUrl: true,
                },
              },
            },
            orderBy: { joinedAt: 'asc' },
          },
        },
      });

      return updatedMatch;
    });

    return result;
  }

  async leaveMatch(matchId: string, userId: string) {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { players: true },
    });

    if (!match) {
      throw new AppError('Partido no encontrado', 404);
    }

    if (match.creatorId === userId) {
      throw new AppError('El creador no puede abandonar el partido. Cancélalo si deseas salir', 400);
    }

    const playerEntry = match.players.find((p) => p.userId === userId);
    if (!playerEntry) {
      throw new AppError('No estás inscrito en este partido', 400);
    }

    if (match.status === 'CANCELLED' || match.status === 'COMPLETED') {
      throw new AppError('No se puede abandonar un partido cancelado o completado', 400);
    }

    const result = await prisma.$transaction(async (tx) => {
      await tx.matchPlayer.delete({
        where: { id: playerEntry.id },
      });

      const newCount = match.confirmedCount - 1;
      const newStatus = match.status === 'FULL' ? 'OPEN' : match.status;

      const updatedMatch = await tx.match.update({
        where: { id: matchId },
        data: {
          confirmedCount: newCount,
          status: newStatus,
        },
        select: {
          id: true,
          confirmedCount: true,
          status: true,
        },
      });

      return updatedMatch;
    });

    return result;
  }

  async getMyMatches(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const where: Prisma.MatchWhereInput = {
      OR: [
        { creatorId: userId },
        { players: { some: { userId } } },
      ],
    };

    const [matches, total] = await Promise.all([
      prisma.match.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ scheduledDate: 'desc' }, { scheduledTime: 'desc' }],
        include: {
          creator: {
            select: { id: true, firstName: true, lastName: true, category: true, gender: true },
          },
          club: { select: { id: true, name: true, address: true } },
          court: { select: { id: true, number: true, name: true } },
          players: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  category: true,
                  gender: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
      }),
      prisma.match.count({ where }),
    ]);

    return { matches, total };
  }

  async removeGuest(matchId: string, matchPlayerId: string, userId: string) {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
    });

    if (!match) {
      throw new AppError('Partido no encontrado', 404);
    }

    if (match.creatorId !== userId) {
      throw new AppError('Solo el creador puede eliminar invitados', 403);
    }

    const matchPlayer = await prisma.matchPlayer.findUnique({
      where: { id: matchPlayerId },
    });

    if (!matchPlayer || matchPlayer.matchId !== matchId) {
      throw new AppError('Jugador no encontrado en este partido', 404);
    }

    if (!matchPlayer.isGuest) {
      throw new AppError('Solo se pueden eliminar jugadores invitados', 400);
    }

    const result = await prisma.$transaction(async (tx) => {
      await tx.matchPlayer.delete({ where: { id: matchPlayerId } });

      const newCount = match.confirmedCount - 1;
      const newStatus = match.status === 'FULL' ? 'OPEN' : match.status;

      return tx.match.update({
        where: { id: matchId },
        data: { confirmedCount: newCount, status: newStatus },
        select: { id: true, confirmedCount: true, status: true },
      });
    });

    return result;
  }

  async getWhatsAppLink(matchId: string) {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        creator: {
          select: { firstName: true, lastName: true, phone: true },
        },
        club: { select: { name: true } },
        court: { select: { number: true } },
      },
    });

    if (!match) {
      throw new AppError('Partido no encontrado', 404);
    }

    const link = getMatchWhatsAppLink(match as any);
    return { whatsappLink: link };
  }
}

export const matchesService = new MatchesService();
