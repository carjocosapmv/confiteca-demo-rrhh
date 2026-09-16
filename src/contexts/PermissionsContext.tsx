import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { get, put } from '@/lib/api-client';
import { useAuth, type AppRole } from '@/contexts/AuthContext';

export interface ModulePermission {
  module_key: string;
  can_view: boolean;
  can_edit: boolean;
}

export type PermissionsMap = Record<string, ModulePermission>;
export type AllPermissions = Record<AppRole, PermissionsMap>;

interface PermissionsContextType {
  permissions: AllPermissions;
  myPermissions: PermissionsMap;
  loading: boolean;
  canView: (moduleKey: string) => boolean;
  canEdit: (moduleKey: string) => boolean;
  updatePermission: (role: AppRole, moduleKey: string, field: 'can_view' | 'can_edit', value: boolean) => Promise<void>;
  refreshPermissions: () => Promise<void>;
}

const PermissionsContext = createContext<PermissionsContextType | null>(null);

export const MODULE_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  colaboradores: 'Colaboradores',
  vacaciones: 'Ausencias / Vacaciones',
  vacantes: 'Solicitud de Vacantes',
  onboarding: 'Onboarding (Videos)',
  induccion: 'Inducción por Actividades',
  admin_usuarios: 'Gestión de Usuarios',
  admin_permisos: 'Permisos por Rol',
};

export const MODULE_GROUPS: { label: string; keys: string[] }[] = [
  { label: 'General', keys: ['dashboard'] },
  { label: 'Gestión', keys: ['colaboradores'] },
  { label: 'Ausencias', keys: ['vacaciones'] },
  { label: 'Talento', keys: ['vacantes', 'induccion', 'onboarding'] },
  { label: 'Administración', keys: ['admin_usuarios', 'admin_permisos'] },
];

const ROLES: AppRole[] = ['superadmin', 'admin', 'user', 'viewer'];

function buildPermissionsMap(rows: any[]): AllPermissions {
  const map: AllPermissions = { superadmin: {}, admin: {}, user: {}, viewer: {} };
  for (const row of rows) {
    const role = row.role as AppRole;
    if (!map[role]) map[role] = {};
    map[role][row.module_key] = {
      module_key: row.module_key,
      can_view: row.can_view,
      can_edit: row.can_edit,
    };
  }
  return map;
}

export function PermissionsProvider({ children }: { children: React.ReactNode }) {
  const { role } = useAuth();
  const [permissions, setPermissions] = useState<AllPermissions>({ superadmin: {}, admin: {}, user: {}, viewer: {} });
  const [loading, setLoading] = useState(true);

  const fetchPermissions = useCallback(async () => {
    try {
      const res = await get<any[]>('/api/admin/role-permissions');
      if (res.data) setPermissions(buildPermissionsMap(res.data));
    } catch (err) {
      console.error('Error fetching permissions', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPermissions(); }, [fetchPermissions]);

  const myPermissions = role ? permissions[role] || {} : {};

  const canView = useCallback((moduleKey: string) => {
    if (!role) return false;
    if (role === 'superadmin') return true;
    return myPermissions[moduleKey]?.can_view ?? false;
  }, [role, myPermissions]);

  const canEdit = useCallback((moduleKey: string) => {
    if (!role) return false;
    if (role === 'superadmin') return true;
    return myPermissions[moduleKey]?.can_edit ?? false;
  }, [role, myPermissions]);

  const updatePermission = useCallback(async (targetRole: AppRole, moduleKey: string, field: 'can_view' | 'can_edit', value: boolean) => {
    const updateData: any = { [field]: value };
    if (field === 'can_view' && !value) updateData.can_edit = false;
    if (field === 'can_edit' && value) updateData.can_view = true;

    try {
      await put(`/api/admin/role-permissions/${targetRole}/${moduleKey}`, updateData);
      await fetchPermissions();
    } catch (err) {
      console.error('Error updating permission', err);
    }
  }, [fetchPermissions]);

  return (
    <PermissionsContext.Provider value={{ permissions, myPermissions, loading, canView, canEdit, updatePermission, refreshPermissions: fetchPermissions }}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions() {
  const ctx = useContext(PermissionsContext);
  if (!ctx) throw new Error('usePermissions must be used within PermissionsProvider');
  return ctx;
}
