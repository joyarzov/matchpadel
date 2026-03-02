import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { PadelIcon } from '@/components/icons/PadelIcon';
import { registerSchema, type RegisterFormData } from '@/lib/validators';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { PlayerCategory } from '@/types/auth.types';

const categories: { value: PlayerCategory; label: string; description: string }[] = [
  { value: 'SEXTA', label: 'Sexta', description: 'Principiante' },
  { value: 'QUINTA', label: 'Quinta', description: 'Iniciado' },
  { value: 'CUARTA', label: 'Cuarta', description: 'Intermedio' },
  { value: 'TERCERA', label: 'Tercera', description: 'Avanzado' },
  { value: 'SEGUNDA', label: 'Segunda', description: 'Competitivo' },
  { value: 'PRIMERA', label: 'Primera', description: 'Profesional' },
];

function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score, label: 'Débil', color: 'bg-red-500' };
  if (score <= 2) return { score, label: 'Regular', color: 'bg-orange-500' };
  if (score <= 3) return { score, label: 'Buena', color: 'bg-amber-500' };
  if (score <= 4) return { score, label: 'Fuerte', color: 'bg-emerald-500' };
  return { score, label: 'Muy fuerte', color: 'bg-emerald-600' };
}

export function RegisterForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const { register: authRegister } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      category: undefined,
    },
  });

  const passwordValue = watch('password');
  const selectedCategory = watch('category');
  const selectedGender = watch('gender');

  const strength = useMemo(
    () => getPasswordStrength(passwordValue || ''),
    [passwordValue],
  );

  const onSubmit = async (data: RegisterFormData) => {
    setApiError(null);
    try {
      const { confirmPassword: _, ...registerData } = data;
      const payload = {
        ...registerData,
        phone: registerData.phone || undefined,
        category: registerData.category || undefined,
        gender: registerData.gender,
      };
      await authRegister(payload);
      toast({
        title: 'Cuenta creada',
        description: 'Tu cuenta ha sido creada exitosamente.',
      });
      navigate('/dashboard');
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : 'Error al crear la cuenta. Intenta nuevamente.';
      setApiError(message);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-slate-50 px-4 py-12">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mb-2 flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-800">
              <PadelIcon className="h-6 w-6 text-amber-500" />
            </div>
          </div>
          <CardTitle className="text-2xl text-slate-800">Crear Cuenta</CardTitle>
          <CardDescription>Únete a la comunidad de pádel en MatchPadel</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {apiError && (
              <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {apiError}
              </div>
            )}

            {/* Name fields */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">Nombre</Label>
                <Input
                  id="firstName"
                  placeholder="Juan"
                  autoComplete="given-name"
                  {...register('firstName')}
                />
                {errors.firstName && (
                  <p className="text-xs text-red-500">{errors.firstName.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Apellido</Label>
                <Input
                  id="lastName"
                  placeholder="Pérez"
                  autoComplete="family-name"
                  {...register('lastName')}
                />
                {errors.lastName && (
                  <p className="text-xs text-red-500">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="register-email">Correo electrónico</Label>
              <Input
                id="register-email"
                type="email"
                placeholder="tu@email.com"
                autoComplete="email"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-xs text-red-500">{errors.email.message}</p>
              )}
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+56912345678"
                autoComplete="tel"
                {...register('phone')}
              />
              {errors.phone && (
                <p className="text-xs text-red-500">{errors.phone.message}</p>
              )}
            </div>

            {/* Gender */}
            <div className="space-y-2">
              <Label>Género</Label>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { value: 'MALE' as const, label: 'Hombre' },
                  { value: 'FEMALE' as const, label: 'Mujer' },
                ]).map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() =>
                      setValue('gender', opt.value, { shouldValidate: true })
                    }
                    className={`rounded-lg border-2 px-3 py-2 text-sm font-medium transition-colors ${
                      selectedGender === opt.value
                        ? 'border-blue-800 bg-blue-50 text-blue-800'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              {errors.gender && (
                <p className="text-xs text-red-500">{errors.gender.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="register-password">Contraseña</Label>
              <div className="relative">
                <Input
                  id="register-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Mínimo 6 caracteres"
                  autoComplete="new-password"
                  className="pr-10"
                  {...register('password')}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {passwordValue && passwordValue.length > 0 && (
                <div className="space-y-1">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <div
                        key={level}
                        className={`h-1.5 flex-1 rounded-full ${
                          level <= strength.score ? strength.color : 'bg-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-slate-500">
                    Seguridad: {strength.label}
                  </p>
                </div>
              )}
              {errors.password && (
                <p className="text-xs text-red-500">{errors.password.message}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Repite tu contraseña"
                  autoComplete="new-password"
                  className="pr-10"
                  {...register('confirmPassword')}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  tabIndex={-1}
                  aria-label={showConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-xs text-red-500">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label>Categoría de juego</Label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {categories.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() =>
                      setValue('category', cat.value, { shouldValidate: true })
                    }
                    className={`rounded-lg border-2 px-3 py-2 text-left text-sm transition-colors ${
                      selectedCategory === cat.value
                        ? 'border-blue-800 bg-blue-50 text-blue-800'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <span className="font-medium">{cat.label}</span>
                    <span className="block text-xs text-slate-500">{cat.description}</span>
                  </button>
                ))}
              </div>
              {errors.category && (
                <p className="text-xs text-red-500">{errors.category.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-blue-800 hover:bg-blue-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creando cuenta...
                </>
              ) : (
                'Registrarse'
              )}
            </Button>

            <p className="text-center text-sm text-slate-500">
              ¿Ya tienes cuenta?{' '}
              <Link to="/login" className="font-medium text-blue-800 hover:underline">
                Inicia sesión
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
