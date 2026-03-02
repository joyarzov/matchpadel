import { Loader2, Trophy } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useRanking } from '@/hooks/useStats';

const positionBadge = (pos: number) => {
  if (pos === 1) return 'bg-amber-400 text-amber-900';
  if (pos === 2) return 'bg-slate-300 text-slate-800';
  if (pos === 3) return 'bg-amber-700 text-amber-100';
  return 'bg-slate-100 text-slate-600';
};

export default function RankingPage() {
  const { data: ranking, isLoading } = useRanking(50);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1 bg-slate-50">
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8 text-center">
            <div className="mb-4 flex justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
                <Trophy className="h-7 w-7 text-amber-700" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-slate-800 sm:text-3xl">
              Ranking de Jugadores
            </h1>
            <p className="mt-2 text-slate-500">
              Clasificación basada en victorias confirmadas por la comunidad.
            </p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-blue-800" />
            </div>
          ) : ranking && ranking.length > 0 ? (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-slate-50 text-left text-xs font-medium uppercase text-slate-500">
                        <th className="px-4 py-3 text-center">#</th>
                        <th className="px-4 py-3">Jugador</th>
                        <th className="px-4 py-3 text-center">Categoría</th>
                        <th className="px-4 py-3 text-center">V</th>
                        <th className="px-4 py-3 text-center">D</th>
                        <th className="px-4 py-3 text-center">PJ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ranking.map((entry) => (
                        <tr
                          key={entry.userId}
                          className="border-b last:border-0 hover:bg-slate-50"
                        >
                          <td className="px-4 py-3 text-center">
                            <span
                              className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${positionBadge(entry.position)}`}
                            >
                              {entry.position}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={entry.avatarUrl ?? undefined} />
                                <AvatarFallback className="bg-blue-100 text-xs font-semibold text-blue-800">
                                  {entry.firstName.charAt(0)}
                                  {entry.lastName.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium text-slate-800">
                                {entry.firstName} {entry.lastName}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {entry.category ? (
                              <Badge variant="outline" className="text-xs">
                                {entry.category}
                              </Badge>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center font-semibold text-emerald-600">
                            {entry.wins}
                          </td>
                          <td className="px-4 py-3 text-center font-semibold text-red-500">
                            {entry.losses}
                          </td>
                          <td className="px-4 py-3 text-center text-slate-600">
                            {entry.matchesPlayed}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center py-12 text-center">
                <Trophy className="mb-4 h-12 w-12 text-slate-300" />
                <h3 className="text-lg font-medium text-slate-800">
                  Aún no hay datos de ranking
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Juega partidos y sube resultados para aparecer en el ranking.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
