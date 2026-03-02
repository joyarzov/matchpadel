import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, MessageCircle, Eye } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { MatchForm } from '@/components/matches/MatchForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useCreateMatch } from '@/hooks/useMatches';
import { useToast } from '@/components/ui/use-toast';
import { getMatchShareWhatsAppUrl } from '@/lib/whatsapp';
import type { Match, CreateMatchRequest } from '@/types/match.types';

function getBackendBaseUrl(): string {
  const apiUrl = import.meta.env.VITE_API_URL as string | undefined;
  if (apiUrl) {
    // Remove /api suffix to get base URL
    return apiUrl.replace(/\/api\/?$/, '');
  }
  return `${window.location.protocol}//${window.location.hostname}:3000`;
}

export default function CreateMatchPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const createMatch = useCreateMatch();
  const [createdMatch, setCreatedMatch] = useState<Match | null>(null);

  const handleSubmit = async (data: CreateMatchRequest) => {
    try {
      const match = await createMatch.mutateAsync(data);
      setCreatedMatch(match);
    } catch {
      toast({
        title: 'Error al crear partido',
        description: 'Ocurrió un error al crear el partido. Intenta nuevamente.',
        variant: 'destructive',
      });
    }
  };

  // Success screen after match creation
  if (createdMatch) {
    const whatsappShareUrl = getMatchShareWhatsAppUrl(createdMatch, getBackendBaseUrl());

    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />

        <main className="flex flex-1 items-center justify-center bg-slate-50">
          <Card className="mx-4 w-full max-w-md">
            <CardContent className="flex flex-col items-center p-8 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle className="h-8 w-8 text-emerald-600" />
              </div>

              <h2 className="mb-2 text-xl font-bold text-slate-800">
                Partido creado exitosamente
              </h2>
              <p className="mb-6 text-sm text-slate-500">
                Tu partido ha sido publicado. Compártelo para que otros jugadores puedan unirse.
              </p>

              <div className="flex w-full flex-col gap-3">
                <Button
                  asChild
                  className="w-full bg-emerald-500 text-white hover:bg-emerald-600"
                >
                  <a href={whatsappShareUrl} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Compartir en WhatsApp
                  </a>
                </Button>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate(`/matches/${createdMatch.id}`)}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Ver partido
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>

        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Back button */}
          <Button
            variant="ghost"
            className="mb-4 text-slate-600 hover:text-slate-800"
            onClick={() => navigate('/matches')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a partidos
          </Button>

          {/* Title */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-800 sm:text-3xl">
              Crear Nuevo Partido
            </h1>
            <p className="mt-1 text-slate-500">
              Completa los datos del partido para que otros jugadores puedan unirse.
            </p>
          </div>

          {/* Form */}
          <MatchForm onSubmit={handleSubmit} />
        </div>
      </main>

      <Footer />
    </div>
  );
}
