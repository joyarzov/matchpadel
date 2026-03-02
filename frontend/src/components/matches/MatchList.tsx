import { PadelIcon } from '@/components/icons/PadelIcon';
import { MatchCard } from '@/components/matches/MatchCard';
import type { Match } from '@/types/match.types';

interface MatchListProps {
  matches: Match[];
  currentUserId?: string;
  onJoin?: (matchId: string) => void;
  onLeave?: (matchId: string) => void;
  onEdit?: (matchId: string) => void;
  onCancel?: (matchId: string) => void;
}

export function MatchList({
  matches,
  currentUserId,
  onJoin,
  onLeave,
  onEdit,
  onCancel,
}: MatchListProps) {
  if (matches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
          <PadelIcon className="h-8 w-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-medium text-slate-800">
          No hay partidos disponibles
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          Intenta cambiar los filtros o crea un nuevo partido.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {matches.map((match) => (
        <MatchCard
          key={match.id}
          match={match}
          currentUserId={currentUserId}
          onJoin={onJoin}
          onLeave={onLeave}
          onEdit={onEdit}
          onCancel={onCancel}
        />
      ))}
    </div>
  );
}
