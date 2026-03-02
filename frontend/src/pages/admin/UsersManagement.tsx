import { useState, useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Search,
  Loader2,
  Users,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Power,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { userService } from '@/services/userService';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { User, UserRole } from '@/types/auth.types';

const ITEMS_PER_PAGE = 10;

export default function UsersManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: users, isLoading } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => userService.getUsers(),
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newRole, setNewRole] = useState<UserRole>('USER');

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    if (!searchTerm) return users;
    const term = searchTerm.toLowerCase();
    return users.filter(
      (u) =>
        u.firstName.toLowerCase().includes(term) ||
        u.lastName.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term),
    );
  }, [users, searchTerm]);

  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const paginatedUsers = filteredUsers.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE,
  );

  const handleRoleChange = async () => {
    if (!selectedUser) return;
    try {
      await userService.updateRole(selectedUser.id, newRole);
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast({
        title: 'Rol actualizado',
        description: `${selectedUser.firstName} ahora es ${newRole === 'ADMIN' ? 'Administrador' : 'Usuario'}.`,
      });
      setShowRoleDialog(false);
      setSelectedUser(null);
    } catch {
      toast({ title: 'Error', description: 'No se pudo cambiar el rol.', variant: 'destructive' });
    }
  };

  const handleDeactivate = async () => {
    if (!selectedUser) return;
    try {
      await userService.deleteUser(selectedUser.id);
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast({
        title: 'Usuario desactivado',
        description: `${selectedUser.firstName} ${selectedUser.lastName} ha sido desactivado.`,
      });
      setShowDeactivateDialog(false);
      setSelectedUser(null);
    } catch {
      toast({ title: 'Error', description: 'No se pudo desactivar al usuario.', variant: 'destructive' });
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
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Usuarios</h1>
        <p className="mt-1 text-sm text-slate-500">
          Administra los usuarios de la plataforma ({users?.length ?? 0} registrados).
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          placeholder="Buscar por nombre o email..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setPage(1);
          }}
          className="pl-9"
        />
      </div>

      {/* Users Table */}
      {paginatedUsers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12 text-center">
            <Users className="mb-4 h-12 w-12 text-slate-300" />
            <h3 className="text-lg font-medium text-slate-800">No se encontraron usuarios</h3>
            <p className="mt-1 text-sm text-slate-500">
              {searchTerm
                ? 'Intenta con otro término de búsqueda.'
                : 'No hay usuarios registrados aún.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs font-medium uppercase text-slate-500">
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Teléfono</th>
                <th className="px-4 py-3">Categoría</th>
                <th className="px-4 py-3">Rol</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.map((user) => (
                <tr key={user.id} className="border-b last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800">
                      {user.firstName} {user.lastName}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{user.email}</td>
                  <td className="px-4 py-3 text-slate-600">{user.phone ?? '-'}</td>
                  <td className="px-4 py-3">
                    {user.category ? (
                      <Badge variant="outline" className="text-xs">
                        {user.category}
                      </Badge>
                    ) : (
                      <span className="text-xs text-slate-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      className={
                        user.role === 'ADMIN'
                          ? 'bg-purple-100 text-purple-700 hover:bg-purple-100'
                          : 'bg-blue-100 text-blue-700 hover:bg-blue-100'
                      }
                    >
                      {user.role === 'ADMIN' ? 'Admin' : 'Usuario'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    {user.isActive ? (
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
                        title="Cambiar rol"
                        onClick={() => {
                          setSelectedUser(user);
                          setNewRole(user.role === 'ADMIN' ? 'USER' : 'ADMIN');
                          setShowRoleDialog(true);
                        }}
                      >
                        <ShieldCheck className="h-4 w-4" />
                      </Button>
                      {user.isActive && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          title="Desactivar usuario"
                          onClick={() => {
                            setSelectedUser(user);
                            setShowDeactivateDialog(true);
                          }}
                        >
                          <Power className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Anterior
          </Button>
          <span className="text-sm text-slate-600">
            Página {page} de {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Siguiente
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Role Change Dialog */}
      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cambiar Rol de Usuario</DialogTitle>
            <DialogDescription>
              ¿Deseas cambiar el rol de {selectedUser?.firstName} {selectedUser?.lastName} a{' '}
              <strong>{newRole === 'ADMIN' ? 'Administrador' : 'Usuario'}</strong>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowRoleDialog(false)}>
              Cancelar
            </Button>
            <Button className="bg-blue-800 hover:bg-blue-700" onClick={handleRoleChange}>
              Confirmar Cambio
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deactivate Dialog */}
      <Dialog open={showDeactivateDialog} onOpenChange={setShowDeactivateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Desactivar Usuario</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas desactivar a {selectedUser?.firstName}{' '}
              {selectedUser?.lastName}? El usuario no podrá acceder a la plataforma.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowDeactivateDialog(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeactivate}>
              Desactivar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
