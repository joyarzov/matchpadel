import { Link } from 'react-router-dom';
import { UserPlus, Search, Trophy, Users, Building2, ArrowRight } from 'lucide-react';
import { PadelIcon } from '@/components/icons/PadelIcon';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { ClubCard } from '@/components/clubs/ClubCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useClubs } from '@/hooks/useClubs';
import { useRanking } from '@/hooks/useStats';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

const steps = [
  {
    icon: UserPlus,
    title: 'Regístrate',
    description: 'Crea tu cuenta en segundos y define tu categoría de juego.',
  },
  {
    icon: Search,
    title: 'Encuentra un partido',
    description: 'Busca partidos disponibles en los clubes de Valdivia o crea el tuyo.',
  },
  {
    icon: Trophy,
    title: '¡A jugar!',
    description: 'Únete al partido, coordina con los jugadores y disfruta del pádel.',
  },
];

const stats = [
  { label: 'Jugadores', value: '50+', icon: Users },
  { label: 'Clubes', value: '3', icon: Building2 },
  { label: 'Partidos', value: '100+', icon: PadelIcon },
];

const positionBadge = (pos: number) => {
  if (pos === 1) return 'bg-amber-400 text-amber-900';
  if (pos === 2) return 'bg-slate-300 text-slate-800';
  if (pos === 3) return 'bg-amber-700 text-amber-100';
  return 'bg-slate-100 text-slate-600';
};

export default function LandingPage() {
  const { data: clubs } = useClubs();
  const { data: ranking } = useRanking(10);
  const featuredClubs = clubs?.slice(0, 3) ?? [];

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-800 to-blue-600">
        {/* Subtle pattern overlay */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              'radial-gradient(circle at 25% 25%, white 1px, transparent 1px), radial-gradient(circle at 75% 75%, white 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8 lg:py-40">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 flex justify-center">
              <PadelIcon className="h-16 w-16 text-amber-500" />
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Encuentra tu partido de pádel en Valdivia
            </h1>
            <p className="mt-6 text-lg text-blue-100 sm:text-xl">
              Conecta con otros jugadores, organiza partidos y disfruta del pádel en los mejores
              clubes de la ciudad. ¡Únete a la comunidad!
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="w-full bg-amber-500 text-lg font-semibold text-slate-900 hover:bg-amber-400 sm:w-auto"
              >
                <Link to="/matches">
                  <Search className="mr-2 h-5 w-5" />
                  Buscar Partidos
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="w-full border-2 border-white bg-transparent text-lg font-semibold text-white hover:bg-white/10 sm:w-auto"
              >
                <Link to="/register">
                  <UserPlus className="mr-2 h-5 w-5" />
                  Registrarse
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Cómo funciona */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-slate-800 sm:text-4xl">¿Cómo funciona?</h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-500">
              En solo tres pasos estarás jugando pádel con nuevos compañeros.
            </p>
          </div>
          <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-3">
            {steps.map((step, index) => (
              <Card
                key={step.title}
                className="relative overflow-hidden border-0 bg-slate-50 shadow-none"
              >
                <CardContent className="flex flex-col items-center p-8 text-center">
                  <div className="mb-1 text-5xl font-black text-blue-100">
                    {index + 1}
                  </div>
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-800">
                    <step.icon className="h-7 w-7 text-amber-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800">{step.title}</h3>
                  <p className="mt-2 text-sm text-slate-500">{step.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Clubes en Valdivia */}
      <section className="bg-slate-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-slate-800 sm:text-4xl">
              Clubes en Valdivia
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-500">
              Juega en los mejores clubes de pádel de la ciudad.
            </p>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featuredClubs.length > 0 ? (
              featuredClubs.map((club) => <ClubCard key={club.id} club={club} />)
            ) : (
              <>
                {[
                  { name: 'Club Pádel Valdivia', address: 'Av. Ramón Picarte 2050' },
                  { name: 'Pádel Sur', address: 'Camino Isla Teja 1200' },
                  { name: 'Centro Deportivo Austral', address: 'Los Robles 500' },
                ].map((club) => (
                  <Card key={club.name} className="overflow-hidden">
                    <div className="flex h-36 items-center justify-center bg-gradient-to-br from-blue-800 to-blue-600">
                      <Building2 className="h-12 w-12 text-blue-200" />
                    </div>
                    <CardContent className="p-4">
                      <h3 className="text-base font-semibold text-slate-800">{club.name}</h3>
                      <p className="mt-1 text-sm text-slate-500">{club.address}, Valdivia</p>
                    </CardContent>
                  </Card>
                ))}
              </>
            )}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-blue-800 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            {stats.map((stat) => (
              <div key={stat.label} className="flex flex-col items-center text-center">
                <stat.icon className="mb-3 h-10 w-10 text-amber-500" />
                <p className="text-4xl font-extrabold text-white">{stat.value}</p>
                <p className="mt-1 text-lg text-blue-200">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Top Jugadores */}
      {ranking && ranking.length > 0 && (
        <section className="bg-white py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-slate-800 sm:text-4xl">
                Top Jugadores
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-500">
                Los jugadores más activos de la comunidad.
              </p>
            </div>
            <div className="mx-auto mt-12 max-w-2xl">
              <div className="overflow-hidden rounded-lg border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-slate-50 text-left text-xs font-medium uppercase text-slate-500">
                      <th className="px-4 py-3 text-center">#</th>
                      <th className="px-4 py-3">Jugador</th>
                      <th className="px-4 py-3 text-center">Categoría</th>
                      <th className="px-4 py-3 text-center">Partidos</th>
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
                                {entry.firstName.charAt(0)}{entry.lastName.charAt(0)}
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
                        <td className="px-4 py-3 text-center font-semibold text-slate-800">
                          {entry.matchesPlayed}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Final CTA */}
      <section className="bg-slate-50 py-20">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-slate-800 sm:text-4xl">
            ¿Listo para jugar?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-slate-500">
            Crea tu cuenta gratis y comienza a disfrutar del pádel con la mejor comunidad
            de Valdivia.
          </p>
          <div className="mt-8">
            <Button
              asChild
              size="lg"
              className="bg-blue-800 text-lg font-semibold hover:bg-blue-700"
            >
              <Link to="/register">
                Crear mi cuenta
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
