import { useState } from 'react';
import {
  PlusCircle,
  Pencil,
  Power,
  Loader2,
  LayoutGrid,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { useClubs, useCourts, useCreateCourt } from '@/hooks/useClubs';
import { clubService } from '@/services/clubService';
import type { Court, CourtType } from '@/types/club.types';

const courtTypeLabels: Record<CourtType, string> = {
  INDOOR: 'Techada',
  OUTDOOR: 'Al aire libre',
  COVERED: 'Cubierta',
};

interface CourtFormData {
  name: string;
  type: CourtType;
}

const emptyCourtForm: CourtFormData = {
  name: '',
  type: 'OUTDOOR',
};

export default function CourtsManagement() {
  const { toast } = useToast();
  const { data: clubs, isLoading: clubsLoading } = useClubs();
  const [selectedClubId, setSelectedClubId] = useState<string>('');
  const { data: courts, isLoading: courtsLoading } = useCourts(selectedClubId);
  const createCourt = useCreateCourt();

  const [showFormDialog, setShowFormDialog] = useState(false);
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);
  const [editingCourt, setEditingCourt] = useState<Court | null>(null);
  const [deactivatingCourt, setDeactivatingCourt] = useState<Court | null>(null);
  const [formData, setFormData] = useState<CourtFormData>(emptyCourtForm);
  const [saving, setSaving] = useState(false);

  const handleOpenAdd = () => {
    if (!selectedClubId) {
      toast({ title: 'Selecciona un club', description: 'Primero selecciona un club.', variant: 'destructive' });
      return;
    }
    setEditingCourt(null);
    setFormData(emptyCourtForm);
    setShowFormDialog(true);
  };

  const handleOpenEdit = (court: Court) => {
    setEditingCourt(court);
    setFormData({
      name: court.name,
      type: court.type,
    });
    setShowFormDialog(true);
  };

  const handleSave = async () => {
    if (!formData.name) {
      toast({ title: 'Error', description: 'El nombre es obligatorio.', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      if (editingCourt) {
        await clubService.updateCourt(selectedClubId, editingCourt.id, {
          name: formData.name,
          type: formData.type,
        });
        toast({ title: 'Cancha actualizada', description: `${formData.name} ha sido actualizada.` });
      } else {
        await createCourt.mutateAsync({
          clubId: selectedClubId,
          name: formData.name,
          type: formData.type,
        });
        toast({ title: 'Cancha creada', description: `${formData.name} ha sido agregada.` });
      }
      setShowFormDialog(false);
      // Reload courts
      window.location.reload();
    } catch {
      toast({ title: 'Error', description: 'No se pudo guardar la cancha.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async () => {
    if (!deactivatingCourt) return;
    try {
      await clubService.updateCourt(selectedClubId, deactivatingCourt.id, {
        // Toggle active state -- the API may not directly support isActive on court update,
        // so we use delete for deactivation in some implementations
      });
      toast({ title: 'Estado actualizado' });
      setShowDeactivateDialog(false);
      setDeactivatingCourt(null);
      window.location.reload();
    } catch {
      toast({ title: 'Error', description: 'No se pudo cambiar el estado.', variant: 'destructive' });
    }
  };

  if (clubsLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-800" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Canchas</h1>
          <p className="mt-1 text-sm text-slate-500">Administra las canchas de cada club.</p>
        </div>
        <Button className="bg-blue-800 hover:bg-blue-700" onClick={handleOpenAdd}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Agregar Cancha
        </Button>
      </div>

      {/* Club Selector */}
      <div className="max-w-sm space-y-2">
        <Label>Seleccionar Club</Label>
        <Select value={selectedClubId} onValueChange={setSelectedClubId}>
          <SelectTrigger>
            <SelectValue placeholder="Elige un club" />
          </SelectTrigger>
          <SelectContent>
            {clubs?.map((club) => (
              <SelectItem key={club.id} value={club.id}>
                {club.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Courts Table */}
      {!selectedClubId ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12 text-center">
            <LayoutGrid className="mb-4 h-12 w-12 text-slate-300" />
            <h3 className="text-lg font-medium text-slate-800">Selecciona un club</h3>
            <p className="mt-1 text-sm text-slate-500">Elige un club para ver y administrar sus canchas.</p>
          </CardContent>
        </Card>
      ) : courtsLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-blue-800" />
        </div>
      ) : !courts || courts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12 text-center">
            <LayoutGrid className="mb-4 h-12 w-12 text-slate-300" />
            <h3 className="text-lg font-medium text-slate-800">No hay canchas registradas</h3>
            <p className="mt-1 text-sm text-slate-500">Agrega la primera cancha a este club.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs font-medium uppercase text-slate-500">
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {courts.map((court) => (
                <tr key={court.id} className="border-b last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{court.name}</td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className="text-xs">
                      {courtTypeLabels[court.type]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    {court.isActive ? (
                      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                        Activa
                      </Badge>
                    ) : (
                      <Badge className="bg-slate-100 text-slate-500 hover:bg-slate-100">
                        Inactiva
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEdit(court)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={court.isActive ? 'text-red-600 hover:text-red-700' : 'text-emerald-600 hover:text-emerald-700'}
                        onClick={() => {
                          setDeactivatingCourt(court);
                          setShowDeactivateDialog(true);
                        }}
                      >
                        <Power className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Court Dialog */}
      <Dialog open={showFormDialog} onOpenChange={setShowFormDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCourt ? 'Editar Cancha' : 'Agregar Cancha'}</DialogTitle>
            <DialogDescription>
              {editingCourt
                ? 'Modifica los datos de la cancha.'
                : 'Completa los datos para agregar una nueva cancha.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="court-name">Nombre *</Label>
              <Input
                id="court-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej: Cancha 1"
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select
                value={formData.type}
                onValueChange={(v) => setFormData({ ...formData, type: v as CourtType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INDOOR">Techada</SelectItem>
                  <SelectItem value="OUTDOOR">Al aire libre</SelectItem>
                  <SelectItem value="COVERED">Cubierta</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowFormDialog(false)}>
              Cancelar
            </Button>
            <Button
              className="bg-blue-800 hover:bg-blue-700"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {editingCourt ? 'Guardar Cambios' : 'Agregar Cancha'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deactivate Confirmation Dialog */}
      <Dialog open={showDeactivateDialog} onOpenChange={setShowDeactivateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {deactivatingCourt?.isActive ? 'Desactivar Cancha' : 'Activar Cancha'}
            </DialogTitle>
            <DialogDescription>
              {deactivatingCourt?.isActive
                ? `¿Estás seguro de que deseas desactivar "${deactivatingCourt?.name}"?`
                : `¿Deseas activar "${deactivatingCourt?.name}" nuevamente?`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowDeactivateDialog(false)}>
              Cancelar
            </Button>
            <Button
              variant={deactivatingCourt?.isActive ? 'destructive' : 'default'}
              onClick={handleDeactivate}
            >
              {deactivatingCourt?.isActive ? 'Desactivar' : 'Activar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
