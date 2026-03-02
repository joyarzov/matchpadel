import { useState } from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ClubSelector } from '@/components/clubs/ClubSelector';
import { CourtSelector } from '@/components/clubs/CourtSelector';
import { PlayerSearchInput } from '@/components/matches/PlayerSearchInput';
import { cn } from '@/lib/utils';
import type { CreateMatchRequest, GenderMode } from '@/types/match.types';
import type { PlayerCategory } from '@/types/auth.types';

interface MatchFormProps {
  onSubmit: (data: CreateMatchRequest) => Promise<void>;
  initialData?: Partial<CreateMatchRequest>;
  isEdit?: boolean;
}

const MAX_PLAYERS = 4;

const categoryOptions: { value: PlayerCategory; label: string }[] = [
  { value: 'SEXTA', label: 'Sexta' },
  { value: 'QUINTA', label: 'Quinta' },
  { value: 'CUARTA', label: 'Cuarta' },
  { value: 'TERCERA', label: 'Tercera' },
  { value: 'SEGUNDA', label: 'Segunda' },
  { value: 'PRIMERA', label: 'Primera' },
];

const genderModeOptions: { value: GenderMode; label: string }[] = [
  { value: 'MALE_ONLY', label: 'Solo hombres' },
  { value: 'FEMALE_ONLY', label: 'Solo mujeres' },
  { value: 'MIXED', label: 'Mixto' },
  { value: 'ANY', label: 'Cualquiera' },
];

const durationOptions = [
  { value: 60, label: '60 min' },
  { value: 90, label: '90 min' },
  { value: 120, label: '120 min' },
];

const mixedOptions: { males: number; females: number; label: string }[] = [
  { males: 1, females: 3, label: '1H + 3M' },
  { males: 2, females: 2, label: '2H + 2M' },
  { males: 3, females: 1, label: '3H + 1M' },
];

