import { useState } from 'react';
import { Loader2, CalendarSearch, Search } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { AvailabilityGrid } from '@/components/availability/AvailabilityGrid';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAvailability, useCities } from '@/hooks/useAvailability';

function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function AvailabilityPage() {
  const { data: cities, isLoading: citiesLoading } = useCities();

  const [selectedCity, setSelectedCity] = useState('Valdivia');
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [queryCity, setQueryCity] = useState('');
  const [queryDate, setQueryDate] = useState('');

  const { data: centers, isLoading, isFetching } = useAvailability(queryCity, queryDate);

  const handleSearch = () => {
    if (selectedCity && selectedDate) {
      setQueryCity(selectedCity);
      setQueryDate(selectedDate);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-800 sm:text-3xl">
              <CalendarSearch className="h-7 w-7 text-blue-800" />
              Disponibilidad de Canchas
            </h1>
            <p className="mt-1 text-slate-500">
              Consulta la disponibilidad en tiempo real de los centros de pádel.
            </p>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-end">
              <div className="flex-1">
                <label className="mb-1 block text-sm font-medium text-slate-700">Ciudad</label>
                {citiesLoading ? (
                  <div className="flex h-10 items-center">
                    <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                  </div>
                ) : (
                  <Select value={selectedCity} onValueChange={setSelectedCity}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar ciudad" />
                    </SelectTrigger>
                    <SelectContent>
                      {(cities ?? []).map((city) => (
                        <SelectItem key={city} value={city}>
                          {city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="flex-1">
                <label className="mb-1 block text-sm font-medium text-slate-700">Fecha</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                />
              </div>

              <Button
                className="bg-blue-800 hover:bg-blue-700"
                onClick={handleSearch}
                disabled={!selectedCity || !selectedDate || isFetching}
              >
                {isFetching ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Search className="mr-2 h-4 w-4" />
                )}
                Buscar
              </Button>
            </CardContent>
          </Card>

          {/* Results */}
          {isLoading || isFetching ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-blue-800" />
              <p className="mt-3 text-sm text-slate-500">Consultando disponibilidad...</p>
            </div>
          ) : centers && centers.length > 0 ? (
            <div className="space-y-4">
              {centers.map((center) => (
                <AvailabilityGrid key={center.clubId} center={center} />
              ))}
            </div>
          ) : queryCity && queryDate ? (
            <Card>
              <CardContent className="flex flex-col items-center py-12 text-center">
                <CalendarSearch className="mb-4 h-12 w-12 text-slate-300" />
                <h3 className="text-lg font-medium text-slate-800">
                  No se encontraron centros con disponibilidad
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  No hay centros MatchPoint activos en {queryCity}.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center py-12 text-center">
                <CalendarSearch className="mb-4 h-12 w-12 text-slate-300" />
                <h3 className="text-lg font-medium text-slate-800">
                  Selecciona ciudad y fecha
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Elige una ciudad y una fecha para ver la disponibilidad de canchas.
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
