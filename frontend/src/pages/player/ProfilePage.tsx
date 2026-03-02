import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  User,
  Mail,
  Phone,
  Calendar,
  Shield,
  Loader2,
  Save,
  Lock,
  Eye,
  EyeOff,
} from 'lucide-react';
import { PadelIcon } from '@/components/icons/PadelIcon';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { useMyMatches } from '@/hooks/useMatches';
import { userService } from '@/services/userService';
import { useToast } from '@/components/ui/use-toast';
import type { PlayerCategory } from '@/types/auth.types';
import { cn } from '@/lib/utils';

const categoryOptions: { value: PlayerCategory; label: string }[] = [
  { value: 'SEPTIMA', label: 'Séptima' },
  { value: 'SEXTA', label: 'Sexta' },
  { value: 'QUINTA', label: 'Quinta' },
  { value: 'CUARTA', label: 'Cuarta' },
  { value: 'TERCERA', label: 'Tercera' },
  { value: 'SEGUNDA', label: 'Segunda' },
  { value: 'PRIMERA', label: 'Primera' },
];

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: myMatchesData } = useMyMatches();

  // Profile form state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [category, setCategory] = useState<PlayerCategory | ''>(user?.category ?? '');
  const [savingProfile, setSavingProfile] = useState(false);

  // Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // Match statistics
  const myMatches = Array.isArray(myMatchesData)
    ? myMatchesData
    : (myMatchesData as { matches?: unknown[] })?.matches ?? [];
  const totalMatches = (myMatches as import('@/types/match.types').Match[]).length;
  const createdMatches = (myMatches as import('@/types/match.types').Match[]).filter(
    (m) => m.creatorId === user?.id,
  ).length;
  const joinedMatches = totalMatches - createdMatches;

  if (!user) return null;

  const initials = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
  const memberSince = format(parseISO(user.createdAt), "MMMM 'de' yyyy", { locale: es });

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      await userService.updateProfile({
        firstName,
        lastName,
        phone: phone || undefined,
        category: category as PlayerCategory || undefined,
      });
      toast({ title: 'Perfil actualizado', description: 'Tus datos han sido guardados correctamente.' });
      setIsEditingProfile(false);
      // Reload to update user in auth state
      window.location.reload();
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

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: 'Error',
        description: 'Las contraseñas no coinciden.',
        variant: 'destructive',
      });
      return;
    }
    if (newPassword.length < 6) {
      toast({
        title: 'Error',
        description: 'La nueva contraseña debe tener al menos 6 caracteres.',
        variant: 'destructive',
      });
      return;
    }

    setChangingPassword(true);
    try {
      await userService.changePassword({
        currentPassword,
        newPassword,
      });
      toast({ title: 'Contraseña actualizada', description: 'Tu contraseña ha sido cambiada exitosamente.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      toast({
        title: 'Error',
        description: 'No se pudo cambiar la contraseña. Verifica tu contraseña actual.',
        variant: 'destructive',
      });
    } finally {
      setChangingPassword(false);
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
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Change Password */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Lock className="h-5 w-5 text-slate-400" />
                Cambiar Contraseña
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Contraseña actual</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    tabIndex={-1}
                  >
                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">Nueva contraseña</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    tabIndex={-1}
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar nueva contraseña</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              <Button
                onClick={handleChangePassword}
                disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword}
                className="bg-blue-800 hover:bg-blue-700"
              >
                {changingPassword ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Shield className="mr-2 h-4 w-4" />
                )}
                Cambiar Contraseña
              </Button>
            </CardContent>
          </Card>

          {/* Match Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <PadelIcon className="h-5 w-5 text-slate-400" />
                Estadísticas de Partidos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2 sm:gap-4">
                <div className="rounded-lg bg-slate-50 p-3 text-center sm:p-4">
                  <p className="text-xl font-bold text-blue-800 sm:text-2xl">{totalMatches}</p>
                  <p className="text-[10px] text-slate-500 sm:text-xs">Total jugados</p>
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
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