// Generate time slots from 07:00 to 23:00 in 30-min intervals
const timeSlots: string[] = [];
for (let h = 7; h <= 23; h++) {
  timeSlots.push(`${String(h).padStart(2, '0')}:00`);
  if (h < 23) {
    timeSlots.push(`${String(h).padStart(2, '0')}:30`);
  }
}

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
  const [duration, setDuration] = useState(initialData?.durationMinutes ?? 60);
  const [description, setDescription] = useState(initialData?.notes ?? '');
  const [initialPlayers, setInitialPlayers] = useState(initialData?.initialPlayers ?? 1);
  const [genderMode, setGenderMode] = useState<GenderMode>(initialData?.genderMode ?? 'MALE_ONLY');
  const [requiredMales, setRequiredMales] = useState<number>(initialData?.requiredMales ?? 2);
  const [requiredFemales, setRequiredFemales] = useState<number>(initialData?.requiredFemales ?? 2);
  const [guests, setGuests] = useState<Array<{ userId: string | null; name: string | null; user?: any }>>(
    Array.from({ length: Math.max(0, (initialData?.initialPlayers ?? 1) - 1) }, () => ({ userId: null, name: null }))
  );
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
        maxPlayers: MAX_PLAYERS,
        initialPlayers,
        notes: description || null,
        genderMode,
        requiredMales: genderMode === 'MIXED' ? requiredMales : null,
        requiredFemales: genderMode === 'MIXED' ? requiredFemales : null,
        guests: guests.map((g) => ({ userId: g.userId, name: g.name })),
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

          {/* Gender Mode */}
          <div className="space-y-2">
            <Label>Tipo de partido</Label>
            <div className="flex flex-wrap gap-2">
              {genderModeOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setGenderMode(opt.value)}
                  className={cn(
                    'rounded-full border-2 px-4 py-1.5 text-sm font-medium transition-colors',
                    genderMode === opt.value
                      ? 'border-blue-800 bg-blue-800 text-white'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300',
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Mixed: required males/females */}
          {genderMode === 'MIXED' && (
            <div className="space-y-2">
              <Label>Distribucion de jugadores</Label>
              <div className="flex flex-wrap gap-2">
                {mixedOptions.map((opt) => (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => {
                      setRequiredMales(opt.males);
                      setRequiredFemales(opt.females);
                    }}
                    className={cn(
                      'rounded-full border-2 px-4 py-1.5 text-sm font-medium transition-colors',
                      requiredMales === opt.males && requiredFemales === opt.females
                        ? 'border-purple-600 bg-purple-600 text-white'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300',
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="match-date">Fecha</Label>
            <input
              id="match-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
            {errors.date && (
              <p className="text-xs text-red-500">{errors.date}</p>
            )}
          </div>

          {/* Time */}
          <div className="space-y-2">
            <Label htmlFor="match-time">Hora de inicio</Label>
            <select
              id="match-time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="">Selecciona una hora</option>
              {timeSlots.map((slot) => (
                <option key={slot} value={slot}>
                  {slot}
                </option>
              ))}
            </select>
            {errors.startTime && (
              <p className="text-xs text-red-500">{errors.startTime}</p>
            )}
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label>Duracion</Label>
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

          {/* Initial players */}
          <div className="space-y-2">
            <Label>¿Con cuantos jugadores vienes?</Label>
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: MAX_PLAYERS - 1 }, (_, i) => i + 1).map((n) => {
                const label =
                  n === 1 ? 'Solo yo' : `Vengo con ${n - 1}`;
                return (
                  <button
                    key={n}
                    type="button"
                    onClick={() => {
                      setInitialPlayers(n);
                      const newGuestCount = n - 1;
                      setGuests((prev) => {
                        if (newGuestCount <= 0) return [];
                        if (newGuestCount <= prev.length) return prev.slice(0, newGuestCount);
                        return [...prev, ...Array.from({ length: newGuestCount - prev.length }, () => ({ userId: null, name: null }))];
                      });
                    }}
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
                Se publicaran {MAX_PLAYERS - initialPlayers} cupo{MAX_PLAYERS - initialPlayers !== 1 ? 's' : ''} disponible{MAX_PLAYERS - initialPlayers !== 1 ? 's' : ''}
              </p>
            )}
          </div>

          {/* Guest selection */}
          {initialPlayers > 1 && (
            <div className="space-y-3">
              <Label>Jugadores que vienen contigo</Label>
              {guests.map((guest, i) => (
                <PlayerSearchInput
                  key={i}
                  index={i}
                  value={guest}
                  onChange={(val) => {
                    setGuests((prev) => {
                      const next = [...prev];
                      next[i] = val;
                      return next;
                    });
                  }}
                />
              ))}
            </div>
          )}

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
              <div className="flex flex-wrap gap-1.5">
                {category && (
                  <span className="inline-block rounded-full bg-blue-800 px-2.5 py-0.5 text-xs font-semibold text-white">
                    {category}
                  </span>
                )}
                {genderMode === 'MALE_ONLY' && (
                  <span className="inline-block rounded-full bg-blue-500 px-2.5 py-0.5 text-xs font-semibold text-white">
                    Solo hombres
                  </span>
                )}
                {genderMode === 'FEMALE_ONLY' && (
                  <span className="inline-block rounded-full bg-pink-500 px-2.5 py-0.5 text-xs font-semibold text-white">
                    Solo mujeres
                  </span>
                )}
                {genderMode === 'MIXED' && (
                  <span className="inline-block rounded-full bg-purple-500 px-2.5 py-0.5 text-xs font-semibold text-white">
                    Mixto ({requiredMales}H + {requiredFemales}M)
                  </span>
                )}
              </div>

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
                {Array.from({ length: MAX_PLAYERS }).map((_, i) => (
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
                  {initialPlayers}/{MAX_PLAYERS}
                  {MAX_PLAYERS - initialPlayers > 0 && (
                    <> · {MAX_PLAYERS - initialPlayers} cupo{MAX_PLAYERS - initialPlayers !== 1 ? 's' : ''}</>
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
