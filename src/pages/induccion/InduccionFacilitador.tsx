import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { get, put } from '@/lib/api-client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, CheckCircle2, Clock, AlertTriangle, XCircle, Users, Building2, UserCheck } from 'lucide-react';

interface Activity {
  id: string; dia: number; area_competencia: string; contenido: string;
  fecha: string; lugar: string; horario: string; facilitador: string;
  status: string; observaciones: string | null;
}

interface ColaboradorData {
  colaborador: { id: string; display_name: string; email: string };
  empresa: string; area: string; fecha_ingreso: string;
  progreso: number; actividades: Activity[];
}

const statusOptions = [
  { value: 'finalizado', label: 'Finalizado', icon: CheckCircle2 },
  { value: 'en_curso', label: 'En Curso', icon: Clock },
  { value: 'aplazado', label: 'Aplazado', icon: AlertTriangle },
  { value: 'cancelado', label: 'Cancelado', icon: XCircle },
];

const statusColors: Record<string, string> = {
  finalizado: 'bg-green-100 text-green-700', en_curso: 'bg-blue-100 text-blue-700',
  aplazado: 'bg-amber-100 text-amber-700', cancelado: 'bg-red-100 text-red-700',
  pendiente: 'bg-gray-100 text-gray-500',
};

export default function InduccionFacilitador() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [editActivity, setEditActivity] = useState<{ open: boolean; activity: Activity | null }>({ open: false, activity: null });
  const [newStatus, setNewStatus] = useState('');
  const [newObs, setNewObs] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['induccion-facilitador'],
    queryFn: async () => {
      const res = await get<{ data: ColaboradorData[] }>('/api/induccion/facilitador/colaboradores');
      return res.data?.data || [];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status, observaciones }: { id: string; status: string; observaciones: string }) => {
      await put(`/api/induccion/actividades/${id}`, { status, observaciones });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['induccion-facilitador'] });
      toast({ title: 'Actividad actualizada' });
      setEditActivity({ open: false, activity: null });
      setNewStatus('');
      setNewObs('');
    },
    onError: (err: any) => toast({ title: 'Error', description: err?.response?.data?.message || err.message, variant: 'destructive' }),
  });

  const openEdit = (act: Activity) => {
    setNewStatus(act.status);
    setNewObs(act.observaciones || '');
    setEditActivity({ open: true, activity: act });
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (!data || data.length === 0) {
    return (
      <div className="space-y-6">
        <div><h1 className="text-2xl font-bold">Mis Colaboradores en Inducción</h1><p className="text-muted-foreground">No tenés colaboradores asignados como facilitador.</p></div>
        <Card><CardContent className="py-8 text-center text-muted-foreground">Cuando te asignen actividades de inducción, aparecerán aquí.</CardContent></Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mis Colaboradores en Inducción</h1>
        <p className="text-muted-foreground">{data.length} colaborador(es) asignado(s) como facilitador</p>
      </div>

      <Tabs defaultValue={data[0]?.colaborador?.id}>
        <TabsList className="flex-wrap">
          {data.map(c => (
            <TabsTrigger key={c.colaborador.id} value={c.colaborador.id} className="gap-2">
              <UserCheck className="h-4 w-4" /> {c.colaborador.display_name}
              <Badge variant="outline" className="ml-1">{c.progreso}%</Badge>
            </TabsTrigger>
          ))}
        </TabsList>

        {data.map(c => (
          <TabsContent key={c.colaborador.id} value={c.colaborador.id} className="space-y-4 mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Empresa</CardTitle></CardHeader>
                <CardContent><p className="font-medium">{c.empresa}</p></CardContent>
              </Card>
              <Card><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Área</CardTitle></CardHeader>
                <CardContent><p className="font-medium">{c.area}</p></CardContent>
              </Card>
              <Card><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Progreso</CardTitle></CardHeader>
                <CardContent><p className="font-medium">{c.progreso}%</p></CardContent>
              </Card>
            </div>

            <div className="space-y-3">
              {c.actividades.map(act => (
                <div key={act.id} className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-lg border p-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge className={statusColors[act.status]}>{act.status.replace('_', ' ')}</Badge>
                      <span className="font-medium">{act.contenido}</span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mt-1">
                      <span>Día {act.dia}</span>
                      <span>{act.area_competencia}</span>
                      <span>{new Date(act.fecha).toLocaleDateString('es-AR')}</span>
                      <span>{act.horario}</span>
                      <span>{act.lugar}</span>
                    </div>
                    {act.observaciones && <p className="text-xs text-muted-foreground italic mt-1">Obs: {act.observaciones}</p>}
                  </div>
                  <Button variant="outline" size="sm" onClick={() => openEdit(act)}>
                    Actualizar
                  </Button>
                </div>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      <Dialog open={editActivity.open} onOpenChange={o => { if (!o) setEditActivity({ open: false, activity: null }); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Actualizar Actividad</DialogTitle></DialogHeader>
          {editActivity.activity && (
            <div className="space-y-4">
              <p className="font-medium">{editActivity.activity.contenido}</p>
              <div>
                <Label>Estado</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {statusOptions.map(s => (
                      <SelectItem key={s.value} value={s.value}>
                        <div className="flex items-center gap-2">
                          <s.icon className="h-4 w-4" /> {s.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Observaciones</Label>
                <Textarea value={newObs} onChange={e => setNewObs(e.target.value)} rows={3} placeholder="Comentarios presenciales..." />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditActivity({ open: false, activity: null })}>Cancelar</Button>
                <Button onClick={() => updateMutation.mutate({ id: editActivity.activity!.id, status: newStatus, observaciones: newObs })} disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                  Guardar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
