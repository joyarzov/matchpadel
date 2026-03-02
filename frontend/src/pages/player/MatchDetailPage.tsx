import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  DollarSign,
  MessageCircle,
  UserPlus,
  UserMinus,
  Pencil,
  XCircle,
  Loader2,
  ExternalLink,
  FileText,
  AlertTriangle,
  Share2,
  Trophy,
} from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { MatchStatusBadge } from '@/components/matches/MatchStatusBadge';
import { PlayerSlot } from '@/components/matches/PlayerSlot';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { useMatch, useJoinMatch, useLeaveMatch, useCancelMatch, useMatchScores, useReportScore } from '@/hooks/useMatches';
import { useWhatsApp } from '@/hooks/useWhatsApp';
import { getMatchShareWhatsAppUrl } from '@/lib/whatsapp';
import { useToast } from '@/components/ui/use-toast';
import type { PlayerCategory } from '@/types/auth.types';

function getBackendBaseUrl(): string {
  const apiUrl = import.meta.env.VITE_API_URL as string | undefined;
  if (apiUrl) {
    return apiUrl.replace(/\/api\/?$/, '');
  }
  return `${window.location.protocol}//${window.location.hostname}:3000`;
}

const categoryColors: Record<PlayerCategory, string> = {
  PRIMERA: 'bg-red-500 text-white',
  SEGUNDA: 'bg-orange-500 text-white',
  TERCERA: 'bg-amber-500 text-white',
  CUARTA: 'bg-emerald-500 text-white',
  QUINTA: 'bg-blue-500 text-white',
  SEXTA: 'bg-indigo-500 text-white',
  SEPTIMA: 'bg-purple-500 text-white',
};

