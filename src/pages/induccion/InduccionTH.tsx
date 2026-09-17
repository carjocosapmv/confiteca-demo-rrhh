import { useState } from 'react';
import { get, post } from '@/lib/api-client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Loader2, Plus, Eye, AlertTriangle, Clock, CheckCircle2, UserPlus, Building2, Users, Calendar, MapPin, User } from 'lucide-react';

interface ColaboradorResumen {
  id: string; empresa: string; area: string; fecha_ingreso: string;
  progreso: number; total_actividades: number; completadas: number;
  dias_sin_avance: number; alerta_estancado: boolean;
  ultima_actividad: string | null; ultima_fecha: string | null;
  colaborador: { id: string; display_name: string; email: string };
}

interface Activity {
  id: string; dia: number; area_competencia: string; contenido: string;
  fecha: string; lugar: string; horario: string; facilitador: string;
  status: string; observaciones: string | null;
}

interface ProgramDetalle {
  id: string; empresa: string; area: string; fecha_ingreso: string;
  progreso: number; total_actividades: number; completadas: number;
  completed_at: string | null; survey_rating: string | null;
  survey_feedback: string | null;
  user: { id: string; display_name: string; email: string };
  activities: Activity[];
}

const statusColors: Record<string, string> = {
  finalizado: 'bg-green-100 text-green-700', en_curso: 'bg-blue-100 text-blue-700',
  aplazado: 'bg-amber-100 text-amber-700', cancelado: 'bg-red-100 text-red-700',
  pendiente: 'bg-gray-100 text-gray-500',
};

