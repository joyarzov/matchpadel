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
  CheckCircle2,
  X,
  Trash2,
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
import {
  useMatch,
  useJoinMatch,
  useLeaveMatch,
  useCancelMatch,
  useMatchScore,
  useProposeScore,
  useApproveScore,
  useRejectScore,
  useDeleteProposal,
} from '@/hooks/useMatches';
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
  const [showJoinConfirmation, setShowJoinConfirmation] = useState(false);
  const [showScoreDialog, setShowScoreDialog] = useState(false);
  const [scoreForm, setScoreForm] = useState({
    set1Team1: 0, set1Team2: 0,
    set2Team1: 0, set2Team2: 0,
    set3Team1: '', set3Team2: '',
  });
  const [team1Ids, setTeam1Ids] = useState<string[]>([]);
  const [team2Ids, setTeam2Ids] = useState<string[]>([]);

  const { data: score } = useMatchScore(id ?? '');
  const proposeScore = useProposeScore();
  const approveScore = useApproveScore();
  const rejectScore = useRejectScore();
  const deleteProposal = useDeleteProposal();

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

  // Gender restriction check
  const genderBlocked = (() => {
    if (!user || !match.genderMode || match.genderMode === 'ANY') return null;
    if (match.genderMode === 'MALE_ONLY' && user.gender !== 'MALE') return 'Este partido es solo para hombres';
    if (match.genderMode === 'FEMALE_ONLY' && user.gender !== 'FEMALE') return 'Este partido es solo para mujeres';
    if (match.genderMode === 'MIXED') {
      const currentMales = match.players.filter((p) => p.user?.gender === 'MALE').length;
      const currentFemales = match.players.filter((p) => p.user?.gender === 'FEMALE').length;
      if (user.gender === 'MALE' && match.requiredMales != null && currentMales >= match.requiredMales) {
        return 'Ya se completaron los cupos para hombres';
      }
      if (user.gender === 'FEMALE' && match.requiredFemales != null && currentFemales >= match.requiredFemales) {
        return 'Ya se completaron los cupos para mujeres';
      }
    }
    return null;
  })();

  const canJoin = user && !isJoined && !isCreator && match.status === 'OPEN' && !genderBlocked;
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
      setShowJoinConfirmation(true);
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

  const handleProposeScore = async () => {
    try {
      await proposeScore.mutateAsync({
        matchId: match.id,
        data: {
          set1Team1: scoreForm.set1Team1,
          set1Team2: scoreForm.set1Team2,
          set2Team1: scoreForm.set2Team1,
          set2Team2: scoreForm.set2Team2,
          set3Team1: scoreForm.set3Team1 !== '' ? Number(scoreForm.set3Team1) : null,
          set3Team2: scoreForm.set3Team2 !== '' ? Number(scoreForm.set3Team2) : null,
          team1PlayerIds: team1Ids,
          team2PlayerIds: team2Ids,
        },
      });
      setShowScoreDialog(false);
      setScoreForm({ set1Team1: 0, set1Team2: 0, set2Team1: 0, set2Team2: 0, set3Team1: '', set3Team2: '' });
      setTeam1Ids([]);
      setTeam2Ids([]);
      toast({ title: 'Resultado propuesto', description: 'Los demás jugadores deben aprobar el resultado.' });
    } catch {
      toast({ title: 'Error', description: 'No se pudo proponer el resultado.', variant: 'destructive' });
    }
  };

  const handleApprove = async () => {
    try {
      await approveScore.mutateAsync(match.id);
      toast({ title: 'Resultado aprobado', description: 'Has aprobado el resultado propuesto.' });
    } catch {
      toast({ title: 'Error', description: 'No se pudo aprobar el resultado.', variant: 'destructive' });
    }
  };

  const handleReject = async () => {
    try {
      await rejectScore.mutateAsync(match.id);
      toast({ title: 'Resultado rechazado', description: 'El resultado ha sido rechazado.' });
    } catch {
      toast({ title: 'Error', description: 'No se pudo rechazar el resultado.', variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteProposal.mutateAsync(match.id);
      toast({ title: 'Propuesta eliminada' });
    } catch {
      toast({ title: 'Error', description: 'No se pudo eliminar la propuesta.', variant: 'destructive' });
    }
  };

  // Can creator propose? Only if no PENDING/CONFIRMED score exists
  const canPropose =
    user &&
    isCreator &&
    (match.status === 'COMPLETED' || match.status === 'IN_PROGRESS') &&
    (!score || score.status === 'REJECTED');

  // Can this user approve/reject? They must be a non-creator participant with a PENDING approval
  const userApproval = score?.approvals?.find((a) => a.userId === user?.id);
  const canApproveOrReject =
    user &&
    isParticipant &&
    !isCreator &&
    score?.status === 'PENDING' &&
    userApproval?.status === 'PENDING';

  // Can creator delete?
  const canDelete =
    user &&
    isCreator &&
    score &&
    (score.status === 'PENDING' || score.status === 'REJECTED');

  // Build player slots: fill with actual players, rest empty
  const playerSlots = Array.from({ length: match.maxPlayers }).map((_, i) => {
    return match.players[i] ?? null;
  });

  // Approval progress
  const totalApprovals = score?.approvals?.length ?? 0;
  const approvedCount = score?.approvals?.filter((a) => a.status === 'APPROVED').length ?? 0;

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
                  {/* Gender restriction message */}
                  {genderBlocked && !isJoined && !isCreator && match.status === 'OPEN' && (
                    <p className="w-full text-center text-sm text-red-500">{genderBlocked}</p>
                  )}

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
                    {match.genderMode === 'MALE_ONLY' && (
                      <Badge className="bg-blue-500 text-white">Solo hombres</Badge>
                    )}
                    {match.genderMode === 'FEMALE_ONLY' && (
                      <Badge className="bg-pink-500 text-white">Solo mujeres</Badge>
                    )}
                    {match.genderMode === 'MIXED' && (
                      <Badge className="bg-purple-500 text-white">
                        Mixto ({match.requiredMales}H + {match.requiredFemales}M)
                      </Badge>
                    )}
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
                    {match.genderMode === 'MIXED' && match.requiredMales != null && match.requiredFemales != null && (
                      <div className="flex items-center gap-3">
                        <Users className="h-5 w-5 text-purple-400" />
                        <div>
                          <p className="text-sm font-medium text-slate-800">
                            {match.players.filter((p) => p.user?.gender === 'MALE').length}/{match.requiredMales} hombres
                            {' · '}
                            {match.players.filter((p) => p.user?.gender === 'FEMALE').length}/{match.requiredFemales} mujeres
                          </p>
                          <p className="text-xs text-slate-500">Cupos por genero</p>
                        </div>
                      </div>
                    )}
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
                  {playerSlots.map((mp, index) => (
                    <PlayerSlot
                      key={index}
                      matchPlayer={mp}
                      isCreator={mp?.userId === match.creatorId}
                      canJoin={!!canJoin && !mp}
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
                    {/* CONFIRMED score */}
                    {score?.status === 'CONFIRMED' && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-emerald-500 text-white">Confirmado</Badge>
                          <span className="text-sm font-medium text-slate-600">
                            Equipo {score.winnerTeam} ganador
                          </span>
                        </div>
                        <ScoreDisplay score={score} />
                      </div>
                    )}

                    {/* PENDING score */}
                    {score?.status === 'PENDING' && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-amber-500 text-white">Pendiente de aprobacion</Badge>
                          <span className="text-xs text-slate-500">
                            {approvedCount}/{totalApprovals} aprobaciones
                          </span>
                        </div>
                        <ScoreDisplay score={score} />

                        {/* Progress bar */}
                        <div className="space-y-2">
                          <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                            <div
                              className="h-full rounded-full bg-amber-500 transition-all"
                              style={{ width: totalApprovals > 0 ? `${(approvedCount / totalApprovals) * 100}%` : '0%' }}
                            />
                          </div>
                          <div className="space-y-1">
                            {score.approvals.map((approval) => (
                              <div key={approval.id} className="flex items-center justify-between text-sm">
                                <span className="text-slate-600">
                                  {approval.user.firstName} {approval.user.lastName}
                                </span>
                                {approval.status === 'APPROVED' && (
                                  <span className="flex items-center gap-1 text-emerald-600">
                                    <CheckCircle2 className="h-3.5 w-3.5" /> Aprobado
                                  </span>
                                )}
                                {approval.status === 'PENDING' && (
                                  <span className="text-slate-400">Pendiente</span>
                                )}
                                {approval.status === 'REJECTED' && (
                                  <span className="flex items-center gap-1 text-red-600">
                                    <X className="h-3.5 w-3.5" /> Rechazado
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Approve / Reject buttons for participants */}
                        {canApproveOrReject && (
                          <div className="flex gap-2">
                            <Button
                              className="flex-1 bg-emerald-500 hover:bg-emerald-600"
                              onClick={handleApprove}
                              disabled={approveScore.isPending}
                            >
                              {approveScore.isPending ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                              )}
                              Aprobar
                            </Button>
                            <Button
                              variant="outline"
                              className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                              onClick={handleReject}
                              disabled={rejectScore.isPending}
                            >
                              {rejectScore.isPending ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <X className="mr-2 h-4 w-4" />
                              )}
                              Rechazar
                            </Button>
                          </div>
                        )}

                        {/* Cancel button for creator */}
                        {canDelete && (
                          <Button
                            variant="outline"
                            className="w-full border-slate-300 text-slate-600"
                            onClick={handleDelete}
                            disabled={deleteProposal.isPending}
                          >
                            {deleteProposal.isPending ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="mr-2 h-4 w-4" />
                            )}
                            Cancelar propuesta
                          </Button>
                        )}
                      </div>
                    )}

                    {/* REJECTED score */}
                    {score?.status === 'REJECTED' && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="border-red-300 text-red-600">Rechazada</Badge>
                        </div>
                        <ScoreDisplay score={score} />
                        {isCreator && (
                          <div className="flex gap-2">
                            <Button
                              className="flex-1 bg-amber-500 text-slate-900 hover:bg-amber-400"
                              onClick={() => {
                                handleDelete();
                              }}
                              disabled={deleteProposal.isPending}
                            >
                              {deleteProposal.isPending ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="mr-2 h-4 w-4" />
                              )}
                              Eliminar y proponer nuevo resultado
                            </Button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* No score yet */}
                    {!score && (
                      <div className="text-center">
                        {isCreator ? (
                          <p className="text-sm text-slate-500">
                            Aun no has propuesto un resultado para este partido.
                          </p>
                        ) : isParticipant ? (
                          <p className="text-sm text-slate-500">
                            El organizador aun no ha propuesto un resultado.
                          </p>
                        ) : (
                          <p className="text-sm text-slate-500">
                            Aun no se han registrado resultados.
                          </p>
                        )}
                      </div>
                    )}

                    {/* Propose score button (creator only) */}
                    {canPropose && (
                      <Button
                        className="w-full bg-amber-500 text-slate-900 hover:bg-amber-400"
                        onClick={() => setShowScoreDialog(true)}
                      >
                        <Trophy className="mr-2 h-4 w-4" />
                        Proponer Resultado
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
                  {/* Gender restriction message */}
                  {genderBlocked && !isJoined && !isCreator && match.status === 'OPEN' && (
                    <p className="text-center text-sm text-red-500">{genderBlocked}</p>
                  )}

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
              ¿Estas seguro de que deseas cancelar este partido? Esta accion no se puede deshacer
              y se notificara a todos los jugadores inscritos.
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
              Si, cancelar partido
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Join Confirmation Dialog */}
      <Dialog open={showJoinConfirmation} onOpenChange={setShowJoinConfirmation}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              Te has unido al partido
            </DialogTitle>
            <DialogDescription>
              ¡Nos vemos en la cancha!
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="rounded-lg bg-slate-50 p-3 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-slate-400" />
                <span className="font-medium text-slate-700">{match.club.name}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-slate-400" />
                <span className="text-slate-600">{capitalizedDate}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-slate-400" />
                <span className="text-slate-600">{match.startTime} - {match.endTime}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-slate-400" />
                <span className="text-slate-600">{match.category}</span>
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-slate-700">Jugadores</p>
              <div className="space-y-1.5">
                {match.players.map((mp) => (
                  <div key={mp.id} className="flex items-center gap-2 text-sm">
                    <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-semibold text-blue-800">
                      {mp.user ? `${mp.user.firstName.charAt(0)}${mp.user.lastName.charAt(0)}` : '?'}
                    </div>
                    <span className="text-slate-600">
                      {mp.user ? `${mp.user.firstName} ${mp.user.lastName}` : mp.guestName || 'Invitado'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            {whatsappLink && (
              <Button
                asChild
                className="flex-1 bg-emerald-500 text-white hover:bg-emerald-600"
              >
                <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Contactar organizador
                </a>
              </Button>
            )}
            <Button variant="outline" onClick={() => setShowJoinConfirmation(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Score Proposal Dialog */}
      <Dialog open={showScoreDialog} onOpenChange={setShowScoreDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Proponer Resultado</DialogTitle>
            <DialogDescription>
              Ingresa el resultado del partido por sets. Los demas jugadores deberan aprobar el resultado. El set 3 es opcional.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Team Assignment */}
            <div>
              <Label className="text-sm font-medium">Asignar equipos</Label>
              <p className="mb-2 text-xs text-slate-500">Toca un jugador para asignarlo a un equipo</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <p className="text-center text-xs font-semibold text-blue-700">Equipo 1</p>
                  <div className="min-h-[72px] rounded-lg border-2 border-blue-200 bg-blue-50 p-2 space-y-1">
                    {team1Ids.map((pid) => {
                      const mp = match.players.find((p) => p.id === pid);
                      if (!mp) return null;
                      const name = mp.user ? `${mp.user.firstName} ${mp.user.lastName}` : mp.guestName || 'Invitado';
                      return (
                        <button
                          key={pid}
                          type="button"
                          className="flex w-full items-center gap-1.5 rounded bg-white px-2 py-1 text-left text-sm text-slate-700 shadow-sm hover:bg-slate-50"
                          onClick={() => {
                            setTeam1Ids((prev) => prev.filter((id) => id !== pid));
                          }}
                        >
                          <X className="h-3 w-3 text-slate-400" />
                          {name}
                        </button>
                      );
                    })}
                    {team1Ids.length < 2 && (
                      <p className="text-center text-xs text-blue-400">{2 - team1Ids.length} cupo{team1Ids.length === 1 ? '' : 's'}</p>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-center text-xs font-semibold text-red-700">Equipo 2</p>
                  <div className="min-h-[72px] rounded-lg border-2 border-red-200 bg-red-50 p-2 space-y-1">
                    {team2Ids.map((pid) => {
                      const mp = match.players.find((p) => p.id === pid);
                      if (!mp) return null;
                      const name = mp.user ? `${mp.user.firstName} ${mp.user.lastName}` : mp.guestName || 'Invitado';
                      return (
                        <button
                          key={pid}
                          type="button"
                          className="flex w-full items-center gap-1.5 rounded bg-white px-2 py-1 text-left text-sm text-slate-700 shadow-sm hover:bg-slate-50"
                          onClick={() => {
                            setTeam2Ids((prev) => prev.filter((id) => id !== pid));
                          }}
                        >
                          <X className="h-3 w-3 text-slate-400" />
                          {name}
                        </button>
                      );
                    })}
                    {team2Ids.length < 2 && (
                      <p className="text-center text-xs text-red-400">{2 - team2Ids.length} cupo{team2Ids.length === 1 ? '' : 's'}</p>
                    )}
                  </div>
                </div>
              </div>
              {/* Unassigned players */}
              {(() => {
                const assignedIds = new Set([...team1Ids, ...team2Ids]);
                const unassigned = match.players.filter((p) => !assignedIds.has(p.id));
                if (unassigned.length === 0) return null;
                return (
                  <div className="mt-2 space-y-1">
                    <p className="text-xs text-slate-500">Sin asignar:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {unassigned.map((mp) => {
                        const name = mp.user ? `${mp.user.firstName} ${mp.user.lastName}` : mp.guestName || 'Invitado';
                        return (
                          <div key={mp.id} className="flex gap-0.5">
                            <button
                              type="button"
                              className="rounded-l bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-200"
                              onClick={() => {
                                if (team1Ids.length < 2) setTeam1Ids((prev) => [...prev, mp.id]);
                              }}
                              disabled={team1Ids.length >= 2}
                            >
                              E1
                            </button>
                            <span className="bg-slate-100 px-2 py-1 text-xs text-slate-700">{name}</span>
                            <button
                              type="button"
                              className="rounded-r bg-red-100 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-200"
                              onClick={() => {
                                if (team2Ids.length < 2) setTeam2Ids((prev) => [...prev, mp.id]);
                              }}
                              disabled={team2Ids.length >= 2}
                            >
                              E2
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>

            <Separator />

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
              onClick={handleProposeScore}
              disabled={proposeScore.isPending || team1Ids.length !== 2 || team2Ids.length !== 2}
            >
              {proposeScore.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trophy className="mr-2 h-4 w-4" />
              )}
              Proponer Resultado
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ScoreDisplay({ score }: { score: { set1Team1: number; set1Team2: number; set2Team1: number; set2Team2: number; set3Team1: number | null; set3Team2: number | null; reportedBy: { firstName: string; lastName: string } } }) {
  return (
    <div className="rounded-lg border bg-slate-50 p-3">
      <p className="mb-2 text-xs text-slate-500">
        Propuesto por {score.reportedBy.firstName} {score.reportedBy.lastName}
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
  );
}
