import { useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  MapPin,
  Calendar,
  Clock,
  MessageCircle,
  UserPlus,
  UserMinus,
  Pencil,
  XCircle,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MatchStatusBadge } from '@/components/matches/MatchStatusBadge';
import { getMatchWhatsAppLink } from '@/lib/whatsapp';
import { cn } from '@/lib/utils';
import type { Match } from '@/types/match.types';
import type { PlayerCategory } from '@/types/auth.types';

interface MatchCardProps {
  match: Match;
  currentUserId?: string;
  onJoin?: (matchId: string) => void;
  onLeave?: (matchId: string) => void;
  onEdit?: (matchId: string) => void;
  onCancel?: (matchId: string) => void;
}

const categoryColors: Record<PlayerCategory, string> = {
  PRIMERA: 'bg-red-500 text-white',
  SEGUNDA: 'bg-orange-500 text-white',
  TERCERA: 'bg-amber-500 text-white',
  CUARTA: 'bg-emerald-500 text-white',
  QUINTA: 'bg-blue-500 text-white',
  SEXTA: 'bg-indigo-500 text-white',
  SEPTIMA: 'bg-purple-500 text-white',
};

export function MatchCard({
  match,
  currentUserId,
  onJoin,
  onLeave,
  onEdit,
  onCancel,
}: MatchCardProps) {
  const navigate = useNavigate();

  const isCreator = currentUserId === match.creatorId;
  const isJoined = match.players.some((p) => p.userId === currentUserId);
  const formattedDate = format(parseISO(match.date), "EEEE d 'de' MMMM, yyyy", {
    locale: es,
  });
  const capitalizedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
  const whatsappLink = match.creator?.phone ? getMatchWhatsAppLink(match) : null;

  const handleCardClick = () => {
    navigate(`/matches/${match.id}`);
  };

  return (
    <Card
      className="group cursor-pointer overflow-hidden transition-shadow hover:shadow-lg"
      onClick={handleCardClick}
    >
      <CardContent className="p-0">
        {/* Top badges */}
        <div className="flex items-center justify-between px-4 pt-4">
          <span
            className={cn(
              'rounded-full px-2.5 py-0.5 text-xs font-semibold',
              categoryColors[match.category],
            )}
          >
            {match.category}
          </span>
          <MatchStatusBadge status={match.status} />
        </div>

        <div className="space-y-3 px-4 pb-4 pt-3">
          {/* Club and court */}
          <div className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
            <div>
              <p className="text-sm font-medium text-slate-800">{match.club.name}</p>
              {match.court && (
                <p className="text-xs text-slate-500">{match.court.name}</p>
              )}
            </div>
          </div>

          {/* Date */}
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 shrink-0 text-slate-400" />
            <p className="truncate text-sm text-slate-600">{capitalizedDate}</p>
          </div>

          {/* Time */}
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 shrink-0 text-slate-400" />
            <p className="text-sm text-slate-600">
              {match.startTime} - {match.endTime}
            </p>
          </div>

          {/* Player slots */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              {Array.from({ length: match.maxPlayers }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    'h-6 w-6 rounded-full border-2',
                    i < match.currentPlayers
                      ? 'border-blue-800 bg-blue-800'
                      : 'border-dashed border-slate-300 bg-white',
                  )}
                />
              ))}
            </div>
            <span className="text-sm text-slate-500">
              {match.currentPlayers}/{match.maxPlayers}
            </span>
          </div>

          {/* Creator */}
          <p className="text-xs text-slate-500">
            Creado por {match.creator.firstName} {match.creator.lastName}
          </p>

          {/* Action buttons */}
          <div
            className="flex flex-wrap gap-1.5 pt-1 sm:gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            {whatsappLink && (
              <Button
                size="sm"
                className="bg-emerald-500 text-white hover:bg-emerald-600"
                asChild
              >
                <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="mr-1.5 h-4 w-4" />
                  WhatsApp
                </a>
              </Button>
            )}

            {match.status === 'OPEN' && !isJoined && !isCreator && currentUserId && onJoin && (
              <Button
                size="sm"
                className="bg-blue-800 text-white hover:bg-blue-700"
                onClick={() => onJoin(match.id)}
              >
                <UserPlus className="mr-1.5 h-4 w-4" />
                <span className="hidden sm:inline">Unirme al partido</span>
                <span className="sm:hidden">Unirme</span>
              </Button>
            )}

            {isJoined && !isCreator && onLeave && (
              <Button
                size="sm"
                variant="outline"
                className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
                onClick={() => onLeave(match.id)}
              >
                <UserMinus className="mr-1.5 h-4 w-4" />
                <span className="hidden sm:inline">Salir del partido</span>
                <span className="sm:hidden">Salir</span>
              </Button>
            )}

            {isCreator && (
              <>
                {onEdit && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onEdit(match.id)}
                  >
                    <Pencil className="mr-1.5 h-4 w-4" />
                    Editar
                  </Button>
                )}
                {onCancel && match.status === 'OPEN' && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
                    onClick={() => onCancel(match.id)}
                  >
                    <XCircle className="mr-1.5 h-4 w-4" />
                    Cancelar
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
