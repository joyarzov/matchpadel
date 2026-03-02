import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Match } from '@/types/match.types';

export function getWhatsAppDirectLink(phone: string, message?: string): string {
  const cleanPhone = phone.replace(/[^0-9+]/g, '');
  const phoneNumber = cleanPhone.startsWith('+') ? cleanPhone.slice(1) : cleanPhone;
  const baseUrl = `https://wa.me/${phoneNumber}`;

  if (message) {
    return `${baseUrl}?text=${encodeURIComponent(message)}`;
  }

  return baseUrl;
}

export function getMatchWhatsAppLink(match: Match): string {
  const dateStr = format(parseISO(match.date), "EEEE d 'de' MMMM", { locale: es });
  const spotsLeft = match.maxPlayers - match.currentPlayers;

  const message = [
    `Hola! Te escribo por el partido de pádel en MatchPadel.`,
    ``,
    `Club: ${match.club.name}`,
    `Fecha: ${dateStr}`,
    `Hora: ${match.startTime} - ${match.endTime}`,
    `Categoría: ${match.category}`,
    `Cupos disponibles: ${spotsLeft}`,
    match.pricePerPlayer ? `Precio por jugador: $${match.pricePerPlayer.toLocaleString('es-CL')}` : '',
    ``,
    `Me gustaría unirme al partido!`,
  ]
    .filter(Boolean)
    .join('\n');

  if (match.creator?.phone) {
    return getWhatsAppDirectLink(match.creator.phone, message);
  }

  return '';
}

/**
 * Builds a WhatsApp share URL with match details and a share link that includes OG tags.
 * The share link points to the backend /share/match/:id route for proper OG preview.
 */
export function getMatchShareWhatsAppUrl(match: Match, backendBaseUrl: string): string {
  const dateStr = format(parseISO(match.date), "EEEE d 'de' MMMM", { locale: es });
  const spotsLeft = match.maxPlayers - match.currentPlayers;

  // Build the share URL (backend route with OG tags)
  const shareUrl = `${backendBaseUrl}/share/match/${match.id}`;

  const message = [
    `Partido de Pádel - ${match.category}`,
    ``,
    `Club: ${match.club.name}`,
    `Fecha: ${dateStr}`,
    `Hora: ${match.startTime} - ${match.endTime}`,
    `Cupos disponibles: ${spotsLeft}/${match.maxPlayers}`,
    match.pricePerPlayer ? `Precio: $${match.pricePerPlayer.toLocaleString('es-CL')} por jugador` : '',
    ``,
    `Unite desde MatchPadel:`,
    shareUrl,
  ]
    .filter(Boolean)
    .join('\n');

  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}
