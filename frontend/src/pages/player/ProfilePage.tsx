import { useState } from 'react';
import { Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  User,
  Mail,
  Phone,
  Calendar,
  Loader2,
  Save,
  Trophy,
  XCircle,
  ArrowRight,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { PadelIcon } from '@/components/icons/PadelIcon';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/stores/authStore';
import { useMyMatches } from '@/hooks/useMatches';
import { useUserStats } from '@/hooks/useStats';
import { userService } from '@/services/userService';
import { useToast } from '@/components/ui/use-toast';
import type { PlayerCategory, Gender } from '@/types/auth.types';
import type { Match } from '@/types/match.types';
import { cn } from '@/lib/utils';

const categoryOptions: { value: PlayerCategory; label: string }[] = [
  { value: 'SEXTA', label: 'Sexta' },
  { value: 'QUINTA', label: 'Quinta' },
  { value: 'CUARTA', label: 'Cuarta' },
  { value: 'TERCERA', label: 'Tercera' },
  { value: 'SEGUNDA', label: 'Segunda' },
  { value: 'PRIMERA', label: 'Primera' },
];

const genderOptions: { value: Gender; label: string }[] = [
  { value: 'MALE', label: 'Hombre' },
  { value: 'FEMALE', label: 'Mujer' },
];

export default function ProfilePage() {
  const { user } = useAuth();
  const { setUser } = useAuthStore();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: myMatchesData } = useMyMatches();
  const { data: stats } = useUserStats();

  // Profile form state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [category, setCategory] = useState<PlayerCategory | ''>(user?.category ?? '');
  const [gender, setGender] = useState<Gender>(user?.gender ?? 'MALE');
  const [savingProfile, setSavingProfile] = useState(false);

  // Match statistics
  const myMatches = Array.isArray(myMatchesData)
    ? myMatchesData
    : (myMatchesData as { matches?: unknown[] })?.matches ?? [];
  const allMatches = myMatches as Match[];
  const totalMatches = allMatches.length;
  const createdMatches = allMatches.filter(
    (m) => m.creatorId === user?.id,
  ).length;
  const joinedMatches = totalMatches - createdMatches;

  // Sort matches by date descending for history
  const sortedMatches = [...allMatches].sort(
    (a, b) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime(),
  );

  if (!user) return null;

  const initials = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
  const memberSince = format(parseISO(user.createdAt), "MMMM 'de' yyyy", { locale: es });
  const wins = stats?.wins ?? 0;
  const losses = stats?.losses ?? 0;
  const totalPlayed = stats?.matchesPlayed ?? 0;
  const winRate = totalPlayed > 0 ? Math.round((wins / totalPlayed) * 100) : 0;

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      const updatedUser = await userService.updateProfile({
        firstName,
        lastName,
        phone: phone || undefined,
        category: category as PlayerCategory || undefined,
        gender,
      });
      const mergedUser = { ...user, ...updatedUser };
      setUser(mergedUser);
      queryClient.setQueryData(['auth', 'me'], mergedUser);
      toast({ title: 'Perfil actualizado', description: 'Tus datos han sido guardados correctamente.' });
      setIsEditingProfile(false);
    } catch {
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el perfil.',
        variant: 'destructive',
      });
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1 bg-slate-50">
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
          <h1 className="mb-8 text-2xl font-bold text-slate-800 sm:text-3xl">Mi Perfil</h1>

          {/* Profile Card */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
                {/* Avatar */}
                <Avatar className="h-20 w-20 border-4 border-blue-100">
                  <AvatarImage src={user.avatarUrl ?? undefined} alt={user.firstName} />
                  <AvatarFallback className="bg-blue-800 text-xl font-bold text-white">
                    {initials}
                  </AvatarFallback>
                </Avatar>

                {/* Info */}
                <div className="flex-1 text-center sm:text-left">
                  <h2 className="text-xl font-bold text-slate-800">
                    {user.firstName} {user.lastName}
                  </h2>
                  <div className="mt-2 flex flex-wrap items-center justify-center gap-3 sm:justify-start">
                    <div className="flex items-center gap-1.5 text-sm text-slate-500">
                      <Mail className="h-4 w-4" />
                      {user.email}
                    </div>
                    {user.phone && (
                      <div className="flex items-center gap-1.5 text-sm text-slate-500">
                        <Phone className="h-4 w-4" />
                        {user.phone}
                      </div>
                    )}
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                    {user.category && (
                      <Badge className="bg-blue-800 text-white hover:bg-blue-800">
                        {user.category}
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-slate-500">
                      {user.gender === 'MALE' ? 'Hombre' : 'Mujer'}
                    </Badge>
                    <Badge variant="outline" className="text-slate-500">
                      <Calendar className="mr-1 h-3 w-3" />
                      Miembro desde {memberSince}
                    </Badge>
                  </div>
                </div>

                {!isEditingProfile && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditingProfile(true)}
                  >
                    Editar
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Edit Profile Form */}
          {isEditingProfile && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <User className="h-5 w-5 text-slate-400" />
                  Editar Perfil
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Nombre</Label>
                    <Input
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Apellido</Label>
                    <Input
                      id="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+56912345678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Género</Label>
                  <div className="flex gap-2">
                    {genderOptions.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setGender(opt.value)}
                        className={cn(
                          'rounded-full border-2 px-4 py-1.5 text-sm font-medium transition-colors',
                          gender === opt.value
                            ? 'border-blue-800 bg-blue-800 text-white'
                            : 'border-slate-200 text-slate-600 hover:border-slate-300',
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
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
                </div>
                <div className="flex gap-3 pt-2">
                  <Button
                    className="bg-blue-800 hover:bg-blue-700"
                    onClick={handleSaveProfile}
                    disabled={savingProfile}
                  >
                    {savingProfile ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Guardar Cambios
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsEditingProfile(false);
                      setFirstName(user.firstName);
                      setLastName(user.lastName);
                      setPhone(user.phone ?? '');
                      setCategory(user.category ?? '');
                      setGender(user.gender ?? 'MALE');
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Stats & Record */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Trophy className="h-5 w-5 text-amber-500" />
                Rendimiento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-4">
                <div className="rounded-lg bg-slate-50 p-3 text-center sm:p-4">
                  <p className="text-xl font-bold text-blue-800 sm:text-2xl">{totalPlayed}</p>
                  <p className="text-[10px] text-slate-500 sm:text-xs">Jugados</p>
                </div>
                <div className="rounded-lg bg-emerald-50 p-3 text-center sm:p-4">
                  <p className="text-xl font-bold text-emerald-700 sm:text-2xl">{wins}</p>
                  <p className="text-[10px] text-slate-500 sm:text-xs">Victorias</p>
                </div>
                <div className="rounded-lg bg-red-50 p-3 text-center sm:p-4">
                  <p className="text-xl font-bold text-red-600 sm:text-2xl">{losses}</p>
                  <p className="text-[10px] text-slate-500 sm:text-xs">Derrotas</p>
                </div>
                <div className="rounded-lg bg-amber-50 p-3 text-center sm:p-4">
                  <p className="text-xl font-bold text-amber-700 sm:text-2xl">{winRate}%</p>
                  <p className="text-[10px] text-slate-500 sm:text-xs">Win Rate</p>
                </div>
              </div>

              {/* Win rate bar */}
              {totalPlayed > 0 && (
                <div className="mt-4 space-y-1">
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>{wins}V - {losses}D</span>
                    <span>{winRate}%</span>
                  </div>
                  <div className="flex h-2.5 overflow-hidden rounded-full bg-red-200">
                    <div
                      className="rounded-full bg-emerald-500 transition-all"
                      style={{ width: `${winRate}%` }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Match Statistics */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <PadelIcon className="h-5 w-5 text-slate-400" />
                Actividad de Partidos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2 sm:gap-4">
                <div className="rounded-lg bg-slate-50 p-3 text-center sm:p-4">
                  <p className="text-xl font-bold text-blue-800 sm:text-2xl">{totalMatches}</p>
                  <p className="text-[10px] text-slate-500 sm:text-xs">Total partidos</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3 text-center sm:p-4">
                  <p className="text-xl font-bold text-emerald-700 sm:text-2xl">{createdMatches}</p>
                  <p className="text-[10px] text-slate-500 sm:text-xs">Creados</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3 text-center sm:p-4">
                  <p className="text-xl font-bold text-amber-700 sm:text-2xl">{joinedMatches}</p>
                  <p className="text-[10px] text-slate-500 sm:text-xs">Unido</p>
                </div>
              </div>

              {stats?.favoriteClub && (
                <div className="mt-4 rounded-lg border bg-slate-50 px-4 py-3">
                  <p className="text-xs text-slate-500">Club favorito</p>
                  <p className="text-sm font-semibold text-slate-800">{stats.favoriteClub.name}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Match History */}
          {sortedMatches.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Calendar className="h-5 w-5 text-slate-400" />
                  Historial de Partidos
                </CardTitle>
              </CardHeader>
              <CardContent className="divide-y p-0">
                {sortedMatches.slice(0, 10).map((match) => {
                  const matchDate = match.date || match.createdAt;
                  const statusColor = {
                    COMPLETED: 'bg-emerald-100 text-emerald-700',
                    CANCELLED: 'bg-red-100 text-red-700',
                    OPEN: 'bg-blue-100 text-blue-700',
                    FULL: 'bg-amber-100 text-amber-700',
                    IN_PROGRESS: 'bg-purple-100 text-purple-700',
                  }[match.status] ?? 'bg-slate-100 text-slate-700';
                  const statusLabel = {
                    COMPLETED: 'Completado',
                    CANCELLED: 'Cancelado',
                    OPEN: 'Abierto',
                    FULL: 'Lleno',
                    IN_PROGRESS: 'En juego',
                  }[match.status] ?? match.status;

                  return (
                    <Link
                      key={match.id}
                      to={`/matches/${match.id}`}
                      className="flex items-center gap-4 px-5 py-3 transition-colors hover:bg-slate-50"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100">
                        {match.status === 'COMPLETED' ? (
                          <Trophy className="h-5 w-5 text-amber-500" />
                        ) : match.status === 'CANCELLED' ? (
                          <XCircle className="h-5 w-5 text-red-400" />
                        ) : (
                          <PadelIcon className="h-5 w-5 text-slate-500" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-800">
                          {match.club?.name ?? 'Club'}
                        </p>
                        <p className="text-xs text-slate-500">
                          {format(parseISO(matchDate), "d MMM yyyy", { locale: es })}
                          {match.startTime && ` · ${match.startTime}`}
                          {' · '}{match.category}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium', statusColor)}>
                          {statusLabel}
                        </span>
                        <ArrowRight className="h-4 w-4 text-slate-300" />
                      </div>
                    </Link>
                  );
                })}
                {sortedMatches.length > 10 && (
                  <div className="px-5 py-3 text-center">
                    <Link
                      to="/my-matches"
                      className="text-sm font-medium text-blue-800 hover:underline"
                    >
                      Ver todos los partidos ({sortedMatches.length})
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
