import { prisma } from '../../config/database';
import { Prisma } from '@prisma/client';
import { AppError } from '../../middleware/errorHandler';
import { CreateCourtInput, UpdateCourtInput } from './courts.validators';

export class CourtsService {
  async listByClub(clubId: string) {
    const club = await prisma.club.findUnique({ where: { id: clubId } });
    if (!club) {
      throw new AppError('Club no encontrado', 404);
    }

    const courts = await prisma.court.findMany({
      where: { clubId, isActive: true },
      orderBy: { number: 'asc' },
    });

    return courts;
  }

  async getById(clubId: string, courtId: string) {
    const court = await prisma.court.findFirst({
      where: { id: courtId, clubId },
    });

    if (!court) {
      throw new AppError('Cancha no encontrada', 404);
    }

    return court;
  }

  async create(clubId: string, data: CreateCourtInput) {
    const club = await prisma.club.findUnique({ where: { id: clubId } });
    if (!club) {
      throw new AppError('Club no encontrado', 404);
    }

    const existing = await prisma.court.findUnique({
      where: { clubId_number: { clubId, number: data.number as number } },
    });

    if (existing) {
      throw new AppError(`Ya existe una cancha número ${data.number} en este club`, 409);
    }

    const court = await prisma.court.create({
      data: {
        ...(data as Prisma.CourtUncheckedCreateWithoutClubInput),
        clubId,
      },
    });

    return court;
  }

  async update(clubId: string, courtId: string, data: UpdateCourtInput) {
    const court = await prisma.court.findFirst({
      where: { id: courtId, clubId },
    });

    if (!court) {
      throw new AppError('Cancha no encontrada', 404);
    }

    if (data.number && (data.number as number) !== court.number) {
      const existing = await prisma.court.findUnique({
        where: { clubId_number: { clubId, number: data.number as number } },
      });
      if (existing) {
        throw new AppError(`Ya existe una cancha número ${data.number} en este club`, 409);
      }
    }

    const updated = await prisma.court.update({
      where: { id: courtId },
      data: data as Prisma.CourtUpdateInput,
    });

    return updated;
  }

  async deactivate(clubId: string, courtId: string) {
    const court = await prisma.court.findFirst({
      where: { id: courtId, clubId },
    });

    if (!court) {
      throw new AppError('Cancha no encontrada', 404);
    }

    const updated = await prisma.court.update({
      where: { id: courtId },
      data: { isActive: false },
      select: {
        id: true,
        number: true,
        name: true,
        isActive: true,
      },
    });

    return updated;
  }
}

export const courtsService = new CourtsService();
