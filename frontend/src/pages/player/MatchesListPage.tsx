import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, XCircle, PlusCircle, ChevronLeft, ChevronRight, Info } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { MatchList } from '@/components/matches/MatchList';
import { CategoryFilter } from '@/components/matches/CategoryFilter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { useMatches, useJoinMatch, useLeaveMatch } from '@/hooks/useMatches';
import { useClubs } from '@/hooks/useClubs';
import { useToast } from '@/components/ui/use-toast';
import type { PlayerCategory } from '@/types/auth.types';
import type { MatchFilters } from '@/types/match.types';

export default function MatchesListPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: clubs } = useClubs();

  const [category, setCategory] = useState<PlayerCategory | 'ALL'>('ALL');
  const [clubId, setClubId] = useState<string>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);

  const filters: MatchFilters = {
    page,
    limit: 12,
    ...(category !== 'ALL' && { category }),
    ...(clubId && { clubId }),
    ...(dateFrom && { dateFrom }),
    ...(dateTo && { dateTo }),
  };

  const { data, isLoading } = useMatches(filters);
  const joinMatch = useJoinMatch();
  const leaveMatch = useLeaveMatch();

  const matches = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;
  const currentPage = data?.page ?? page;

  const handleCategoryChange = useCallback((cat: PlayerCategory | 'ALL') => {
    setCategory(cat);
    setPage(1);
  }, []);

  const handleClubChange = useCallback((value: string) => {
    setClubId(value === 'ALL' ? '' : value);
    setPage(1);
  }, []);

  const handleClearFilters = useCallback(() => {
    setCategory('ALL');
    setClubId('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  }, []);

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
      toast({ title: 'Has salido del partido' });
    } catch {
      toast({ title: 'Error', description: 'No se pudo salir del partido.', variant: 'destructive' });
    }
  };

  const hasActiveFilters = category !== 'ALL' || clubId || dateFrom || dateTo;

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 sm:text-3xl">
                Partidos Disponibles
              </h1>
              <p className="mt-1 text-slate-500">
                Encuentra un partido y únete a jugar.
              </p>
            </div>
            <Button
              className="bg-blue-800 hover:bg-blue-700"
              onClick={() => navigate('/matches/create')}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Crear Partido
            </Button>
          </div>

          {/* Disclaimer */}
          <div className="mb-4 flex items-center gap-2 rounded-md bg-blue-50 px-4 py-2.5 text-sm text-blue-800">
            <Info className="h-4 w-4 flex-shrink-0" />
            <p>MatchPadel no reserva canchas. Coordina la reserva directamente con el club antes de publicar o unirte a un partido.</p>
          </div>

          {/* Filter Bar */}
          <div className="mb-6 space-y-4 rounded-lg bg-white p-4 shadow-sm">
            {/* Category pills */}
            <div>
              <CategoryFilter selected={category} onChange={handleCategoryChange} />
            </div>

            {/* Other filters */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Club filter */}
              <div className="space-y-1">
                <Label className="text-xs text-slate-500">Club</Label>
                <Select value={clubId || 'ALL'} onValueChange={handleClubChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los clubes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todos los clubes</SelectItem>
                    {clubs?.map((club) => (
                      <SelectItem key={club.id} value={club.id}>
                        {club.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date from */}
              <div className="space-y-1">
                <Label className="text-xs text-slate-500">Desde</Label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => {
                    setDateFrom(e.target.value);
                    setPage(1);
                  }}
                />
              </div>

              {/* Date to */}
              <div className="space-y-1">
                <Label className="text-xs text-slate-500">Hasta</Label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => {
                    setDateTo(e.target.value);
                    setPage(1);
                  }}
                />
              </div>

              {/* Clear */}
              <div className="flex items-end">
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    className="text-slate-500 hover:text-slate-700"
                    onClick={handleClearFilters}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Limpiar filtros
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Match List */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-blue-800" />
              <p className="mt-3 text-sm text-slate-500">Cargando partidos...</p>
            </div>
          ) : (
            <>
              <MatchList
                matches={matches}
                currentUserId={user?.id}
                onJoin={handleJoin}
                onLeave={handleLeave}
                onEdit={(matchId) => navigate(`/matches/${matchId}`)}
              />

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-4">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="mr-1 h-4 w-4" />
                    Anterior
                  </Button>
                  <span className="text-sm text-slate-600">
                    Página {currentPage} de {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Siguiente
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
