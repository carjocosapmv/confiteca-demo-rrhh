import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';

interface ClearCacheButtonProps {
  collapsed?: boolean;
}

/**
 * Button available to ALL users that wipes local caches in real-time:
 * - localStorage (preserves Supabase auth session)
 * - sessionStorage
 * - Browser Cache Storage (Service Worker / PWA caches)
 * - Service Worker registrations
 * Then reloads the app to refetch fresh data from the backend.
 */
export function ClearCacheButton({ collapsed = false }: ClearCacheButtonProps) {
  const [clearing, setClearing] = useState(false);

  const handleClear = async () => {
    setClearing(true);
    try {
      // 1. Wipe localStorage
      localStorage.clear();

      // 2. Wipe sessionStorage
      sessionStorage.clear();

      // 3. Wipe browser Cache Storage (PWA / SW caches)
      if ('caches' in window) {
        const names = await caches.keys();
        await Promise.all(names.map((n) => caches.delete(n)));
      }

      // 4. Unregister service workers
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
      }

      toast({
        title: 'Caché limpiada',
        description: 'Recargando la aplicación con datos actualizados...',
      });

      // 5. Hard reload bypassing browser cache
      setTimeout(() => {
        window.location.reload();
      }, 600);
    } catch (err) {
      console.error('Error clearing cache:', err);
      toast({
        title: 'Error al limpiar caché',
        description: err instanceof Error ? err.message : 'Intenta nuevamente',
        variant: 'destructive',
      });
      setClearing(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size={collapsed ? 'icon' : 'sm'}
          className="w-full text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent/50"
          disabled={clearing}
          title="Limpiar caché y recargar"
        >
          <RefreshCw className={`h-4 w-4 shrink-0 ${clearing ? 'animate-spin' : ''}`} />
          {!collapsed && <span className="ml-2">Limpiar caché</span>}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Limpiar caché de la aplicación?</AlertDialogTitle>
          <AlertDialogDescription>
            Esto borrará los datos temporales guardados en tu navegador y recargará la aplicación
            con la información más reciente del servidor. Tu sesión se mantendrá activa.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleClear} disabled={clearing}>
            {clearing ? 'Limpiando...' : 'Limpiar y recargar'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
