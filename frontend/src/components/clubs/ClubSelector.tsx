import { Loader2 } from 'lucide-react';
import { useClubs } from '@/hooks/useClubs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ClubSelectorProps {
  value: string;
  onChange: (clubId: string) => void;
}

export function ClubSelector({ value, onChange }: ClubSelectorProps) {
  const { data: clubs, isLoading } = useClubs();

  if (isLoading) {
    return (
      <div className="flex h-10 items-center gap-2 rounded-md border border-input px-3 text-sm text-slate-400">
        <Loader2 className="h-4 w-4 animate-spin" />
        Cargando clubes...
      </div>
    );
  }

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder="Selecciona un club" />
      </SelectTrigger>
      <SelectContent>
        {clubs && clubs.length > 0 ? (
          clubs.map((club) => (
            <SelectItem key={club.id} value={club.id}>
              {club.name} - {club.city}
            </SelectItem>
          ))
        ) : (
          <div className="px-2 py-4 text-center text-sm text-slate-500">
            No hay clubes disponibles
          </div>
        )}
      </SelectContent>
    </Select>
  );
}
