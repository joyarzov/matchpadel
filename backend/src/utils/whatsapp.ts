interface MatchInfo {
  scheduledDate: Date;
  scheduledTime: string;
  club: { name: string };
  court?: { number: number } | null;
  category: string;
  confirmedCount: number;
  maxPlayers: number;
  creator: { firstName: string; lastName: string; phone: string };
}

export function getWhatsAppDirectLink(phone: string, message: string): string {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const formattedPhone = cleanPhone.startsWith('56') ? cleanPhone : `56${cleanPhone}`;
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
}

export function getMatchWhatsAppLink(match: MatchInfo): string {
  const date = new Date(match.scheduledDate);
  const formattedDate = date.toLocaleDateString('es-CL', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const courtInfo = match.court ? ` - Cancha ${match.court.number}` : '';
  const spotsLeft = match.maxPlayers - match.confirmedCount;

  const message =
    `Hola! Te invito a jugar padel:\n\n` +
    `Fecha: ${formattedDate}\n` +
    `Hora: ${match.scheduledTime}\n` +
    `Club: ${match.club.name}${courtInfo}\n` +
    `Categoría: ${match.category}\n` +
    `Jugadores: ${match.confirmedCount}/${match.maxPlayers}\n` +
    `Cupos disponibles: ${spotsLeft}\n\n` +
    `Organiza: ${match.creator.firstName} ${match.creator.lastName}\n` +
    `Unite en MatchPadel!`;

  return getWhatsAppDirectLink(match.creator.phone, message);
}
