import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, AlertTriangle } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { MatchForm } from '@/components/matches/MatchForm';
import { Button } from '@/components/ui/button';
import { useMatch, useUpdateMatch } from '@/hooks/useMatches';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import type { CreateMatchRequest } from '@/types/match.types';

export default function EditMatchPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: match, isLoading } = useMatch(id ?? '');
  const updateMatch = useUpdateMatch();

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

  if (user?.id !== match.creatorId) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex flex-1 items-center justify-center bg-slate-50">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
              <AlertTriangle className="h-8 w-8 text-slate-400" />
            </div>
            <h2 className="text-xl font-semibold text-slate-800">Sin permisos</h2>
            <p className="mt-2 text-sm text-slate-500">Solo el creador puede editar este partido.</p>
            <Button
              className="mt-4 bg-blue-800 hover:bg-blue-700"
              onClick={() => navigate(`/matches/${id}`)}
            >
              Ver partido
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const handleSubmit = async (data: CreateMatchRequest) => {
    try {
      await updateMatch.mutateAsync({
        id: match.id,
        data: {
          courtId: data.courtId,
          scheduledDate: data.scheduledDate,
          scheduledTime: data.scheduledTime,
          durationMinutes: data.durationMinutes,
          notes: data.notes,
        },
      });
      toast({ title: 'Partido actualizado', description: 'Los cambios han sido guardados.' });
      navigate(`/matches/${match.id}`);
    } catch {
      toast({
        title: 'Error al actualizar',
        description: 'No se pudo actualizar el partido. Intenta nuevamente.',
        variant: 'destructive',
      });
    }
  };

  // Map match data to the form's initialData format
  const initialData: Partial<CreateMatchRequest> = {
    clubId: match.clubId,
    courtId: match.courtId,
    category: match.category,
    scheduledDate: match.date,
    scheduledTime: match.startTime,
    durationMinutes: match.endTime && match.startTime
      ? (() => {
          const [sh, sm] = match.startTime.split(':').map(Number);
          const [eh, em] = match.endTime.split(':').map(Number);
          return (eh * 60 + em) - (sh * 60 + sm);
        })()
      : 60,
    notes: match.description,
    genderMode: match.genderMode,
    requiredMales: match.requiredMales ?? undefined,
    requiredFemales: match.requiredFemales ?? undefined,
    initialPlayers: match.currentPlayers,
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <Button
            variant="ghost"
            className="mb-4 text-slate-600 hover:text-slate-800"
            onClick={() => navigate(`/matches/${match.id}`)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al partido
          </Button>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-800 sm:text-3xl">
              Editar Partido
            </h1>
            <p className="mt-1 text-slate-500">
              Modifica los datos del partido.
            </p>
          </div>

          <MatchForm onSubmit={handleSubmit} initialData={initialData} isEdit />
        </div>
      </main>

      <Footer />
    </div>
  );
}
