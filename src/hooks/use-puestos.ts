import { useCallback, useEffect, useState } from 'react';
import { get, post, put, del } from '@/lib/api-client';

export interface Puesto {
  id: string;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export function usePuestos() {
  const [puestos, setPuestos] = useState<Puesto[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await get<Puesto[]>('/api/puestos', { per_page: 1000, sort_by: 'nombre', sort_direction: 'asc' });
      setPuestos(res.data || []);
    } catch (err) {
      console.error('Error loading puestos', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const create = useCallback(async (nombre: string, descripcion?: string) => {
    await post('/api/puestos', { nombre, descripcion: descripcion || null, activo: true });
    await refresh();
  }, [refresh]);

  const update = useCallback(async (id: string, patch: Partial<Puesto>) => {
    await put(`/api/puestos/${id}`, patch);
    await refresh();
  }, [refresh]);

  const remove = useCallback(async (id: string) => {
    await del(`/api/puestos/${id}`);
    await refresh();
  }, [refresh]);

  return { puestos, loading, refresh, create, update, remove };
}
