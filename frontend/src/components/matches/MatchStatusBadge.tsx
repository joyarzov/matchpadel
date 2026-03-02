import { cn } from '@/lib/utils';
import type { MatchStatus } from '@/types/match.types';

interface MatchStatusBadgeProps {
  status: MatchStatus;
  className?: string;
}

const statusConfig: Record<MatchStatus, { label: string; classes: string }> = {
  OPEN: {
    label: 'Abierto',
    classes: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  },
  FULL: {
    label: 'Completo',
    classes: 'bg-red-100 text-red-700 border-red-200',
  },
  IN_PROGRESS: {
    label: 'En juego',
    classes: 'bg-amber-100 text-amber-700 border-amber-200',
  },
  COMPLETED: {
    label: 'Finalizado',
    classes: 'bg-blue-100 text-blue-700 border-blue-200',
  },
  CANCELLED: {
    label: 'Cancelado',
    classes: 'bg-slate-100 text-slate-500 border-slate-200',
  },
};

export function MatchStatusBadge({ status, className }: MatchStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold',
        config.classes,
        className,
      )}
    >
      {config.label}
    </span>
  );
}
