import { useEffect, useState } from 'react';
import { useAuth, type AppRole } from '@/contexts/AuthContext';
import { usePuestos } from '@/hooks/use-puestos';

import { get, post, put, del } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Shield, ShieldCheck, User, Eye, Plus, Trash2, Building2, UserPlus, DollarSign, EyeOff } from 'lucide-react';

interface UserProfile {
  id: string;
  email: string;
  display_name: string | null;
  is_financial_admin: boolean;
  security_watermark_enabled: boolean;
  roles: AppRole[];
  units: string[];
}

interface BusinessUnit {
  id: string;
  nombre: string;
}

const ROLE_CONFIG: Record<AppRole, { label: string; icon: typeof Shield; color: string }> = {
  superadmin: { label: 'Super Admin', icon: ShieldCheck, color: 'bg-destructive text-destructive-foreground' },
  admin: { label: 'Admin', icon: Shield, color: 'bg-primary text-primary-foreground' },
  user: { label: 'Usuario', icon: User, color: 'bg-secondary text-secondary-foreground' },
  viewer: { label: 'Viewer', icon: Eye, color: 'bg-muted text-muted-foreground' },
};

export default function AdminUsuariosPage() {
  const { isSuperAdmin, isAdmin, user: currentUser } = useAuth();
  const { puestos } = usePuestos();
  
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [unidades, setUnidades] = useState<BusinessUnit[]>([]);

  // New user form
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newRole, setNewRole] = useState<AppRole>('user');
  const [newPuestoId, setNewPuestoId] = useState<string>('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const [profilesRes, rolesRes, unitsRes] = await Promise.all([
        get<any[]>('/api/admin/users'),
        get<any[]>('/api/admin/user-roles'),
        get<any[]>('/api/admin/user-unit-assignments'),
      ]);
      const profiles = profilesRes.data || [];
      const allRoles = rolesRes.data || [];
      const allUnits = unitsRes.data || [];

      const enriched: UserProfile[] = profiles.map((p: any) => ({
        ...p,
        roles: allRoles.filter((r: any) => r.user_id === p.id).map((r: any) => r.role as AppRole),
        units: allUnits.filter((u: any) => u.user_id === p.id).map((u: any) => u.unidad_negocio_id),
      }));
      setUsers(enriched);
    } catch (err: any) {
      toast.error('Error cargando usuarios: ' + err.message);
    }
    setLoading(false);
  };

  const fetchUnidades = async () => {
    try {
      const res = await get<BusinessUnit[]>('/api/business-units');
      setUnidades(res.data || []);
    } catch {
      // unidades not available, ignore
    }
  };

  useEffect(() => { fetchUsers(); fetchUnidades(); }, []);

  const createUser = async () => {
    if (!newEmail || !newPassword) { toast.error('Email y contraseña son obligatorios'); return; }
    if (newPassword.length < 6) { toast.error('La contraseña debe tener al menos 6 caracteres'); return; }
    if (!newPuestoId) { toast.error('Debes seleccionar un puesto'); return; }
    setCreating(true);
    try {
      await post('/api/admin/users', {
        email: newEmail, password: newPassword,
        display_name: newDisplayName || newEmail.split('@')[0],
        role: newRole, puesto_id: newPuestoId,
      });
      toast.success(`Usuario ${newEmail} creado exitosamente`);
      setDialogOpen(false);
      setNewEmail(''); setNewPassword(''); setNewDisplayName(''); setNewRole('user'); setNewPuestoId('');
      fetchUsers();
    } catch (err: any) {
      toast.error('Error creando usuario: ' + err.message);
    }
    setCreating(false);
  };

  const assignRole = async (userId: string, role: AppRole) => {
    try {
      await post(`/api/admin/users/${userId}/change-role`, { role });
      toast.success('Rol actualizado');
      fetchUsers();
    } catch (err: any) {
      toast.error('Error asignando rol: ' + err.message);
    }
  };

  const toggleFinancialAdmin = async (userId: string, value: boolean) => {
    try {
      await put(`/api/admin/users/${userId}/financial-admin`, { is_financial_admin: value });
      toast.success(value ? 'Admin financiero asignado' : 'Admin financiero removido');
      fetchUsers();
    } catch (err: any) {
      toast.error('Error: ' + err.message);
    }
  };

  const toggleSecurityWatermark = async (userId: string, value: boolean) => {
    try {
      await put(`/api/admin/users/${userId}/security-watermark`, { security_watermark_enabled: value });
      toast.success(value ? 'Seguridad activada' : 'Seguridad desactivada');
      fetchUsers();
    } catch (err: any) {
      toast.error('Error: ' + err.message);
    }
  };

  const assignUnit = async (userId: string, unidadId: string) => {
    try {
      const currentUnits = users.find(u => u.id === userId)?.units || [];
      await post(`/api/admin/users/${userId}/assign-units`, { units: [...currentUnits, unidadId] });
      toast.success('Unidad asignada');
      fetchUsers();
    } catch (err: any) {
      if (err?.status === 409) { toast.info('Ya está asignado a esa unidad'); return; }
      toast.error('Error: ' + err.message);
    }
  };

  const removeUnit = async (userId: string, unidadId: string) => {
    try {
      await del(`/api/admin/users/${userId}/units/${unidadId}`);
      toast.success('Unidad removida');
      fetchUsers();
    } catch (err: any) {
      toast.error('Error: ' + err.message);
    }
  };

  if (!isSuperAdmin && !isAdmin) {
    return (
      <div className="p-6">
        <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-6 text-center">
          <Shield className="h-8 w-8 text-destructive mx-auto mb-2" />
          <p className="text-destructive font-medium">Acceso denegado</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Gestión de Usuarios</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <UserPlus className="h-4 w-4" /> Crear Usuario
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Crear nuevo usuario</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input id="email" type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="usuario@empresa.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña *</Label>
                <Input id="password" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Mínimo 6 caracteres" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="displayName">Nombre</Label>
                <Input id="displayName" value={newDisplayName} onChange={e => setNewDisplayName(e.target.value)} placeholder="Nombre completo" />
              </div>
              <div className="space-y-2">
                <Label>Rol</Label>
                <Select value={newRole} onValueChange={v => setNewRole(v as AppRole)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {isSuperAdmin && <SelectItem value="superadmin">Super Admin</SelectItem>}
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="user">Usuario</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Puesto *</Label>
                <Select value={newPuestoId} onValueChange={setNewPuestoId}>
                  <SelectTrigger><SelectValue placeholder="Selecciona un puesto" /></SelectTrigger>
                  <SelectContent>
                    {puestos.filter(p => p.activo).map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {puestos.length === 0 && (
                  <p className="text-xs text-muted-foreground">No hay puestos creados.</p>
                )}
              </div>
              <Button onClick={createUser} disabled={creating} className="w-full">
                {creating ? 'Creando...' : 'Crear Usuario'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card rounded-xl shadow-card overflow-hidden">
        {loading ? (
          <div className="p-6 text-sm text-muted-foreground">Cargando usuarios...</div>
        ) : users.length === 0 ? (
          <div className="p-6 text-sm text-muted-foreground">No hay usuarios registrados.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-medium">Usuario</th>
                  <th className="text-left py-3 px-4 font-medium">Rol</th>
                  <th className="text-center py-3 px-4 font-medium">Admin Financiero</th>
                  <th className="text-center py-3 px-4 font-medium">Seguridad</th>
                  <th className="text-left py-3 px-4 font-medium">Unidades</th>
                  <th className="text-left py-3 px-4 font-medium">Asignar Unidad</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => {
                  const currentRole = u.roles[0] || null;
                  return (
                    <tr key={u.id} className={`hover:bg-accent/50 transition-colors ${i < users.length - 1 ? 'border-b border-border' : ''}`}>
                      <td className="py-3 px-4">
                        <p className="font-medium">{u.display_name || u.email}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </td>
                      <td className="py-3 px-4">
                        <Select value={currentRole || ''} onValueChange={v => assignRole(u.id, v as AppRole)}>
                          <SelectTrigger className="w-[130px] h-8 text-xs"><SelectValue placeholder="Sin rol" /></SelectTrigger>
                          <SelectContent>
                            {isSuperAdmin && <SelectItem value="superadmin">Super Admin</SelectItem>}
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="user">Usuario</SelectItem>
                            <SelectItem value="viewer">Viewer</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Switch
                            checked={u.is_financial_admin}
                            onCheckedChange={v => toggleFinancialAdmin(u.id, v)}
                            disabled={!isSuperAdmin}
                          />
                          {u.is_financial_admin && (
                            <Badge variant="default" className="text-[10px] gap-1">
                              <DollarSign className="h-3 w-3" /> Financiero
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Switch
                            checked={u.security_watermark_enabled}
                            onCheckedChange={v => toggleSecurityWatermark(u.id, v)}
                            disabled={!isSuperAdmin}
                          />
                          {u.security_watermark_enabled && (
                            <Badge variant="outline" className="text-[10px] gap-1">
                              <Shield className="h-3 w-3" /> Activa
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {u.units.length === 0 && <span className="text-xs text-muted-foreground italic">Ninguno</span>}
                          {u.units.map(unitId => {
                            const unidad = unidades.find(un => un.id === unitId);
                            return (
                              <Badge key={unitId} variant="secondary" className="gap-1 text-xs">
                                <Building2 className="h-3 w-3" />
                                {unidad?.nombre || unitId}
                                <button onClick={() => removeUnit(u.id, unitId)} className="ml-1 hover:text-destructive">
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </Badge>
                            );
                          })}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Select onValueChange={v => assignUnit(u.id, v)}>
                          <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue placeholder="Agregar..." /></SelectTrigger>
                          <SelectContent>
                            {unidades.filter(un => !u.units.includes(un.id)).map(un => (
                              <SelectItem key={un.id} value={un.id}>{un.nombre}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
