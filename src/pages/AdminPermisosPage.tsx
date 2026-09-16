import React from 'react';
import { useAuth, type AppRole } from '@/contexts/AuthContext';
import { usePermissions, MODULE_LABELS, MODULE_GROUPS } from '@/contexts/PermissionsContext';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Shield, ShieldCheck, User, Eye, Lock } from 'lucide-react';
import { toast } from 'sonner';

const ROLE_META: Record<AppRole, { label: string; icon: typeof Shield; color: string }> = {
  superadmin: { label: 'Super Admin', icon: ShieldCheck, color: 'bg-destructive/10 text-destructive border-destructive/20' },
  admin: { label: 'Admin', icon: Shield, color: 'bg-primary/10 text-primary border-primary/20' },
  user: { label: 'Usuario', icon: User, color: 'bg-accent text-accent-foreground border-border' },
  viewer: { label: 'Viewer', icon: Eye, color: 'bg-muted text-muted-foreground border-border' },
};

const EDITABLE_ROLES: AppRole[] = ['admin', 'user', 'viewer'];

export default function AdminPermisosPage() {
  const { isSuperAdmin } = useAuth();
  const { permissions, updatePermission, loading } = usePermissions();

  if (!isSuperAdmin) {
    return (
      <div className="p-6">
        <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-6 text-center">
          <Lock className="h-8 w-8 text-destructive mx-auto mb-2" />
          <p className="text-destructive font-medium">Acceso denegado</p>
          <p className="text-sm text-muted-foreground mt-1">Solo los Super Administradores pueden gestionar permisos.</p>
        </div>
      </div>
    );
  }

  const handleToggle = async (role: AppRole, moduleKey: string, field: 'can_view' | 'can_edit', value: boolean) => {
    try {
      await updatePermission(role, moduleKey, field, value);
      toast.success('Permiso actualizado');
    } catch {
      toast.error('Error actualizando permiso');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Permisos por Rol</h1>
          <p className="text-sm text-muted-foreground mt-1">Configura qué módulos puede ver y editar cada nivel de usuario</p>
        </div>
        <Badge variant="outline" className="gap-1"><ShieldCheck className="h-3 w-3" /> Super Admin</Badge>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Cargando permisos...</div>
      ) : (
        <div className="bg-card rounded-xl shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-medium min-w-[200px]">Módulo</th>
                  {EDITABLE_ROLES.map(role => {
                    const meta = ROLE_META[role];
                    const Icon = meta.icon;
                    return (
                      <th key={role} className="text-center py-3 px-2 font-medium" colSpan={2}>
                        <div className="flex items-center justify-center gap-1.5">
                          <Icon className="h-3.5 w-3.5" /><span>{meta.label}</span>
                        </div>
                      </th>
                    );
                  })}
                </tr>
                <tr className="border-b border-border bg-muted/30">
                  <th className="py-2 px-4" />
                  {EDITABLE_ROLES.map(role => (
                    <React.Fragment key={role}>
                      <th className="py-2 px-2 text-center text-xs text-muted-foreground font-normal">Ver</th>
                      <th className="py-2 px-2 text-center text-xs text-muted-foreground font-normal">Editar</th>
                    </React.Fragment>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MODULE_GROUPS.map(group => (
                  <React.Fragment key={group.label}>
                    <tr className="bg-muted/50">
                      <td colSpan={1 + EDITABLE_ROLES.length * 2} className="py-2 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        {group.label}
                      </td>
                    </tr>
                    {group.keys.map((moduleKey, i) => (
                      <tr key={moduleKey} className={`hover:bg-accent/30 transition-colors ${i < group.keys.length - 1 ? 'border-b border-border/50' : 'border-b border-border'}`}>
                        <td className="py-3 px-4 font-medium">{MODULE_LABELS[moduleKey] || moduleKey}</td>
                        {EDITABLE_ROLES.map(role => {
                          const perm = permissions[role]?.[moduleKey];
                          return (
                            <React.Fragment key={role}>
                              <td className="py-3 px-2 text-center">
                                <Switch checked={perm?.can_view ?? false} onCheckedChange={v => handleToggle(role, moduleKey, 'can_view', v)} className="mx-auto" />
                              </td>
                              <td className="py-3 px-2 text-center">
                                <Switch checked={perm?.can_edit ?? false} onCheckedChange={v => handleToggle(role, moduleKey, 'can_edit', v)} className="mx-auto" disabled={!(perm?.can_view)} />
                              </td>
                            </React.Fragment>
                          );
                        })}
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4 bg-muted/30 border-t border-border">
            <p className="text-xs text-muted-foreground">
              <strong>Super Admin</strong> siempre tiene acceso completo a todos los módulos. Al desactivar "Ver", "Editar" se desactiva automáticamente.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
