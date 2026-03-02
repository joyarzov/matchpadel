import { useState, useEffect } from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ClubSelector } from '@/components/clubs/ClubSelector';
import { CourtSelector } from '@/components/clubs/CourtSelector';
import { cn } from '@/lib/utils';
import type { CreateMatchRequest } from '@/types/match.types';
import type { PlayerCategory } from '@/types/auth.types';

interface MatchFormProps {
  onSubmit: (data: CreateMatchRequest) => Promise<void>;
  initialData?: Partial<CreateMatchRequest>;
  isEdit?: boolean;
}

const categoryOptions: { value: PlayerCategory; label: string }[] = [
  { value: 'SEXTA', label: 'Sexta' },
  { value: 'QUINTA', label: 'Quinta' },
  { value: 'CUARTA', label: 'Cuarta' },
  { value: 'TERCERA', label: 'Tercera' },
  { value: 'SEGUNDA', label: 'Segunda' },
  { value: 'PRIMERA', label: 'Primera' },
];

const durationOptions = [
  { value: 60, label: '60 min' },
  { value: 90, label: '90 min' },
  { value: 120, label: '120 min' },
];

function addMinutesToTime(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number);
  const totalMinutes = h * 60 + m + minutes;
  const endH = Math.floor(totalMinutes / 60) % 24;
  const endM = totalMinutes % 60;
  return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
}

