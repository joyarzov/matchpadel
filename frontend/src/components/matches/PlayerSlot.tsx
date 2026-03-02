import { MessageCircle, UserPlus, User as UserIcon } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { getWhatsAppDirectLink } from '@/lib/whatsapp';
import type { MatchPlayer } from '@/types/match.types';

interface PlayerSlotProps {
  matchPlayer?: MatchPlayer | null;
  isCreator?: boolean;
  onJoin?: () => void;
  matchCreatorPhone?: string | null;
  canJoin?: boolean;
}

export function PlayerSlot({
  matchPlayer,
  isCreator = false,
  onJoin,
  canJoin = false,
}: PlayerSlotProps) {
  // Empty slot
  if (!matchPlayer) {
    return (
      <div className="flex items-center gap-3 rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 px-4 py-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-dashed border-slate-300">
          <UserPlus className="h-5 w-5 text-slate-400" />
        </div>
        <div className="flex-1">
          <p className="text-sm italic text-slate-400">Esperando jugador...</p>
        </div>
        {canJoin && onJoin && (
          <Button
            size="sm"
            className="bg-blue-800 text-white hover:bg-blue-700"
            onClick={onJoin}
          >
            Unirse
          </Button>
        )}
      </div>
    );
  }

  // Guest without user account
  if (matchPlayer.isGuest && !matchPlayer.user) {
    const displayName = matchPlayer.guestName || 'Invitado';
    return (
      <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3">
        <Avatar className="h-10 w-10">
          <AvatarFallback className="bg-slate-200 text-sm text-slate-500">
            <UserIcon className="h-5 w-5" />
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-slate-700">{displayName}</p>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
              Invitado
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Player with user account (registered user or guest with account)
  const player = matchPlayer.user!;
  const initials = `${player.firstName.charAt(0)}${player.lastName.charAt(0)}`.toUpperCase();
  const whatsappLink = player.phone
    ? getWhatsAppDirectLink(player.phone)
    : null;

  return (
    <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3">
      <Avatar className="h-10 w-10">
        <AvatarImage src={player.avatarUrl ?? undefined} alt={player.firstName} />
        <AvatarFallback className="bg-blue-100 text-sm font-semibold text-blue-800">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-slate-800">
            {player.firstName} {player.lastName}
          </p>
          {isCreator && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
              Creador
            </span>
          )}
          {matchPlayer.isGuest && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
              Invitado
            </span>
          )}
        </div>
        {player.category && (
          <p className="text-xs text-slate-500">{player.category}</p>
        )}
      </div>
      {whatsappLink && (
        <a
          href={whatsappLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white transition-colors hover:bg-emerald-600"
          aria-label={`Contactar a ${player.firstName} por WhatsApp`}
        >
          <MessageCircle className="h-4 w-4" />
        </a>
      )}
    </div>
  );
}
