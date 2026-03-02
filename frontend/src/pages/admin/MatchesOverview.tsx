import { useState, useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  XCircle,
  CheckCircle,
  Clock,
  Users,
  AlertCircle,
} from 'lucide-react';
import { PadelIcon } from '@/components/icons/PadelIcon';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MatchStatusBadge } from '@/components/matches/MatchStatusBadge';
import { CategoryFilter } from '@/components/matches/CategoryFilter';
import { useMatches, useCancelMatch } from '@/hooks/useMatches';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { MatchFilters, MatchStatus, Match } from '@/types/match.types';
import type { PlayerCategory } from '@/types/auth.types';

const statusOptions: { value: MatchStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'Todos' },
  { value: 'OPEN', label: 'Abierto' },
  { value: 'FULL', label: 'Completo' },
  { value: 'IN_PROGRESS', label: 'En juego' },
  { value: 'COMPLETED', label: 'Finalizado' },
  { value: 'CANCELLED', label: 'Cancelado' },
];

export default function MatchesOverview() {
  const { toast } = useToast();
  const cancelMatch = useCancelMatch();

  const [statusFilter, setStatusFilter] = useState<MatchStatus | 'ALL'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<PlayerCategory | 'ALL'>('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);

  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancellingMatch, setCancellingMatch] = useState<Match | null>(null);

  const filters: MatchFilters = {
    page,
    limit: 15,
    ...(statusFilter !== 'ALL' && { status: statusFilter }),
    ...(categoryFilter !== 'ALL' && { category: categoryFilter }),
    ...(dateFrom && { dateFrom }),
    ...(dateTo && { dateTo }),
  };

  const { data, isLoading } = useMatches(filters);
  const matches = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;
  const currentPage = data?.page ?? page;

  // Stats summary counts
  const { data: allData } = useMatches({ limit: 1000 });
  const allMatches = allData?.data ?? [];
  const stats = useMemo(() => {
    return {
      total: allMatches.length,
      open: allMatches.filter((m) => m.status === 'OPEN').length,
      full: allMatches.filter((m) => m.status === 'FULL').length,
      completed: allMatches.filter((m) => m.status === 'COMPLETED').length,
      cancelled: allMatches.filter((m) => m.status === 'CANCELLED').length,
    };
  }, [allMatches]);

  const handleCancel = async () => {
    if (!cancellingMatch) return;
    try {
      await cancelMatch.mutateAsync(cancellingMatch.id);
      toast({ title: 'Partido cancelado', description: `El partido ha sido cancelado.` });
      setShowCancelDialog(false);
      setCancellingMatch(null);
    } catch {
      toast({ title: 'Error', description: 'No se pudo cancelar el partido.', variant: 'destructive' });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-800" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Partidos</h1>
        <p className="mt-1 text-sm text-slate-500">Vista general de todos los partidos.</p>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <PadelIcon className="h-5 w-5 text-blue-800" />
            <div>
              <p className="text-lg font-bold text-slate-800">{stats.total}</p>
              <p className="text-xs text-slate-500">Total</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <CheckCircle className="h-5 w-5 text-emerald-600" />
            <div>
              <p className="text-lg font-bold text-slate-800">{stats.open}</p>
              <p className="text-xs text-slate-500">Abiertos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Users className="h-5 w-5 text-red-600" />
            <div>
              <p className="text-lg font-bold text-slate-800">{stats.full}</p>
              <p className="text-xs text-slate-500">Completos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Clock className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-lg font-bold text-slate-800">{stats.completed}</p>
              <p className="text-xs text-slate-500">Finalizados</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <AlertCircle className="h-5 w-5 text-slate-400" />
            <div>
              <p className="text-lg font-bold text-slate-800">{stats.cancelled}</p>
              <p className="text-xs text-slate-500">Cancelados</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="space-y-4 rounded-lg bg-white p-4 shadow-sm">
        <CategoryFilter selected={categoryFilter} onChange={(v) => { setCategoryFilter(v); setPage(1); }} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div className="space-y-1">
            <Label className="text-xs text-slate-500">Estado</Label>
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v as MatchStatus | 'ALL');
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-slate-500">Desde</Label>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-slate-500">Hasta</Label>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
            />
          </div>
          <div className="flex items-end">
            <Button
              variant="ghost"
              className="text-slate-500"
              onClick={() => {
                setStatusFilter('ALL');
                setCategoryFilter('ALL');
                setDateFrom('');
                setDateTo('');
                setPage(1);
              }}
            >
              <XCircle className="mr-2 h-4 w-4" />
              Limpiar
            </Button>
          </div>
        </div>
      </div>

      {/* Matches Table */}
      {matches.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12 text-center">
            <PadelIcon className="mb-4 h-12 w-12 text-slate-300" />
            <h3 className="text-lg font-medium text-slate-800">No hay partidos</h3>
            <p className="mt-1 text-sm text-slate-500">No se encontraron partidos con los filtros seleccionados.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs font-medium uppercase text-slate-500">
                <th className="px-3 py-3">Fecha</th>
                <th className="px-3 py-3">Hora</th>
                <th className="px-3 py-3">Club</th>
                <th className="px-3 py-3">Categoría</th>
                <th className="px-3 py-3">Estado</th>
                <th className="px-3 py-3">Jugadores</th>
                <th className="px-3 py-3">Creador</th>
                <th className="px-3 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {matches.map((match) => (
                <tr key={match.id} className="border-b last:border-0 hover:bg-slate-50">
                  <td className="whitespace-nowrap px-3 py-3 text-slate-700">
                    {format(parseISO(match.date), 'dd/MM/yyyy', { locale: es })}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-slate-700">
                    {match.startTime} - {match.endTime}
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
                  <td className="px-3 py-3">
                    {(match.status === 'OPEN' || match.status === 'FULL') && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => {
                          setCancellingMatch(match);
                          setShowCancelDialog(true);
                        }}
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
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

      {/* Cancel Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar Partido</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas cancelar este partido? Se notificará a todos los jugadores inscritos.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
              No, volver
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={cancelMatch.isPending}
            >
              {cancelMatch.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <XCircle className="mr-2 h-4 w-4" />
              )}
              Sí, cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
