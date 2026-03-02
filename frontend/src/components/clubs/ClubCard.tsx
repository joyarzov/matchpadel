import { MapPin, Phone, Building2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Club } from '@/types/club.types';

interface ClubCardProps {
  club: Club;
  onClick?: () => void;
}

export function ClubCard({ club, onClick }: ClubCardProps) {
  return (
    <Card
      className={`overflow-hidden transition-shadow hover:shadow-lg ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      {/* Image placeholder */}
      <div className="flex h-36 items-center justify-center bg-gradient-to-br from-blue-800 to-blue-600">
        <Building2 className="h-12 w-12 text-blue-200" />
      </div>

      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between">
          <h3 className="text-base font-semibold text-slate-800">{club.name}</h3>
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
            {club.courts.length} {club.courts.length === 1 ? 'cancha' : 'canchas'}
          </Badge>
        </div>

        <div className="flex items-start gap-2">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
          <p className="text-sm text-slate-500">
            {club.address}, {club.city}
          </p>
        </div>

        {club.phone && (
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 shrink-0 text-slate-400" />
            <p className="text-sm text-slate-500">{club.phone}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