export default function MatchDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: match, isLoading } = useMatch(id ?? '');
  const { whatsappLink } = useWhatsApp(match);
  const joinMatch = useJoinMatch();
  const leaveMatch = useLeaveMatch();
  const cancelMatch = useCancelMatch();

  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showScoreDialog, setShowScoreDialog] = useState(false);
  const [scoreForm, setScoreForm] = useState({
    set1Team1: 0, set1Team2: 0,
    set2Team1: 0, set2Team2: 0,
    set3Team1: '', set3Team2: '',
  });

  const { data: scores } = useMatchScores(id ?? '');
  const reportScore = useReportScore();

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex flex-1 items-center justify-center bg-slate-50">
          <div className="text-center">
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-blue-800" />
            <p className="mt-3 text-sm text-slate-500">Cargando partido...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!match) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex flex-1 items-center justify-center bg-slate-50">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
              <AlertTriangle className="h-8 w-8 text-slate-400" />
            </div>
            <h2 className="text-xl font-semibold text-slate-800">Partido no encontrado</h2>
            <p className="mt-2 text-sm text-slate-500">
              El partido que buscas no existe o fue eliminado.
            </p>
            <Button
              className="mt-4 bg-blue-800 hover:bg-blue-700"
              onClick={() => navigate('/matches')}
            >
              Volver a partidos
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const isCreator = user?.id === match.creatorId;
  const isJoined = match.players.some((p) => p.userId === user?.id);
  const canJoin = user && !isJoined && !isCreator && match.status === 'OPEN';
  const shareWhatsAppUrl = isCreator ? getMatchShareWhatsAppUrl(match, getBackendBaseUrl()) : null;

  const formattedDate = format(parseISO(match.date), "EEEE d 'de' MMMM, yyyy", { locale: es });
  const capitalizedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

  const googleMapsUrl = match.club.latitude && match.club.longitude
    ? `https://www.google.com/maps?q=${match.club.latitude},${match.club.longitude}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        `${match.club.address}, ${match.club.city}`,
      )}`;

  const handleJoin = async () => {
    try {
      await joinMatch.mutateAsync(match.id);
      toast({ title: 'Te has unido al partido', description: '¡Nos vemos en la cancha!' });
    } catch {
      toast({
        title: 'Error',
        description: 'No se pudo unir al partido.',
        variant: 'destructive',
      });
    }
  };

  const handleLeave = async () => {
    try {
      await leaveMatch.mutateAsync(match.id);
      toast({ title: 'Has salido del partido' });
    } catch {
      toast({
        title: 'Error',
        description: 'No se pudo salir del partido.',
        variant: 'destructive',
      });
    }
  };

  const handleCancel = async () => {
    try {
      await cancelMatch.mutateAsync(match.id);
      setShowCancelDialog(false);
      toast({ title: 'Partido cancelado', description: 'El partido ha sido cancelado.' });
    } catch {
      toast({
        title: 'Error',
        description: 'No se pudo cancelar el partido.',
        variant: 'destructive',
      });
    }
  };

  const isParticipant = isCreator || isJoined;
  const canReportScore =
    user &&
    isParticipant &&
    (match.status === 'COMPLETED' || match.status === 'IN_PROGRESS') &&
    !scores?.some((s) => s.reportedById === user.id);

  const handleReportScore = async () => {
    try {
      await reportScore.mutateAsync({
        matchId: match.id,
        data: {
          set1Team1: scoreForm.set1Team1,
          set1Team2: scoreForm.set1Team2,
          set2Team1: scoreForm.set2Team1,
          set2Team2: scoreForm.set2Team2,
          set3Team1: scoreForm.set3Team1 !== '' ? Number(scoreForm.set3Team1) : null,
          set3Team2: scoreForm.set3Team2 !== '' ? Number(scoreForm.set3Team2) : null,
        },
      });
      setShowScoreDialog(false);
      setScoreForm({ set1Team1: 0, set1Team2: 0, set2Team1: 0, set2Team2: 0, set3Team1: '', set3Team2: '' });
      toast({ title: 'Resultado registrado', description: 'Tu resultado ha sido guardado.' });
    } catch {
      toast({ title: 'Error', description: 'No se pudo registrar el resultado.', variant: 'destructive' });
    }
  };

  // Build player slots: fill with actual players, rest empty
  const playerSlots = Array.from({ length: match.maxPlayers }).map((_, i) => {
    const matchPlayer = match.players[i];
    return matchPlayer?.user ?? null;
  });

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1 bg-slate-50">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Back button */}
          <Button
            variant="ghost"
            className="mb-4 text-slate-600 hover:text-slate-800"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>

          <div className="mb-6 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
            <p className="text-sm text-amber-800">
              <span className="font-semibold">La cancha debe estar reservada previamente.</span>{' '}
              MatchPadel no reserva canchas — coordina directamente con el club.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Mobile-only actions (shown at top on small screens) */}
            <div className="space-y-4 lg:hidden">
              <Card>
                <CardContent className="flex flex-wrap gap-2 p-4">
                  {/* Join button */}
                  {canJoin && (
                    <Button
                      className="flex-1 bg-blue-800 hover:bg-blue-700"
                      onClick={handleJoin}
                      disabled={joinMatch.isPending}
                    >
                      {joinMatch.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <UserPlus className="mr-2 h-4 w-4" />
                      )}
                      Unirme
                    </Button>
                  )}

                  {/* Leave button */}
                  {isJoined && !isCreator && (
                    <Button
                      variant="outline"
                      className="flex-1 border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
                      onClick={handleLeave}
                      disabled={leaveMatch.isPending}
                    >
                      {leaveMatch.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <UserMinus className="mr-2 h-4 w-4" />
                      )}
                      Salir
                    </Button>
                  )}

                  {/* WhatsApp */}
                  {whatsappLink && (
                    <Button
                      asChild
                      className="flex-1 bg-emerald-500 text-white hover:bg-emerald-600"
                    >
                      <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                        <MessageCircle className="mr-2 h-4 w-4" />
                        WhatsApp
                      </a>
                    </Button>
                  )}

                  {/* Share button (creator only) */}
                  {shareWhatsAppUrl && (
                    <Button
                      asChild
                      variant="outline"
                      className="flex-1"
                    >
                      <a href={shareWhatsAppUrl} target="_blank" rel="noopener noreferrer">
                        <Share2 className="mr-2 h-4 w-4" />
                        Compartir
                      </a>
                    </Button>
                  )}

                  {/* Creator actions */}
                  {isCreator && (
                    <>
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => navigate(`/matches/${match.id}/edit`)}
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                      </Button>
                      {(match.status === 'OPEN' || match.status === 'FULL') && (
                        <Button
                          variant="outline"
                          className="flex-1 border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
                          onClick={() => setShowCancelDialog(true)}
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Cancelar
                        </Button>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Main info */}
            <div className="space-y-6 lg:col-span-2">
              {/* Match header card */}
              <Card>
                <CardContent className="p-6">
                  {/* Badges */}
                  <div className="mb-4 flex flex-wrap items-center gap-2">
                    <Badge className={categoryColors[match.category]}>{match.category}</Badge>
                    <MatchStatusBadge status={match.status} />
                    {match.isPrivate && (
                      <Badge variant="outline" className="border-slate-300 text-slate-500">
                        Privado
                      </Badge>
                    )}
                  </div>

                  {/* Club & Court */}
                  <div className="mb-4 flex items-start gap-3">
                    <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" />
                    <div>
                      <p className="text-lg font-semibold text-slate-800">{match.club.name}</p>
                      {match.court && (
                        <p className="text-sm text-slate-500">{match.court.name}</p>
                      )}
                      <a
                        href={googleMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-flex items-center gap-1 text-sm text-blue-700 hover:underline"
                      >
                        {match.club.address}, {match.club.city}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  {/* Date & Time */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-slate-400" />
                      <div>
                        <p className="text-sm font-medium text-slate-800">{capitalizedDate}</p>
                        <p className="text-xs text-slate-500">Fecha del partido</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-slate-400" />
                      <div>
                        <p className="text-sm font-medium text-slate-800">
                          {match.startTime} - {match.endTime}
                        </p>
                        <p className="text-xs text-slate-500">Horario</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Users className="h-5 w-5 text-slate-400" />
                      <div>
                        <p className="text-sm font-medium text-slate-800">
                          {match.currentPlayers}/{match.maxPlayers} jugadores
                        </p>
                        <p className="text-xs text-slate-500">Cupos</p>
                      </div>
                    </div>
                    {match.pricePerPlayer != null && match.pricePerPlayer > 0 && (
                      <div className="flex items-center gap-3">
                        <DollarSign className="h-5 w-5 text-slate-400" />
                        <div>
                          <p className="text-sm font-medium text-slate-800">
                            ${match.pricePerPlayer.toLocaleString('es-CL')} por jugador
                          </p>
                          <p className="text-xs text-slate-500">Precio</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Notes */}
                  {match.description && (
                    <>
                      <Separator className="my-4" />
                      <div className="flex items-start gap-3">
                        <FileText className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" />
                        <div>
                          <p className="mb-1 text-sm font-medium text-slate-800">Notas</p>
                          <p className="text-sm text-slate-600">{match.description}</p>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Player Slots */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Users className="h-5 w-5 text-slate-400" />
                    Jugadores ({match.currentPlayers}/{match.maxPlayers})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {playerSlots.map((player, index) => (
                    <PlayerSlot
                      key={index}
                      player={player}
                      isCreator={player?.id === match.creatorId}
                      canJoin={!!canJoin && !player}
                      onJoin={handleJoin}
                      matchCreatorPhone={match.creator?.phone}
                    />
                  ))}
                </CardContent>
              </Card>

              {/* Match Score Section */}
              {(match.status === 'COMPLETED' || match.status === 'IN_PROGRESS') && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Trophy className="h-5 w-5 text-amber-500" />
                      Resultado
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {scores && scores.length > 0 ? (
                      <div className="space-y-3">
                        {scores.map((score) => (
                          <div
                            key={score.id}
                            className="rounded-lg border bg-slate-50 p-3"
                          >
                            <p className="mb-2 text-xs text-slate-500">
                              Reportado por {score.reportedBy.firstName} {score.reportedBy.lastName}
                            </p>
                            <div className="grid grid-cols-3 gap-2 text-center text-sm">
                              <div className="rounded bg-white p-2 shadow-sm">
                                <p className="text-xs text-slate-400">Set 1</p>
                                <p className="font-bold text-slate-800">{score.set1Team1} - {score.set1Team2}</p>
                              </div>
                              <div className="rounded bg-white p-2 shadow-sm">
                                <p className="text-xs text-slate-400">Set 2</p>
                                <p className="font-bold text-slate-800">{score.set2Team1} - {score.set2Team2}</p>
                              </div>
                              {score.set3Team1 != null && score.set3Team2 != null && (
                                <div className="rounded bg-white p-2 shadow-sm">
                                  <p className="text-xs text-slate-400">Set 3</p>
                                  <p className="font-bold text-slate-800">{score.set3Team1} - {score.set3Team2}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-sm text-slate-500">
                        Aún no se han registrado resultados.
                      </p>
                    )}

                    {canReportScore && (
                      <Button
                        className="w-full bg-amber-500 text-slate-900 hover:bg-amber-400"
                        onClick={() => setShowScoreDialog(true)}
                      >
                        <Trophy className="mr-2 h-4 w-4" />
                        Registrar Resultado
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar actions (desktop only) */}
            <div className="hidden space-y-4 lg:block">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Acciones</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Join button */}
                  {canJoin && (
                    <Button
                      className="w-full bg-blue-800 hover:bg-blue-700"
                      onClick={handleJoin}
                      disabled={joinMatch.isPending}
                    >
                      {joinMatch.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <UserPlus className="mr-2 h-4 w-4" />
                      )}
                      Unirme al Partido
                    </Button>
                  )}

                  {/* Leave button */}
                  {isJoined && !isCreator && (
                    <Button
                      variant="outline"
                      className="w-full border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
                      onClick={handleLeave}
                      disabled={leaveMatch.isPending}
                    >
                      {leaveMatch.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <UserMinus className="mr-2 h-4 w-4" />
                      )}
                      Salir del Partido
                    </Button>
                  )}

                  {/* Creator actions */}
                  {isCreator && (
                    <>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => navigate(`/matches/${match.id}/edit`)}
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar Partido
                      </Button>
                      {(match.status === 'OPEN' || match.status === 'FULL') && (
                        <Button
                          variant="outline"
                          className="w-full border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
                          onClick={() => setShowCancelDialog(true)}
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Cancelar Partido
                        </Button>
                      )}
                    </>
                  )}

                  {/* WhatsApp */}
                  {whatsappLink && (
                    <Button
                      asChild
                      className="w-full bg-emerald-500 text-white hover:bg-emerald-600"
                    >
                      <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                        <MessageCircle className="mr-2 h-4 w-4" />
                        Contactar por WhatsApp
                      </a>
                    </Button>
                  )}

                  {/* Share button (creator only) */}
                  {shareWhatsAppUrl && (
                    <Button
                      asChild
                      variant="outline"
                      className="w-full"
                    >
                      <a href={shareWhatsAppUrl} target="_blank" rel="noopener noreferrer">
                        <Share2 className="mr-2 h-4 w-4" />
                        Compartir en WhatsApp
                      </a>
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Creator info */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Organizador</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-800">
                      {match.creator.firstName.charAt(0)}
                      {match.creator.lastName.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        {match.creator.firstName} {match.creator.lastName}
                      </p>
                      {match.creator.category && (
                        <p className="text-xs text-slate-500">{match.creator.category}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* Cancel Confirmation Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar Partido</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas cancelar este partido? Esta acción no se puede deshacer
              y se notificará a todos los jugadores inscritos.
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
              Sí, cancelar partido
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Score Report Dialog */}
      <Dialog open={showScoreDialog} onOpenChange={setShowScoreDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar Resultado</DialogTitle>
            <DialogDescription>
              Ingresa el resultado del partido por sets. El set 3 es opcional.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Set 1 */}
            <div>
              <Label className="text-sm font-medium">Set 1</Label>
              <div className="mt-1 flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  max={7}
                  value={scoreForm.set1Team1}
                  onChange={(e) => setScoreForm((f) => ({ ...f, set1Team1: Number(e.target.value) }))}
                  className="w-20 text-center"
                />
                <span className="text-slate-400">—</span>
                <Input
                  type="number"
                  min={0}
                  max={7}
                  value={scoreForm.set1Team2}
                  onChange={(e) => setScoreForm((f) => ({ ...f, set1Team2: Number(e.target.value) }))}
                  className="w-20 text-center"
                />
              </div>
            </div>
            {/* Set 2 */}
            <div>
              <Label className="text-sm font-medium">Set 2</Label>
              <div className="mt-1 flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  max={7}
                  value={scoreForm.set2Team1}
                  onChange={(e) => setScoreForm((f) => ({ ...f, set2Team1: Number(e.target.value) }))}
                  className="w-20 text-center"
                />
                <span className="text-slate-400">—</span>
                <Input
                  type="number"
                  min={0}
                  max={7}
                  value={scoreForm.set2Team2}
                  onChange={(e) => setScoreForm((f) => ({ ...f, set2Team2: Number(e.target.value) }))}
                  className="w-20 text-center"
                />
              </div>
            </div>
            {/* Set 3 (optional) */}
            <div>
              <Label className="text-sm font-medium">Set 3 (opcional)</Label>
              <div className="mt-1 flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  max={7}
                  value={scoreForm.set3Team1}
                  onChange={(e) => setScoreForm((f) => ({ ...f, set3Team1: e.target.value }))}
                  className="w-20 text-center"
                  placeholder="—"
                />
                <span className="text-slate-400">—</span>
                <Input
                  type="number"
                  min={0}
                  max={7}
                  value={scoreForm.set3Team2}
                  onChange={(e) => setScoreForm((f) => ({ ...f, set3Team2: e.target.value }))}
                  className="w-20 text-center"
                  placeholder="—"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowScoreDialog(false)}>
              Cancelar
            </Button>
            <Button
              className="bg-amber-500 text-slate-900 hover:bg-amber-400"
              onClick={handleReportScore}
              disabled={reportScore.isPending}
            >
              {reportScore.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trophy className="mr-2 h-4 w-4" />
              )}
              Guardar Resultado
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
