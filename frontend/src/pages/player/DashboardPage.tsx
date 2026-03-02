import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { format, parseISO, isAfter } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  PlusCircle,
  Search,
  Calendar,
  Clock,
  MapPin,
  Loader2,
  ArrowRight,
  Trophy,
} from 'lucide-react';
import { PadelIcon } from '@/components/icons/PadelIcon';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { MatchCard } from '@/components/matches/MatchCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useMyMatches, useMatches, useJoinMatch, useLeaveMatch } from '@/hooks/useMatches';
import { useUserStats } from '@/hooks/useStats';
import { useToast } from '@/components/ui/use-toast';

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: myMatchesData, isLoading: myMatchesLoading } = useMyMatches();
  const { data: openMatchesData, isLoading: openMatchesLoading } = useMatches({
    status: 'OPEN',
    category: user?.category ?? undefined,
    limit: 6,
  });
  const { data: stats, isLoading: statsLoading } = useUserStats();
  const joinMatch = useJoinMatch();
  const leaveMatch = useLeaveMatch();

  const allMyMatches = useMemo(() => {
    if (!myMatchesData) return [];
    const matches = Array.isArray(myMatchesData) ? myMatchesData : (myMatchesData as { matches?: unknown[] }).matches ?? [];
    return matches as import('@/types/match.types').Match[];
  }, [myMatchesData]);

  const upcomingMatches = useMemo(() => {
    return allMyMatches
      .filter((m) => isAfter(parseISO(m.date), new Date()) && m.status !== 'CANCELLED')
      .sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());
  }, [allMyMatches]);

  const recentMatches = useMemo(() => {
    return allMyMatches
      .filter((m) => m.status === 'COMPLETED')
      .sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime())
      .slice(0, 5);
  }, [allMyMatches]);

  const openMatches = useMemo(() => {
    if (!openMatchesData) return [];
    if (Array.isArray(openMatchesData)) return openMatchesData;
    return openMatchesData.data ?? [];
  }, [openMatchesData]);

  const nextMatch = upcomingMatches.length > 0 ? upcomingMatches[0] : null;

  const handleJoin = async (matchId: string) => {
    try {
      await joinMatch.mutateAsync(matchId);
      toast({ title: 'Te has unido al partido', description: 'Revisa los detalles del partido.' });
    } catch {
      toast({ title: 'Error', description: 'No se pudo unir al partido.', variant: 'destructive' });
    }
  };

  const handleLeave = async (matchId: string) => {
    try {
      await leaveMatch.mutateAsync(matchId);
      toast({ title: 'Has salido del partido', description: 'Ya no estás inscrito en este partido.' });
    } catch {
      toast({ title: 'Error', description: 'No se pudo salir del partido.', variant: 'destructive' });
    }
  };

  const isLoading = myMatchesLoading || openMatchesLoading;

  const memberSince = stats?.memberSince
    ? format(parseISO(stats.memberSince), "MMMM yyyy", { locale: es })
    : user?.createdAt
    ? format(parseISO(user.createdAt), "MMMM yyyy", { locale: es })
    : '—';

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Welcome Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-800 sm:text-3xl">
              ¡Hola, {user?.firstName}!
            </h1>
            <p className="mt-1 text-slate-500">
              Bienvenido de vuelta a MatchPadel. Aquí tienes un resumen de tu actividad.
            </p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-blue-800" />
            </div>
          ) : (
            <>
              {/* Stats Cards */}
              <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
                <Card>
                  <CardContent className="flex items-center gap-4 p-5">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100">
                      <PadelIcon className="h-6 w-6 text-blue-800" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-slate-800">
                        {stats?.matchesPlayed ?? 0}
                      </p>
                      <p className="text-sm text-slate-500">Partidos jugados</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="flex items-center gap-4 p-5">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                      <PlusCircle className="h-6 w-6 text-emerald-700" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-slate-800">
                        {stats?.matchesCreated ?? 0}
                      </p>
                      <p className="text-sm text-slate-500">Partidos creados</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="flex items-center gap-4 p-5">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-100">
                      <MapPin className="h-6 w-6 text-amber-700" />
                    </div>
                    <div>
                      <p className="truncate text-sm font-semibold text-slate-800">
                        {stats?.favoriteClub?.name ?? 'Sin datos'}
                      </p>
                      <p className="text-sm text-slate-500">Club favorito</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="flex items-center gap-4 p-5">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-purple-100">
                      <Calendar className="h-6 w-6 text-purple-700" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold capitalize text-slate-800">
                        {memberSince}
                      </p>
                      <p className="text-sm text-slate-500">Miembro desde</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Next Match Highlight */}
              {nextMatch && (
                <Card className="mb-8 border-blue-200 bg-blue-50">
                  <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-blue-800">
                        <Clock className="h-7 w-7 text-amber-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-blue-600">Próximo partido</p>
                        <p className="text-lg font-bold text-slate-800">
                          {format(parseISO(nextMatch.date), "EEEE d 'de' MMMM", { locale: es })} — {nextMatch.startTime}
                        </p>
                        <p className="text-sm text-slate-600">
                          {nextMatch.club.name} · {nextMatch.currentPlayers}/{nextMatch.maxPlayers} jugadores
                        </p>
                      </div>
                    </div>
                    <Button
                      className="bg-blue-800 hover:bg-blue-700"
                      onClick={() => navigate(`/matches/${nextMatch.id}`)}
                    >
                      Ver detalles
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Quick Actions */}
              <div className="mb-8 flex flex-col gap-3 sm:flex-row">
                <Button
                  size="lg"
                  className="bg-blue-800 text-base font-semibold hover:bg-blue-700"
                  onClick={() => navigate('/matches/create')}
                >
                  <PlusCircle className="mr-2 h-5 w-5" />
                  Crear Partido
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="text-base"
                  onClick={() => navigate('/matches')}
                >
                  <Search className="mr-2 h-5 w-5" />
                  Buscar Partidos
                </Button>
              </div>

              {/* Recent Matches */}
              {recentMatches.length > 0 && (
                <section className="mb-10">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-slate-800">Últimos Partidos</h2>
                    <Link
                      to="/my-matches"
                      className="flex items-center gap-1 text-sm font-medium text-blue-800 hover:underline"
                    >
                      Ver todos <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                  <Card>
                    <CardContent className="divide-y p-0">
                      {recentMatches.map((match) => (
                        <Link
                          key={match.id}
                          to={`/matches/${match.id}`}
                          className="flex items-center gap-4 px-5 py-3 transition-colors hover:bg-slate-50"
                        >
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100">
                            <PadelIcon className="h-5 w-5 text-slate-500" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-slate-800">
                              {match.club.name}
                            </p>
                            <p className="text-xs text-slate-500">
                              {format(parseISO(match.date), "d MMM yyyy", { locale: es })} · {match.startTime}
                            </p>
                          </div>
                          <span className="text-xs font-medium text-slate-400">
                            {match.currentPlayers}/{match.maxPlayers}
                          </span>
                        </Link>
                      ))}
                    </CardContent>
                  </Card>
                </section>
              )}

              {/* Upcoming Matches */}
              <section className="mb-10">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xl font-bold text-slate-800">Próximos Partidos</h2>
                  {upcomingMatches.length > 0 && (
                    <Link
                      to="/my-matches"
                      className="flex items-center gap-1 text-sm font-medium text-blue-800 hover:underline"
                    >
                      Ver todos <ArrowRight className="h-4 w-4" />
                    </Link>
                  )}
                </div>
                {upcomingMatches.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {upcomingMatches.slice(0, 3).map((match) => (
                      <MatchCard
                        key={match.id}
                        match={match}
                        currentUserId={user?.id}
                        onLeave={handleLeave}
                      />
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="flex flex-col items-center py-12 text-center">
                      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                        <Calendar className="h-8 w-8 text-slate-400" />
                      </div>
                      <h3 className="text-lg font-medium text-slate-800">
                        No tienes partidos próximos
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        Crea un partido o únete a uno existente para empezar a jugar.
                      </p>
                      <Button
                        className="mt-4 bg-blue-800 hover:bg-blue-700"
                        onClick={() => navigate('/matches')}
                      >
                        Explorar partidos
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </section>

              {/* Open Matches in Category */}
              <section>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xl font-bold text-slate-800">
                    Partidos abiertos{user?.category ? ` en tu categoría` : ''}
                  </h2>
                  <Link
                    to="/matches"
                    className="flex items-center gap-1 text-sm font-medium text-blue-800 hover:underline"
                  >
                    Ver todos <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
                {openMatches.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {openMatches.slice(0, 6).map((match) => (
                      <MatchCard
                        key={match.id}
                        match={match}
                        currentUserId={user?.id}
                        onJoin={handleJoin}
                        onLeave={handleLeave}
                      />
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="flex flex-col items-center py-12 text-center">
                      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                        <Trophy className="h-8 w-8 text-slate-400" />
                      </div>
                      <h3 className="text-lg font-medium text-slate-800">
                        No hay partidos abiertos en tu categoría
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        ¡Sé el primero en crear un partido!
                      </p>
                      <Button
                        className="mt-4 bg-blue-800 hover:bg-blue-700"
                        onClick={() => navigate('/matches/create')}
                      >
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Crear Partido
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </section>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
