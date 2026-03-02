import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Users,
  Building2,
  Loader2,
  PlusCircle,
  Eye,
  LayoutGrid,
} from 'lucide-react';
import { PadelIcon } from '@/components/icons/PadelIcon';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MatchStatusBadge } from '@/components/matches/MatchStatusBadge';
import { useClubs } from '@/hooks/useClubs';
import { useMatches } from '@/hooks/useMatches';
import { userService } from '@/services/userService';
import { useQuery } from '@tanstack/react-query';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { data: clubs, isLoading: clubsLoading } = useClubs();
  const { data: matchesData, isLoading: matchesLoading } = useMatches({ limit: 10 });
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => userService.getUsers(),
  });

  const isLoading = clubsLoading || matchesLoading || usersLoading;

  const totalUsers = users?.length ?? 0;
  const totalClubs = clubs?.length ?? 0;
  const totalCourts = useMemo(
    () => clubs?.reduce((sum, club) => sum + club.courts.length, 0) ?? 0,
    [clubs],
  );
  const matches = matchesData?.data ?? [];
  const activeMatches = matches.filter(
    (m) => m.status === 'OPEN' || m.status === 'FULL' || m.status === 'IN_PROGRESS',
  ).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-800" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Panel de Administración</h1>
        <p className="mt-1 text-slate-500">Resumen general de la plataforma.</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <Users className="h-6 w-6 text-blue-800" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{totalUsers}</p>
              <p className="text-sm text-slate-500">Total Usuarios</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
              <Building2 className="h-6 w-6 text-emerald-700" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{totalClubs}</p>
              <p className="text-sm text-slate-500">Total Clubes</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
              <LayoutGrid className="h-6 w-6 text-amber-700" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{totalCourts}</p>
              <p className="text-sm text-slate-500">Total Canchas</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
              <PadelIcon className="h-6 w-6 text-purple-700" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{activeMatches}</p>
              <p className="text-sm text-slate-500">Partidos Activos</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Button
          className="bg-blue-800 hover:bg-blue-700"
          onClick={() => navigate('/admin/clubs')}
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Agregar Club
        </Button>
        <Button variant="outline" onClick={() => navigate('/admin/users')}>
          <Eye className="mr-2 h-4 w-4" />
          Ver Usuarios
        </Button>
      </div>

      {/* Recent Matches Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Últimos Partidos</CardTitle>
        </CardHeader>
        <CardContent>
          {matches.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500">No hay partidos registrados.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b text-left text-xs font-medium uppercase text-slate-500">
                    <th className="px-3 py-3">Fecha</th>
                    <th className="px-3 py-3">Hora</th>
                    <th className="px-3 py-3">Club</th>
                    <th className="px-3 py-3">Categoría</th>
                    <th className="px-3 py-3">Estado</th>
                    <th className="px-3 py-3">Jugadores</th>
                    <th className="px-3 py-3">Creador</th>
                  </tr>
                </thead>
                <tbody>
                  {matches.map((match) => (
                    <tr key={match.id} className="border-b last:border-0 hover:bg-slate-50">
                      <td className="whitespace-nowrap px-3 py-3 text-slate-700">
                        {format(parseISO(match.date), 'dd/MM/yyyy', { locale: es })}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-slate-700">
                        {match.startTime}
                      </td>
                      <td className="px-3 py-3 text-slate-700">{match.club.name}</td>
                      <td className="px-3 py-3">
                        <Badge variant="outline" className="text-xs">
                          {match.category}
                        </Badge>
                      </td>
                      <td className="px-3 py-3">
                        <MatchStatusBadge status={match.status} />
                      </td>
                      <td className="px-3 py-3 text-slate-700">
                        {match.currentPlayers}/{match.maxPlayers}
                      </td>
                      <td className="px-3 py-3 text-slate-700">
                        {match.creator.firstName} {match.creator.lastName}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