export default function InduccionTH() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [detailItem, setDetailItem] = useState<ProgramDetalle | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [newProgram, setNewProgram] = useState({
    user_id: '', empresa: '', area: '', fecha_ingreso: '',
  });
  const [newActivities, setNewActivities] = useState<{ dia: number; area_competencia: string; contenido: string; fecha: string; lugar: string; horario: string; facilitador: string }[]>([]);

  const { data: resumen } = useQuery({
    queryKey: ['induccion-resumen'],
    queryFn: async () => {
      const res = await get<{ data: any }>('/api/induccion/th/resumen');
      return res.data?.data;
    },
  });

  const { data: colaboradores, isLoading } = useQuery({
    queryKey: ['induccion-th'],
    queryFn: async () => {
      const res = await get<{ data: ColaboradorResumen[] }>('/api/induccion/th');
      return res.data?.data || [];
    },
  });

  const { data: empresas } = useQuery({
    queryKey: ['induccion-empresas'],
    queryFn: async () => {
      const res = await get<{ data: string[] }>('/api/induccion/th/catalogos/empresas');
      return res.data?.data || [];
    },
  });

  const { data: areas } = useQuery({
    queryKey: ['induccion-areas'],
    queryFn: async () => {
      const res = await get<{ data: string[] }>('/api/induccion/th/catalogos/areas');
      return res.data?.data || [];
    },
  });

  const { data: facilitadores } = useQuery({
    queryKey: ['induccion-facilitadores'],
    queryFn: async () => {
      const res = await get<{ data: string[] }>('/api/induccion/th/catalogos/facilitadores');
      return res.data?.data || [];
    },
  });

  const { data: allUsers } = useQuery({
    queryKey: ['all-users'],
    queryFn: async () => {
      const res = await get<{ data: any[] }>('/api/admin/users');
      return res.data?.data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      await post('/api/induccion/th/programas', {
        ...newProgram,
        actividades: newActivities,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['induccion-th'] });
      queryClient.invalidateQueries({ queryKey: ['induccion-resumen'] });
      toast({ title: 'Programa creado' });
      setCreateOpen(false);
      setNewProgram({ user_id: '', empresa: '', area: '', fecha_ingreso: '' });
      setNewActivities([]);
    },
    onError: (err: any) => toast({ title: 'Error', description: err?.response?.data?.message || err.message, variant: 'destructive' }),
  });

  const addActivity = () => {
    if (!newProgram.fecha_ingreso) return;
    const nextDay = newActivities.length > 0 ? newActivities[newActivities.length - 1].dia : 1;
    setNewActivities([...newActivities, {
      dia: nextDay, area_competencia: '', contenido: '', fecha: newProgram.fecha_ingreso,
      lugar: '', horario: '8:00 - 10:00', facilitador: '',
    }]);
  };

  const updAct = (i: number, field: string, value: any) => {
    const updated = [...newActivities];
    (updated[i] as any)[field] = value;
    setNewActivities(updated);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gestión de Inducciones</h1>
          <p className="text-muted-foreground">Panel de Talento Humano</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-1" /> Nuevo Programa</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl max-h-[90vh]">
            <DialogHeader><DialogTitle>Asignar Programa de Inducción</DialogTitle></DialogHeader>
            <ScrollArea className="max-h-[70vh] pr-4">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Colaborador</Label>
                    <Select value={newProgram.user_id} onValueChange={v => setNewProgram(p => ({ ...p, user_id: v }))}>
                      <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                      <SelectContent>
                        {allUsers.map((u: any) => <SelectItem key={u.id} value={u.id}>{u.display_name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Empresa</Label>
                    <Select value={newProgram.empresa} onValueChange={v => setNewProgram(p => ({ ...p, empresa: v }))}>
                      <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                      <SelectContent>
                        {(empresas || []).map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Área</Label>
                    <Select value={newProgram.area} onValueChange={v => setNewProgram(p => ({ ...p, area: v }))}>
                      <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                      <SelectContent>
                        {(areas || []).map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Fecha de ingreso</Label>
                    <Input type="date" value={newProgram.fecha_ingreso} onChange={e => setNewProgram(p => ({ ...p, fecha_ingreso: e.target.value }))} />
                  </div>
                </div>

                <Separator />
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Actividades</Label>
                  <Button variant="outline" size="sm" onClick={addActivity}><Plus className="h-3 w-3 mr-1" /> Agregar</Button>
                </div>

                {newActivities.map((act, i) => (
                  <div key={i} className="border rounded-lg p-3 space-y-3">
                    <p className="text-sm font-medium">Actividad {i + 1} — Día {act.dia}</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label>Día</Label><Input type="number" min="1" value={act.dia} onChange={e => updAct(i, 'dia', parseInt(e.target.value) || 1)} /></div>
                      <div><Label>Área/Competencia</Label>
                        <Select value={act.area_competencia} onValueChange={v => updAct(i, 'area_competencia', v)}>
                          <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                          <SelectContent>
                            {(areas || []).map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2"><Label>Contenido</Label><Input value={act.contenido} onChange={e => updAct(i, 'contenido', e.target.value)} /></div>
                      <div><Label>Fecha</Label><Input type="date" value={act.fecha} onChange={e => updAct(i, 'fecha', e.target.value)} /></div>
                      <div><Label>Lugar</Label><Input value={act.lugar} onChange={e => updAct(i, 'lugar', e.target.value)} /></div>
                      <div><Label>Horario</Label><Input value={act.horario} onChange={e => updAct(i, 'horario', e.target.value)} /></div>
                      <div><Label>Facilitador</Label>
                        <Select value={act.facilitador} onValueChange={v => updAct(i, 'facilitador', v)}>
                          <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                          <SelectContent>
                            {(facilitadores || []).map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                ))}
                {newActivities.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">Agrega al menos una actividad al programa.</p>
                )}

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
                  <Button onClick={() => createMutation.mutate()}
                    disabled={!newProgram.user_id || !newProgram.empresa || !newProgram.area || newActivities.length === 0 || createMutation.isPending}>
                    {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                    Crear Programa
                  </Button>
                </div>
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Total</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{resumen?.total || 0}</p></CardContent>
        </Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Activos</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-blue-600">{resumen?.activos || 0}</p></CardContent>
        </Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Completados</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-green-600">{resumen?.completados || 0}</p></CardContent>
        </Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Estancados</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-red-600">{resumen?.estancados || 0}</p></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm font-medium flex items-center gap-2"><Users className="h-4 w-4" /> Colaboradores en Inducción</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Colaborador</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Área</TableHead>
                <TableHead>Ingreso</TableHead>
                <TableHead>Progreso</TableHead>
                <TableHead>Actividades</TableHead>
                <TableHead>Días sin avance</TableHead>
                <TableHead>Detalle</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(!colaboradores || colaboradores.length === 0) ? (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No hay colaboradores en inducción.</TableCell></TableRow>
              ) : colaboradores.map(c => (
                <TableRow key={c.id} className={c.alerta_estancado ? 'bg-red-50' : ''}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {c.colaborador.display_name}
                      {c.alerta_estancado && <AlertTriangle className="h-4 w-4 text-red-500" />}
                    </div>
                  </TableCell>
                  <TableCell>{c.empresa}</TableCell>
                  <TableCell>{c.area}</TableCell>
                  <TableCell>{new Date(c.fecha_ingreso).toLocaleDateString('es-AR')}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={c.progreso} className="w-20 h-2" />
                      <span className="text-xs font-mono">{c.progreso}%</span>
                    </div>
                  </TableCell>
                  <TableCell>{c.completadas}/{c.total_actividades}</TableCell>
                  <TableCell>
                    <Badge variant={c.alerta_estancado ? 'destructive' : 'outline'}>
                      <Clock className="h-3 w-3 mr-1" /> {c.dias_sin_avance}d
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" className="h-8"
                      onClick={async () => {
                        const res = await get<{ data: ProgramDetalle }>(`/api/induccion/th/${c.id}`);
                        setDetailItem(res.data?.data || null);
                      }}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!detailItem} onOpenChange={o => { if (!o) setDetailItem(null); }}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh]">
          <DialogHeader><DialogTitle>Programa de Inducción</DialogTitle></DialogHeader>
          {detailItem && (
            <ScrollArea className="max-h-[70vh] pr-4">
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div><Label className="text-xs text-muted-foreground">Colaborador</Label><p className="font-medium">{detailItem.user.display_name}</p></div>
                  <div><Label className="text-xs text-muted-foreground">Empresa</Label><p>{detailItem.empresa}</p></div>
                  <div><Label className="text-xs text-muted-foreground">Área</Label><p>{detailItem.area}</p></div>
                  <div><Label className="text-xs text-muted-foreground">Ingreso</Label><p>{new Date(detailItem.fecha_ingreso).toLocaleDateString('es-AR')}</p></div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Progress value={detailItem.progreso} className="h-3" />
                  </div>
                  <span className="font-mono text-sm">{detailItem.progreso}%</span>
                  <span className="text-sm text-muted-foreground">({detailItem.completadas}/{detailItem.total_actividades})</span>
                </div>

                {detailItem.survey_rating && (
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm">Encuesta de satisfacción</CardTitle></CardHeader>
                    <CardContent>
                      <p>Calificación: <span className="font-medium capitalize">{detailItem.survey_rating}</span></p>
                      {detailItem.survey_feedback && <p className="text-sm text-muted-foreground">{detailItem.survey_feedback}</p>}
                    </CardContent>
                  </Card>
                )}

                <div className="space-y-3">
                  {detailItem.activities.map(act => (
                    <div key={act.id} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <Badge className={statusColors[act.status]}>{act.status.replace('_', ' ')}</Badge>
                        <span className="text-xs text-muted-foreground">Día {act.dia}</span>
                      </div>
                      <p className="font-medium mt-1">{act.contenido}</p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mt-1">
                        <span className="flex items-center gap-1"><Building2 className="h-3 w-3" /> {act.area_competencia}</span>
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(act.fecha).toLocaleDateString('es-AR')}</span>
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {act.horario}</span>
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {act.lugar}</span>
                        <span className="flex items-center gap-1"><User className="h-3 w-3" /> {act.facilitador}</span>
                      </div>
                      {act.observaciones && <p className="text-xs italic text-muted-foreground mt-1">Obs: {act.observaciones}</p>}
                    </div>
                  ))}
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
