import { MapPin, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { CenterAvailability } from '@/types/availability.types';

interface AvailabilityGridProps {
  center: CenterAvailability;
}

function SourceBadge({ source, connected }: { source: string; connected: boolean }) {
  const label = source === 'matchpoint' ? 'MatchPoint' : 'EasyCancha';
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
      <span
        className={`inline-block h-2 w-2 rounded-full ${
          connected ? 'bg-emerald-500' : 'bg-red-500'
        }`}
      />
      {label}
    </span>
  );
}

export function AvailabilityGrid({ center }: AvailabilityGridProps) {
  if (center.error) {
    return (
      <Card className="border-red-200">
        <CardContent className="p-5">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-800">{center.clubName}</h3>
            <SourceBadge source={center.source} connected={false} />
          </div>
          <div className="flex items-center gap-2 text-sm text-red-600">
            <AlertCircle className="h-4 w-4" />
            <span>No se pudo obtener la disponibilidad de este centro</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-5">
        <div className="mb-1 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-800">{center.clubName}</h3>
          <SourceBadge source={center.source} connected={center.connected} />
        </div>
        <div className="mb-4 flex items-center gap-1 text-sm text-slate-500">
          <MapPin className="h-3.5 w-3.5" />
          <span>{center.clubAddress}</span>
        </div>

        <div className="space-y-3">
          {center.courts.map((court) => (
            <div key={court.courtId}>
              <p className="mb-1.5 text-sm font-semibold text-slate-700">{court.courtName}</p>
              <div className="flex flex-wrap gap-1">
                {court.slots.map((slot) => {
                  const isFree = slot.status === 'free';
                  return (
                    <span
                      key={slot.startTime}
                      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${
                        isFree
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      {slot.startTime}
                    </span>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-3 border-t pt-3 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <span className="inline-block h-2.5 w-2.5 rounded-sm bg-emerald-100" /> Libre
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2.5 w-2.5 rounded-sm bg-slate-200" /> Ocupado
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
