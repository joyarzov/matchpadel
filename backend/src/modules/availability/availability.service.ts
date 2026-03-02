import { prisma } from '../../config/database';
import { getAvailability as fetchMatchPoint, MatchPointCuadroData, MatchPointColumna } from './matchpoint.client';
import { getAvailability as fetchEasyCancha } from './easycancha.client';

interface TimeSlot {
  startTime: string;
  endTime: string;
  status: 'free' | 'occupied';
}

interface CourtAvailability {
  courtId: string;
  courtName: string;
  slots: TimeSlot[];
}

interface CenterAvailability {
  clubId: string;
  clubName: string;
  clubAddress: string;
  openTime: string;
  closeTime: string;
  courts: CourtAvailability[];
  source: 'matchpoint' | 'easycancha';
  connected: boolean;
  error?: string;
}

function transformMatchPointColumn(col: MatchPointColumna, cuadro: MatchPointCuadroData): CourtAvailability {
  const occupiedMap = new Map<string, string>();
  for (const oc of col.Ocupaciones) {
    occupiedMap.set(oc.StrHoraInicio, oc.Tipo ?? 'ocupado');
  }

  const slots: TimeSlot[] = [];

  if (col.HorariosFijos.length > 0) {
    for (const hf of col.HorariosFijos) {
      const tipo = occupiedMap.get(hf.StrHoraInicio);
      // Skip clase slots entirely
      if (tipo && tipo.includes('clase')) continue;
      slots.push({
        startTime: hf.StrHoraInicio,
        endTime: hf.StrHoraFin,
        status: tipo ? 'occupied' : 'free',
      });
    }
  } else {
    const hInicio = cuadro.StrHoraInicio ?? '08:00';
    let hFin = cuadro.StrHoraFin ?? '23:00';
    if (hFin === '00:00' || hFin === '0:00') hFin = '24:00';

    const partes = cuadro.PartesPorHora ?? 2;
    const minStep = Math.floor(60 / partes);

    const [startH, startM] = hInicio.split(':').map(Number);
    const [endH, endM] = hFin.split(':').map(Number);
    const startTotal = startH * 60 + startM;
    const endTotal = endH * 60 + endM;

    for (let t = startTotal; t < endTotal; t += minStep) {
      const h = Math.floor(t / 60);
      const m = t % 60;
      const nextT = t + minStep;
      const nextH = Math.floor(nextT / 60);
      const nextM = nextT % 60;

      const hora = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      const horaFin = `${String(nextH).padStart(2, '0')}:${String(nextM).padStart(2, '0')}`;

      const tipo = occupiedMap.get(hora);
      if (tipo && tipo.includes('clase')) continue;
      slots.push({
        startTime: hora,
        endTime: horaFin,
        status: tipo ? 'occupied' : 'free',
      });
    }
  }

  return {
    courtId: col.Id,
    courtName: col.TextoPrincipal,
    slots,
  };
}

async function fetchMatchPointCenter(club: { id: string; name: string; address: string; matchpointDomain: string }, date: string): Promise<CenterAvailability> {
  const cuadros = await fetchMatchPoint(club.matchpointDomain, date);

  const courts: CourtAvailability[] = [];
  let openTime = '08:00';
  let closeTime = '23:00';

  for (const cuadro of cuadros) {
    openTime = cuadro.StrHoraInicio ?? openTime;
    closeTime = cuadro.StrHoraFin ?? closeTime;
    for (const col of cuadro.Columnas) {
      courts.push(transformMatchPointColumn(col, cuadro));
    }
  }

  return {
    clubId: club.id,
    clubName: club.name,
    clubAddress: club.address,
    openTime,
    closeTime,
    courts,
    source: 'matchpoint',
    connected: true,
  };
}

async function fetchEasyCanchaCenter(club: { id: string; name: string; address: string; easycanchaClubId: number }, date: string): Promise<CenterAvailability> {
  const result = await fetchEasyCancha(club.easycanchaClubId, date);

  const courts: CourtAvailability[] = [];

  // Sort courts by name
  const sortedCourts = [...result.freeSlots.entries()].sort(([a], [b]) => a.localeCompare(b));

  for (const [courtName, freeHours] of sortedCourts) {
    const slots: TimeSlot[] = result.allHours.map((hora) => ({
      startTime: hora,
      endTime: '', // EasyCancha doesn't always give end time in grouped view
      status: freeHours.has(hora) ? 'free' as const : 'occupied' as const,
    }));

    courts.push({
      courtId: courtName,
      courtName,
      slots,
    });
  }

  const openTime = result.allHours.length > 0 ? result.allHours[0] : '07:00';
  const closeTime = result.allHours.length > 0 ? result.allHours[result.allHours.length - 1] : '24:00';

  return {
    clubId: club.id,
    clubName: club.name,
    clubAddress: club.address,
    openTime,
    closeTime,
    courts,
    source: 'easycancha',
    connected: true,
  };
}

export const availabilityService = {
  async getCities(): Promise<string[]> {
    const result = await prisma.club.findMany({
      where: {
        isActive: true,
        OR: [
          { matchpointDomain: { not: null } },
          { easycanchaClubId: { not: null } },
        ],
      },
      select: { city: true },
      distinct: ['city'],
      orderBy: { city: 'asc' },
    });
    return result.map((r) => r.city);
  },

  async getAvailabilityByCity(city: string, date: string): Promise<CenterAvailability[]> {
    const clubs = await prisma.club.findMany({
      where: {
        city,
        isActive: true,
        OR: [
          { matchpointDomain: { not: null } },
          { easycanchaClubId: { not: null } },
        ],
      },
      orderBy: { name: 'asc' },
    });

    const results = await Promise.allSettled(
      clubs.map(async (club): Promise<CenterAvailability> => {
        if (club.matchpointDomain) {
          return fetchMatchPointCenter(
            { id: club.id, name: club.name, address: club.address, matchpointDomain: club.matchpointDomain },
            date,
          );
        }
        if (club.easycanchaClubId) {
          return fetchEasyCanchaCenter(
            { id: club.id, name: club.name, address: club.address, easycanchaClubId: club.easycanchaClubId },
            date,
          );
        }
        throw new Error('Club sin proveedor de disponibilidad configurado');
      }),
    );

    return results.map((result, i) => {
      if (result.status === 'fulfilled') {
        return result.value;
      }
      const club = clubs[i];
      return {
        clubId: club.id,
        clubName: club.name,
        clubAddress: club.address,
        openTime: '',
        closeTime: '',
        courts: [],
        source: (club.matchpointDomain ? 'matchpoint' : 'easycancha') as 'matchpoint' | 'easycancha',
        connected: false,
        error: result.reason?.message ?? 'Error al consultar disponibilidad',
      };
    });
  },
};
