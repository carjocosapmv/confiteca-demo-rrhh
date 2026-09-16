import { usePermissions } from '@/contexts/PermissionsContext';
import { ShieldAlert } from 'lucide-react';

interface ProtectedModuleProps {
  moduleKey: string;
  children: React.ReactNode;
  requireEdit?: boolean;
  requireIncome?: boolean;
}

export function ProtectedModule({ moduleKey, children, requireEdit = false }: ProtectedModuleProps) {
  const { canView, canEdit, loading } = usePermissions();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-pulse text-muted-foreground text-sm">Verificando permisos...</div>
      </div>
    );
  }

  if (!canView(moduleKey) || (requireEdit && !canEdit(moduleKey))) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center space-y-3 max-w-md">
          <ShieldAlert className="h-10 w-10 text-destructive mx-auto" />
          <p className="text-lg font-semibold">Acceso denegado</p>
          <p className="text-sm text-muted-foreground">
            No tienes permisos para acceder a este módulo. Contacta al administrador si necesitas acceso.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
