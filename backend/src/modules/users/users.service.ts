import { prisma } from '../../config/database';
import { hashPassword, comparePassword } from '../../utils/password';
import { AppError } from '../../middleware/errorHandler';
import { UpdateProfileInput, ChangePasswordInput } from './users.validators';
import { UserRole } from '@prisma/client';

export class UsersService {
  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        category: true,
        gender: true,
        role: true,
        avatarUrl: true,
        isActive: true,
        createdAt: true,
        lastLoginAt: true,
        _count: {
          select: {
            createdMatches: true,
            matchPlayers: true,
          },
        },
      },
    });

    if (!user) {
      throw new AppError('Usuario no encontrado', 404);
    }

    return user;
  }

  async updateProfile(userId: string, data: UpdateProfileInput) {
    const user = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        category: true,
        gender: true,
        role: true,
        avatarUrl: true,
        updatedAt: true,
      },
    });

    return user;
  }

  async changePassword(userId: string, data: ChangePasswordInput) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError('Usuario no encontrado', 404);
    }

    const isValid = await comparePassword(data.currentPassword, user.passwordHash);
    if (!isValid) {
      throw new AppError('La contraseña actual es incorrecta', 400);
    }

    const newHash = await hashPassword(data.newPassword);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });

    // Invalidate all refresh tokens
    await prisma.refreshToken.deleteMany({
      where: { userId },
    });
  }

  async listUsers(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          category: true,
          role: true,
          isActive: true,
          createdAt: true,
          lastLoginAt: true,
        },
      }),
      prisma.user.count(),
    ]);

    return { users, total };
  }

  async updateRole(userId: string, role: UserRole) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError('Usuario no encontrado', 404);
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
      },
    });

    return updated;
  }

  async getUserStats(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new AppError('Usuario no encontrado', 404);
    }

    const matchesPlayed = await prisma.match.count({
      where: {
        status: 'COMPLETED',
        OR: [
          { creatorId: userId },
          { players: { some: { userId } } },
        ],
      },
    });

    const matchesCreated = await prisma.match.count({
      where: { creatorId: userId },
    });

    // Favorite club: most frequent club in matches where user participated
    const clubCounts = await prisma.match.groupBy({
      by: ['clubId'],
      where: {
        OR: [
          { creatorId: userId },
          { players: { some: { userId } } },
        ],
      },
      _count: { clubId: true },
      orderBy: { _count: { clubId: 'desc' } },
      take: 1,
    });

    let favoriteClub: { id: string; name: string } | null = null;
    if (clubCounts.length > 0) {
      const club = await prisma.club.findUnique({
        where: { id: clubCounts[0].clubId },
        select: { id: true, name: true },
      });
      favoriteClub = club;
    }

    // Count wins and losses from confirmed scores
    const confirmedScores = await prisma.matchScore.findMany({
      where: {
        status: 'CONFIRMED',
        winnerTeam: { not: null },
        match: {
          players: { some: { userId } },
        },
      },
      include: {
        match: {
          include: {
            players: {
              orderBy: { joinedAt: 'asc' },
            },
          },
        },
      },
    });

    let wins = 0;
    let losses = 0;

    for (const score of confirmedScores) {
      const players = score.match.players;
      const matchPlayer = players.find((p) => p.userId === userId);
      if (!matchPlayer) continue;

      let userTeam: number;
      // Use team player ID arrays if available, otherwise fall back to join order
      if (score.team1PlayerIds.length > 0 || score.team2PlayerIds.length > 0) {
        if (score.team1PlayerIds.includes(matchPlayer.id)) {
          userTeam = 1;
        } else if (score.team2PlayerIds.includes(matchPlayer.id)) {
          userTeam = 2;
        } else {
          continue;
        }
      } else {
        // Legacy fallback: first 2 players = team 1, last 2 = team 2
        const playerIndex = players.findIndex((p) => p.userId === userId);
        userTeam = playerIndex < 2 ? 1 : 2;
      }

      if (score.winnerTeam === userTeam) {
        wins++;
      } else {
        losses++;
      }
    }

    return {
      matchesPlayed,
      matchesCreated,
      wins,
      losses,
      favoriteClub,
      memberSince: user.createdAt.toISOString(),
    };
  }

  async getRanking(limit: number = 10) {
    // Get all active players
    const players = await prisma.user.findMany({
      where: {
        isActive: true,
        role: 'PLAYER',
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        category: true,
        avatarUrl: true,
      },
    });

    // Get all confirmed scores with players
    const confirmedScores = await prisma.matchScore.findMany({
      where: {
        status: 'CONFIRMED',
        winnerTeam: { not: null },
      },
      include: {
        match: {
          include: {
            players: {
              orderBy: { joinedAt: 'asc' },
            },
          },
        },
      },
    });

    // Count wins and losses per player
    const winsMap = new Map<string, number>();
    const lossesMap = new Map<string, number>();
    const matchesPlayedMap = new Map<string, number>();

    for (const score of confirmedScores) {
      const matchPlayers = score.match.players;
      const hasTeamIds = score.team1PlayerIds.length > 0 || score.team2PlayerIds.length > 0;

      for (let i = 0; i < matchPlayers.length; i++) {
        const mp = matchPlayers[i];
        const pid = mp.userId;
        if (!pid) continue; // Skip anonymous guests

        let userTeam: number;
        if (hasTeamIds) {
          if (score.team1PlayerIds.includes(mp.id)) {
            userTeam = 1;
          } else if (score.team2PlayerIds.includes(mp.id)) {
            userTeam = 2;
          } else {
            continue;
          }
        } else {
          userTeam = i < 2 ? 1 : 2;
        }

        matchesPlayedMap.set(pid, (matchesPlayedMap.get(pid) ?? 0) + 1);
        if (score.winnerTeam === userTeam) {
          winsMap.set(pid, (winsMap.get(pid) ?? 0) + 1);
        } else {
          lossesMap.set(pid, (lossesMap.get(pid) ?? 0) + 1);
        }
      }
    }

    const ranked = players.map((p) => ({
      userId: p.id,
      firstName: p.firstName,
      lastName: p.lastName,
      category: p.category,
      avatarUrl: p.avatarUrl,
      wins: winsMap.get(p.id) ?? 0,
      losses: lossesMap.get(p.id) ?? 0,
      matchesPlayed: matchesPlayedMap.get(p.id) ?? 0,
    }));

    // Sort by wins desc, then by fewer losses
    ranked.sort((a, b) => b.wins - a.wins || a.losses - b.losses);

    return ranked.slice(0, limit).map((entry, index) => ({
      position: index + 1,
      ...entry,
    }));
  }

  async searchUsers(query: string) {
    const users = await prisma.user.findMany({
      where: {
        isActive: true,
        OR: [
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        category: true,
        gender: true,
        avatarUrl: true,
      },
      take: 10,
    });

    return users;
  }

  async deactivateUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError('Usuario no encontrado', 404);
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
      },
    });

    // Invalidate all refresh tokens
    await prisma.refreshToken.deleteMany({
      where: { userId },
    });

    return updated;
  }
}

export const usersService = new UsersService();
