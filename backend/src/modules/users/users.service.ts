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

    return {
      matchesPlayed,
      matchesCreated,
      favoriteClub,
      memberSince: user.createdAt.toISOString(),
    };
  }

  async getRanking(limit: number = 10) {
    // Get users with most COMPLETED matches
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
        _count: {
          select: {
            matchPlayers: {
              where: {
                match: { status: 'COMPLETED' },
              },
            },
          },
        },
      },
    });

    // Also count matches where user is creator + COMPLETED
    const creatorsCompleted = await prisma.match.groupBy({
      by: ['creatorId'],
      where: { status: 'COMPLETED' },
      _count: { creatorId: true },
    });

    const creatorMap = new Map<string, number>();
    for (const c of creatorsCompleted) {
      creatorMap.set(c.creatorId, c._count.creatorId);
    }

    const ranked = players.map((p) => {
      const asPlayer = p._count.matchPlayers;
      const asCreator = creatorMap.get(p.id) ?? 0;
      // matchPlayers already includes creator (since creator is added as player)
      // so we just use matchPlayers count
      return {
        userId: p.id,
        firstName: p.firstName,
        lastName: p.lastName,
        category: p.category,
        avatarUrl: p.avatarUrl,
        matchesPlayed: asPlayer,
      };
    });

    ranked.sort((a, b) => b.matchesPlayed - a.matchesPlayed);

    return ranked.slice(0, limit).map((entry, index) => ({
      position: index + 1,
      ...entry,
    }));
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