export function MatchForm({ onSubmit, initialData, isEdit = false }: MatchFormProps) {
  const [clubId, setClubId] = useState(initialData?.clubId ?? '');
  const [courtId, setCourtId] = useState(initialData?.courtId ?? '');
  const [category, setCategory] = useState<PlayerCategory | ''>(
    initialData?.category ?? '',
  );
  const [date, setDate] = useState(initialData?.scheduledDate ?? '');
  const [startTime, setStartTime] = useState(initialData?.scheduledTime ?? '');
  const [duration, setDuration] = useState(initialData?.durationMinutes ?? 90);
  const [description, setDescription] = useState(initialData?.notes ?? '');
  const [maxPlayers, setMaxPlayers] = useState(initialData?.maxPlayers ?? 4);
  const [initialPlayers, setInitialPlayers] = useState(initialData?.initialPlayers ?? 1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const endTime = startTime ? addMinutesToTime(startTime, duration) : '';

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!clubId) newErrors.clubId = 'Selecciona un club';
    if (!category) newErrors.category = 'Selecciona una categoría';
    if (!date) newErrors.date = 'Selecciona una fecha';
    if (!startTime) newErrors.startTime = 'Selecciona una hora de inicio';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        clubId,
        courtId: courtId || null,
        category: category as PlayerCategory,
        scheduledDate: date,
        scheduledTime: startTime,
        durationMinutes: duration,
        maxPlayers,
        initialPlayers,
        notes: description || null,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
        <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
        <div className="text-sm text-amber-800">
          <p className="font-semibold">Esta aplicación no reserva canchas</p>
          <p className="mt-1">
            Debes reservar la cancha directamente con el club antes de publicar tu partido.
            MatchPadel solo te ayuda a encontrar jugadores.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Form fields */}
        <div className="space-y-5">
          {/* Club */}
          <div className="space-y-2">
            <Label>Club</Label>
            <ClubSelector value={clubId} onChange={(v) => { setClubId(v); setCourtId(''); }} />
            {errors.clubId && (
              <p className="text-xs text-red-500">{errors.clubId}</p>
            )}
          </div>

          {/* Court */}
          <div className="space-y-2">
            <Label>Cancha</Label>
            <CourtSelector
              clubId={clubId}
              value={courtId}
              onChange={setCourtId}
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>Categoría</Label>
            <div className="flex flex-wrap gap-2">
              {categoryOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setCategory(opt.value)}
                  className={cn(
                    'rounded-full border-2 px-4 py-1.5 text-sm font-medium transition-colors',
                    category === opt.value
                      ? 'border-blue-800 bg-blue-800 text-white'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300',
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {errors.category && (
              <p className="text-xs text-red-500">{errors.category}</p>
            )}
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="match-date">Fecha</Label>
            <Input
              id="match-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
            {errors.date && (
              <p className="text-xs text-red-500">{errors.date}</p>
            )}
          </div>

          {/* Time */}
          <div className="space-y-2">
            <Label htmlFor="match-time">Hora de inicio</Label>
            <Input
              id="match-time"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
            {errors.startTime && (
              <p className="text-xs text-red-500">{errors.startTime}</p>
            )}
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label>Duración</Label>
            <div className="flex gap-2">
              {durationOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setDuration(opt.value)}
                  className={cn(
                    'rounded-md border-2 px-4 py-2 text-sm font-medium transition-colors',
                    duration === opt.value
                      ? 'border-blue-800 bg-blue-800 text-white'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300',
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Max players */}
          <div className="space-y-2">
            <Label htmlFor="max-players">Jugadores máximos</Label>
            <Input
              id="max-players"
              type="number"
              min={2}
              max={8}
              value={maxPlayers}
              onChange={(e) => {
                const val = Number(e.target.value);
                setMaxPlayers(val);
                if (initialPlayers > val) setInitialPlayers(Math.min(initialPlayers, val));
              }}
            />
          </div>

          {/* Initial players */}
          <div className="space-y-2">
            <Label>¿Con cuántos jugadores vienes?</Label>
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: maxPlayers }, (_, i) => i + 1).map((n) => {
                const label =
                  n === 1 ? 'Solo yo' : `Vengo con ${n - 1}`;
                return (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setInitialPlayers(n)}
                    className={cn(
                      'rounded-full border-2 px-4 py-1.5 text-sm font-medium transition-colors',
                      initialPlayers === n
                        ? 'border-blue-800 bg-blue-800 text-white'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300',
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            {initialPlayers > 1 && (
              <p className="text-xs text-slate-500">
                Se publicarán {maxPlayers - initialPlayers} cupo{maxPlayers - initialPlayers !== 1 ? 's' : ''} disponible{maxPlayers - initialPlayers !== 1 ? 's' : ''}
              </p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="description">Notas (opcional)</Label>
            <Textarea
              id="description"
              placeholder="Información adicional del partido..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        {/* Preview */}
        <div className="lg:sticky lg:top-24">
          <Card className="overflow-hidden">
            <CardHeader className="bg-slate-50 pb-3">
              <CardTitle className="text-base text-slate-800">Vista previa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
              {category && (
                <span className="inline-block rounded-full bg-blue-800 px-2.5 py-0.5 text-xs font-semibold text-white">
                  {category}
                </span>
              )}

              {clubId ? (
                <p className="text-sm font-medium text-slate-800">Club seleccionado</p>
              ) : (
                <p className="text-sm italic text-slate-400">Selecciona un club</p>
              )}

              {date ? (
                <p className="text-sm text-slate-600">{date}</p>
              ) : (
                <p className="text-sm italic text-slate-400">Fecha por definir</p>
              )}

              {startTime ? (
                <p className="text-sm text-slate-600">
                  {startTime} - {endTime} ({duration} min)
                </p>
              ) : (
                <p className="text-sm italic text-slate-400">Hora por definir</p>
              )}

              <div className="flex items-center gap-1">
                {Array.from({ length: maxPlayers }).map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      'h-6 w-6 rounded-full border-2',
                      i < initialPlayers
                        ? 'border-blue-800 bg-blue-800'
                        : 'border-dashed border-slate-300 bg-white',
                    )}
                  />
                ))}
                <span className="ml-2 text-sm text-slate-500">
                  {initialPlayers}/{maxPlayers}
                  {maxPlayers - initialPlayers > 0 && (
                    <> · {maxPlayers - initialPlayers} cupo{maxPlayers - initialPlayers !== 1 ? 's' : ''}</>
                  )}
                </span>
              </div>

              {description && (
                <p className="text-sm text-slate-500">{description}</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Button
        type="submit"
        className="w-full bg-blue-800 hover:bg-blue-700 sm:w-auto"
        disabled={isSubmitting}
        size="lg"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {isEdit ? 'Guardando...' : 'Publicando...'}
          </>
        ) : isEdit ? (
          'Guardar Cambios'
        ) : (
          'Publicar Partido'
        )}
      </Button>
    </form>
  );
}
