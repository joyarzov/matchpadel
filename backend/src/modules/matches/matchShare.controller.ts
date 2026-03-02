import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/database';

export async function shareMatch(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const matchId = req.params.matchId as string;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    const matchRow = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        club: true,
        court: true,
        creator: true,
      },
    });

    // If match not found, redirect to home
    if (!matchRow) {
      res.redirect(frontendUrl);
      return;
    }

    // Use any to avoid Prisma include type resolution issues
    const match = matchRow as any;

    const matchUrl = `${frontendUrl}/matches/${match.id}`;
    const host = String(req.get('host') ?? 'localhost:3000');
    const shareUrl = `${req.protocol}://${host}/share/match/${match.id}`;

    // Format date
    const date = new Date(match.scheduledDate);
    const formattedDate = date.toLocaleDateString('es-CL', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });

    // Calculate spots left
    const spotsLeft = match.maxPlayers - match.confirmedCount;

    // Calculate end time
    const [hours, minutes] = (match.scheduledTime as string).split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + match.durationMinutes;
    const endHours = Math.floor(totalMinutes / 60) % 24;
    const endMins = totalMinutes % 60;
    const endTime = `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`;

    // Build OG tags
    const ogTitle = `Partido de Pádel - ${match.category} en ${match.club.name}`;
    const ogDescription = `${formattedDate} · ${match.scheduledTime}-${endTime} · ${spotsLeft} cupos disponibles`;
    const ogImage = match.club.imageUrl || `${frontendUrl}/og-padel.png`;

    // Escape HTML entities in dynamic strings
    const esc = (str: string) =>
      str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(ogTitle)}</title>

  <!-- Open Graph -->
  <meta property="og:type" content="website">
  <meta property="og:title" content="${esc(ogTitle)}">
  <meta property="og:description" content="${esc(ogDescription)}">
  <meta property="og:url" content="${esc(shareUrl)}">
  <meta property="og:image" content="${esc(ogImage)}">
  <meta property="og:site_name" content="MatchPadel">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="${esc(ogTitle)}">
  <meta name="twitter:description" content="${esc(ogDescription)}">
  <meta name="twitter:image" content="${esc(ogImage)}">

  <meta http-equiv="refresh" content="0;url=${esc(matchUrl)}">
</head>
<body>
  <p>Redirigiendo a <a href="${esc(matchUrl)}">MatchPadel</a>...</p>
  <script>window.location.replace(${JSON.stringify(matchUrl)});</script>
</body>
</html>`;

    res.set('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    next(error);
  }
}
