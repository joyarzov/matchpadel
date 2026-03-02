import { useState } from 'react';
import {
  PlusCircle,
  Pencil,
  Power,
  Loader2,
  Building2,
  MapPin,
  Phone,
  Mail,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { useClubs, useCreateClub, useUpdateClub } from '@/hooks/useClubs';
import type { Club, CreateClubRequest } from '@/types/club.types';

interface ClubFormData {
  name: string;
  address: string;
  city: string;
  region: string;
  phone: string;
  email: string;
}

const emptyForm: ClubFormData = {
  name: '',
  address: '',
  city: 'Valdivia',
  region: 'Los Ríos',
  phone: '',
  email: '',
};

export default function ClubsManagement() {
  const { toast } = useToast();
  const { data: clubs, isLoading } = useClubs();
  const createClub = useCreateClub();
  const updateClub = useUpdateClub();

  const [showFormDialog, setShowFormDialog] = useState(false);
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);
  const [editingClub, setEditingClub] = useState<Club | null>(null);
  const [deactivatingClub, setDeactivatingClub] = useState<Club | null>(null);
  const [formData, setFormData] = useState<ClubFormData>(emptyForm);
  const [saving, setSaving] = useState(false);

  const handleOpenAdd = () => {
    setEditingClub(null);
    setFormData(emptyForm);
    setShowFormDialog(true);
  };

  const handleOpenEdit = (club: Club) => {
    setEditingClub(club);
    setFormData({
      name: club.name,
      address: club.address,
      city: club.city,
      region: club.region,
      phone: club.phone ?? '',
      email: club.email ?? '',
    });
    setShowFormDialog(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.address) {
      toast({ title: 'Error', description: 'Nombre y dirección son obligatorios.', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      if (editingClub) {
        await updateClub.mutateAsync({
          id: editingClub.id,
          data: {
            name: formData.name,
            address: formData.address,
            city: formData.city,
            region: formData.region,
            phone: formData.phone || undefined,
            email: formData.email || undefined,
          },
        });
        toast({ title: 'Club actualizado', description: `${formData.name} ha sido actualizado.` });
      } else {
        await createClub.mutateAsync({
          name: formData.name,
          address: formData.address,
          city: formData.city,
          region: formData.region,
          phone: formData.phone || undefined,
          email: formData.email || undefined,
        } as CreateClubRequest);
        toast({ title: 'Club creado', description: `${formData.name} ha sido agregado.` });
      }
      setShowFormDialog(false);
    } catch {
      toast({ title: 'Error', description: 'No se pudo guardar el club.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async () => {
    if (!deactivatingClub) return;
    try {
      await updateClub.mutateAsync({
        id: deactivatingClub.id,
        data: { isActive: !deactivatingClub.isActive },
      });
      toast({
        title: deactivatingClub.isActive ? 'Club desactivado' : 'Club activado',
        description: `${deactivatingClub.name} ha sido ${deactivatingClub.isActive ? 'desactivado' : 'activado'}.`,
      });
      setShowDeactivateDialog(false);
      setDeactivatingClub(null);
    } catch {
      toast({ title: 'Error', description: 'No se pudo cambiar el estado del club.', variant: 'destructive' });
    }
  };

  if (isLoading) {
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
          <h1 className="text-2xl font-bold text-slate-800">Clubes</h1>
          <p className="mt-1 text-sm text-slate-500">Administra los clubes de pádel.</p>
        </div>
        <Button className="bg-blue-800 hover:bg-blue-700" onClick={handleOpenAdd}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Agregar Club
        </Button>
      </div>

      {/* Clubs Grid */}
      {!clubs || clubs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12 text-center">
            <Building2 className="mb-4 h-12 w-12 text-slate-300" />
            <h3 className="text-lg font-medium text-slate-800">No hay clubes registrados</h3>
            <p className="mt-1 text-sm text-slate-500">Agrega el primer club para comenzar.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs font-medium uppercase text-slate-500">
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Dirección</th>
                <th className="px-4 py-3">Canchas</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {clubs.map((club) => (
                <tr key={club.id} className="border-b last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100">
                        <Building2 className="h-4 w-4 text-blue-800" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">{club.name}</p>
                        {club.phone && (
                          <p className="text-xs text-slate-500">{club.phone}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {club.address}, {club.city}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline">
                      {club.courts.length} {club.courts.length === 1 ? 'cancha' : 'canchas'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    {club.isActive ? (
                      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                        Activo
                      </Badge>
                    ) : (
                      <Badge className="bg-slate-100 text-slate-500 hover:bg-slate-100">
                        Inactivo
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEdit(club)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={club.isActive ? 'text-red-600 hover:text-red-700' : 'text-emerald-600 hover:text-emerald-700'}
                        onClick={() => {
                          setDeactivatingClub(club);
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

      {/* Add/Edit Club Dialog */}
      <Dialog open={showFormDialog} onOpenChange={setShowFormDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingClub ? 'Editar Club' : 'Agregar Club'}</DialogTitle>
            <DialogDescription>
              {editingClub
                ? 'Modifica los datos del club.'
                : 'Completa los datos para registrar un nuevo club.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="club-name">Nombre *</Label>
              <Input
                id="club-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nombre del club"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="club-address">Dirección *</Label>
              <Input
                id="club-address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Dirección completa"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="club-city">Ciudad</Label>
                <Input
                  id="club-city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="club-region">Región</Label>
                <Input
                  id="club-region"
                  value={formData.region}
                  onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="club-phone">Teléfono</Label>
                <Input
                  id="club-phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+56..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="club-email">Email</Label>
                <Input
                  id="club-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="club@email.com"
                />
              </div>
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
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {editingClub ? 'Guardar Cambios' : 'Agregar Club'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deactivate Confirmation Dialog */}
      <Dialog open={showDeactivateDialog} onOpenChange={setShowDeactivateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {deactivatingClub?.isActive ? 'Desactivar Club' : 'Activar Club'}
            </DialogTitle>
            <DialogDescription>
              {deactivatingClub?.isActive
                ? `¿Estás seguro de que deseas desactivar "${deactivatingClub?.name}"? El club no aparecerá en las búsquedas.`
                : `¿Deseas activar "${deactivatingClub?.name}" nuevamente?`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowDeactivateDialog(false)}>
              Cancelar
            </Button>
            <Button
              variant={deactivatingClub?.isActive ? 'destructive' : 'default'}
              onClick={handleDeactivate}
            >
              {deactivatingClub?.isActive ? 'Desactivar' : 'Activar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
