import { useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { MatchList } from '@/components/matches/MatchList';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useMyMatches, useLeaveMatch } from '@/hooks/useMatches';
import { useToast } from '@/components/ui/use-toast';
import type { Match } from '@/types/match.types';

export default function MyMatchesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: myMatchesData, isLoading } = useMyMatches();
  const leaveMatch = useLeaveMatch();

  const matches: Match[] = useMemo(() => {
    if (!myMatchesData) return [];
    if (Array.isArray(myMatchesData)) return myMatchesData;
    return (myMatchesData as { data?: Match[] }).data ?? [];
  }, [myMatchesData]);

  const handleLeave = useCallback(async (matchId: string) => {
    try {
      await leaveMatch.mutateAsync(matchId);
      toast({ title: 'Has salido del partido' });
    } catch {
      toast({ title: 'Error', description: 'No se pudo salir del partido.', variant: 'destructive' });
    }
  }, [leaveMatch, toast]);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Header */}
          <Button
            variant="ghost"
            className="mb-4 text-slate-600 hover:text-slate-800"
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al inicio
          </Button>

          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-800 sm:text-3xl">
              Mis Partidos
            </h1>
            <p className="mt-1 text-slate-500">
              Partidos que has creado o en los que te has inscrito.
            </p>
          </div>

          {/* Content */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-blue-800" />
              <p className="mt-3 text-sm text-slate-500">Cargando partidos...</p>
            </div>
          ) : (
            <MatchList
              matches={matches}
              currentUserId={user?.id}
              onLeave={handleLeave}
              onEdit={(matchId) => navigate(`/matches/${matchId}`)}
            />
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
