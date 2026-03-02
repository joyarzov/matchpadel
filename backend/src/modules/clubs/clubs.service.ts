import { prisma } from '../../config/database';
import { Prisma } from '@prisma/client';
import { AppError } from '../../middleware/errorHandler';
import { CreateClubInput, UpdateClubInput } from './clubs.validators';

export class ClubsService {
  async listActive() {
    const clubs = await prisma.club.findMany({
      where: { isActive: true },
      include: {
        courts: {
          where: { isActive: true },
          orderBy: { number: 'asc' },
        },
        _count: {
          select: { matches: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return clubs;
  }

  async getById(clubId: string) {
    const club = await prisma.club.findUnique({
      where: { id: clubId },
      include: {
        courts: {
          where: { isActive: true },
          orderBy: { number: 'asc' },
        },
        _count: {
          select: { matches: true },
        },
      },
    });

    if (!club) {
      throw new AppError('Club no encontrado', 404);
    }

    return club;
  }

  async create(data: CreateClubInput) {
    const club = await prisma.club.create({
      data: data as Prisma.ClubCreateInput,
      include: {
        courts: true,
      },
    });

    return club;
  }

  async update(clubId: string, data: UpdateClubInput) {
    const existing = await prisma.club.findUnique({
      where: { id: clubId },
    });

    if (!existing) {
      throw new AppError('Club no encontrado', 404);
    }

    const club = await prisma.club.update({
      where: { id: clubId },
      data: data as Prisma.ClubUpdateInput,
      include: {
        courts: {
          where: { isActive: true },
          orderBy: { number: 'asc' },
        },
      },
    });

    return club;
  }

  async deactivate(clubId: string) {
    const existing = await prisma.club.findUnique({
      where: { id: clubId },
    });

    if (!existing) {
      throw new AppError('Club no encontrado', 404);
    }

    const club = await prisma.club.update({
      where: { id: clubId },
      data: { isActive: false },
      select: {
        id: true,
        name: true,
        isActive: true,
      },
    });

    return club;
  }
}

export const clubsService = new ClubsService();
