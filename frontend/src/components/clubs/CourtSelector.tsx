import { Loader2 } from 'lucide-react';
import { useCourts } from '@/hooks/useClubs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface CourtSelectorProps {
  clubId: string;
  value: string;
  onChange: (courtId: string) => void;
}

const courtTypeLabels: Record<string, string> = {
  INDOOR: 'Interior',
  OUTDOOR: 'Exterior',
  COVERED: 'Techada',
};

export function CourtSelector({ clubId, value, onChange }: CourtSelectorProps) {
  const { data: courts, isLoading } = useCourts(clubId);

  if (!clubId) {
    return (
      <Select disabled>
        <SelectTrigger>
          <SelectValue placeholder="Primero selecciona un club" />
        </SelectTrigger>
        <SelectContent>
          <div className="px-2 py-4 text-center text-sm text-slate-500">
            Primero selecciona un club
          </div>
        </SelectContent>
      </Select>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-10 items-center gap-2 rounded-md border border-input px-3 text-sm text-slate-400">
        <Loader2 className="h-4 w-4 animate-spin" />
        Cargando canchas...
      </div>
    );
  }

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder="Selecciona una cancha (opcional)" />
      </SelectTrigger>
      <SelectContent>
        {courts && courts.length > 0 ? (
          courts
            .filter((court) => court.isActive)
            .map((court) => (
              <SelectItem key={court.id} value={court.id}>
                {court.name} ({courtTypeLabels[court.type] ?? court.type})
              </SelectItem>
            ))
        ) : (
          <div className="px-2 py-4 text-center text-sm text-slate-500">
            No hay canchas disponibles
          </div>
        )}
      </SelectContent>
    </Select>
  );
}
