import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { CheckCircle, XCircle, CalendarDays, Clock, Search } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { get, post } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const TIPO_OPTIONS = [
  { value: 'todos', label: 'Todos' },
  { value: 'permiso', label: 'Permiso' },
  { value: 'vacacion', label: 'Vacaciones' },
];

const ETAPA_OPTIONS = [
  { value: 'todas', label: 'Todas' },
  { value: 'enviado', label: 'Enviado' },
  { value: 'aprobado_jefe', label: 'Aprobado Jefe' },
  { value: 'aprobado_th', label: 'Aprobado TH' },
  { value: 'rechazado', label: 'Rechazado' },
];

const TIPO_LABELS: Record<string, string> = {
  permiso: 'Permiso',
  vacacion: 'Vacaciones',
  paternidad: 'Paternidad',
  maternidad: 'Maternidad',
  lactancia: 'Lactancia',
  permiso_medico: 'Permiso Médico',
  cursos: 'Cursos o Motivo Empresarial',
  calamidad: 'Calamidad Doméstica',
};

function StatusBadge({ etapa }: { etapa: string }) {
  if (etapa === 'rechazado') return <Badge variant="destructive">Rechazado</Badge>;
  if (etapa === 'aprobado_th') return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Aprobado</Badge>;
  if (etapa === 'aprobado_jefe') return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">Aprobado Jefe</Badge>;
  return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">Enviado</Badge>;
}

const SolicitudesPage = () => {
  const { user, isAdmin, isSuperAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState('mis-solicitudes');
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; requestId: string | null }>({ open: false, requestId: null });
  const [rejectNote, setRejectNote] = useState('');
  const [tipoFilter, setTipoFilter] = useState('todos');
  const [etapaFilter, setEtapaFilter] = useState('todas');

  const { data: misSolicitudes } = useQuery({
    queryKey: ['mis-solicitudes-full'],
    queryFn: async () => {
      const res = await get<any>('/api/permisos-vacaciones/mis-solicitudes');
      return res.data;
    },
    enabled: !!user,
  });

  const { data: pendientesJefe } = useQuery({
    queryKey: ['pendientes-jefe'],
    queryFn: async () => {
      const res = await get<any>('/api/permisos-vacaciones/pendientes-jefe');
      return res.data?.data || [];
    },
    enabled: !!user,
  });

  const { data: pendientesTH } = useQuery({
    queryKey: ['pendientes-th'],
    queryFn: async () => {
      const res = await get<any>('/api/permisos-vacaciones/pendientes-th');
      return res.data?.data || [];
    },
    enabled: !!user && (isAdmin || isSuperAdmin),
  });

  const { data: todasSolicitudes } = useQuery({
    queryKey: ['todas-solicitudes', tipoFilter, etapaFilter],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (tipoFilter !== 'todos') params.tipo = tipoFilter;
      if (etapaFilter !== 'todas') params.etapa = etapaFilter;
      const res = await get<any>('/api/permisos-vacaciones/solicitudes', params);
      return res.data?.data || [];
    },
    enabled: !!user && (isAdmin || isSuperAdmin),
  });

  const aprobarJefe = useMutation({
    mutationFn: async (requestId: string) => {
      await post(`/api/permisos-vacaciones/${requestId}/aprobar-jefe`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendientes-jefe'] });
      queryClient.invalidateQueries({ queryKey: ['mis-solicitudes-full'] });
      queryClient.invalidateQueries({ queryKey: ['mis-solicitudes'] });
      toast({ title: 'Solicitud aprobada', description: 'La solicitud ha sido aprobada y notificada a TH.' });
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err?.response?.data?.message || err.message, variant: 'destructive' });
    },
  });

  const aprobarTH = useMutation({
    mutationFn: async (requestId: string) => {
      await post(`/api/permisos-vacaciones/${requestId}/aprobar-th`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendientes-th'] });
      queryClient.invalidateQueries({ queryKey: ['mis-solicitudes-full'] });
      queryClient.invalidateQueries({ queryKey: ['mis-solicitudes'] });
      queryClient.invalidateQueries({ queryKey: ['todas-solicitudes'] });
      toast({ title: 'Solicitud aprobada', description: 'La solicitud ha sido aprobada definitivamente.' });
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err?.response?.data?.message || err.message, variant: 'destructive' });
    },
  });

  const rechazarSolicitud = useMutation({
    mutationFn: async () => {
      if (!rejectDialog.requestId) throw new Error('ID de solicitud no encontrado');
      await post(`/api/permisos-vacaciones/${rejectDialog.requestId}/rechazar`, { nota_rechazo: rejectNote });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendientes-jefe'] });
      queryClient.invalidateQueries({ queryKey: ['pendientes-th'] });
      queryClient.invalidateQueries({ queryKey: ['mis-solicitudes-full'] });
      queryClient.invalidateQueries({ queryKey: ['mis-solicitudes'] });
      queryClient.invalidateQueries({ queryKey: ['todas-solicitudes'] });
      toast({ title: 'Solicitud rechazada' });
      setRejectDialog({ open: false, requestId: null });
      setRejectNote('');
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err?.response?.data?.message || err.message, variant: 'destructive' });
    },
  });

  const solicitudes = misSolicitudes?.solicitudes?.data || [];

  const renderRequestItem = (req: any, showCollaborator: boolean = false) => {
    const tipoLabel = TIPO_LABELS[req.tipo_permiso || req.tipo] || req.tipo_permiso || req.tipo || '—';
    return (
      <div key={req.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-lg border bg-card">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {showCollaborator && (
              <span className="font-medium text-sm">{req.user?.display_name || req.colaborador || '—'}</span>
            )}
            <StatusBadge etapa={req.etapa_aprobacion} />
            <Badge variant="outline" className="text-xs">{tipoLabel}</Badge>
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            {req.start_date && format(new Date(req.start_date), 'dd/MM/yyyy', { locale: es })}
            {req.end_date && req.end_date !== req.start_date && (
              <> — {format(new Date(req.end_date), 'dd/MM/yyyy', { locale: es })}</>
            )}
            {req.days_requested && <> · {req.days_requested} día(s)</>}
            {req.razon && <> · {req.razon}</>}
          </div>
        </div>
      </div>
    );
  };

  const renderApprovableItem = (req: any, onApprove: (id: string) => void, label: string) => {
    const tipoLabel = TIPO_LABELS[req.tipo_permiso || req.tipo] || req.tipo_permiso || req.tipo || '—';
    return (
      <div key={req.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-lg border bg-card">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm">{req.user?.display_name || req.colaborador || '—'}</span>
            <Badge variant="outline" className="text-xs">{tipoLabel}</Badge>
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            {req.start_date && format(new Date(req.start_date), 'dd/MM/yyyy', { locale: es })}
            {req.end_date && req.end_date !== req.start_date && (
              <> — {format(new Date(req.end_date), 'dd/MM/yyyy', { locale: es })}</>
            )}
            {req.days_requested && <> · {req.days_requested} día(s)</>}
            {req.razon && <p className="text-xs mt-0.5">{req.razon}</p>}
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button
            size="sm"
            variant="outline"
            className="text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700"
            onClick={() => onApprove(req.id)}
            disabled={aprobarJefe.isPending || aprobarTH.isPending}
          >
            <CheckCircle className="h-4 w-4 mr-1" /> {label}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-destructive border-destructive/20 hover:bg-destructive/10"
            onClick={() => {
              setRejectDialog({ open: true, requestId: req.id });
              setRejectNote('');
            }}
            disabled={rechazarSolicitud.isPending}
          >
            <XCircle className="h-4 w-4 mr-1" /> Rechazar
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Gestión de Solicitudes</h1>
        <p className="text-muted-foreground">Administración de permisos y vacaciones</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="mis-solicitudes">Mis Solicitudes</TabsTrigger>
          {(isAdmin || isSuperAdmin) && (
            <>
              <TabsTrigger value="pendientes-jefe">Pendientes (Jefe)</TabsTrigger>
              <TabsTrigger value="pendientes-th">Pendientes (TH)</TabsTrigger>
              <TabsTrigger value="todas">Todas</TabsTrigger>
            </>
          )}
        </TabsList>

        <TabsContent value="mis-solicitudes" className="mt-4 space-y-3">
          {solicitudes.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No tienes solicitudes activas.</CardContent></Card>
          ) : (
            solicitudes.map((req: any) => renderRequestItem(req))
          )}
        </TabsContent>

        {(isAdmin || isSuperAdmin) && (
          <>
            <TabsContent value="pendientes-jefe" className="mt-4 space-y-3">
              {!pendientesJefe || pendientesJefe.length === 0 ? (
                <Card><CardContent className="py-8 text-center text-muted-foreground">No hay solicitudes pendientes de aprobación del jefe.</CardContent></Card>
              ) : (
                pendientesJefe.map((req: any) =>
                  renderApprovableItem(req, (id) => aprobarJefe.mutate(id), 'Aprobar')
                )
              )}
            </TabsContent>

            <TabsContent value="pendientes-th" className="mt-4 space-y-3">
              {!pendientesTH || pendientesTH.length === 0 ? (
                <Card><CardContent className="py-8 text-center text-muted-foreground">No hay solicitudes pendientes de aprobación de TH.</CardContent></Card>
              ) : (
                pendientesTH.map((req: any) =>
                  renderApprovableItem(req, (id) => aprobarTH.mutate(id), 'Aprobar TH')
                )
              )}
            </TabsContent>

            <TabsContent value="todas" className="mt-4">
              <div className="flex gap-3 flex-wrap mb-4">
                <Select value={tipoFilter} onValueChange={setTipoFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPO_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={etapaFilter} onValueChange={setEtapaFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    {ETAPA_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Card>
                <CardContent className="p-0 overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Colaborador</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Inicio</TableHead>
                        <TableHead>Fin</TableHead>
                        <TableHead>Días</TableHead>
                        <TableHead>Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(!todasSolicitudes || todasSolicitudes.length === 0) ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                            No se encontraron solicitudes.
                          </TableCell>
                        </TableRow>
                      ) : (
                        todasSolicitudes.map((req: any) => (
                          <TableRow key={req.id}>
                            <TableCell className="font-medium">{req.user?.display_name || req.colaborador || '—'}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{TIPO_LABELS[req.tipo_permiso || req.tipo] || req.tipo_permiso || req.tipo || '—'}</Badge>
                            </TableCell>
                            <TableCell>{req.start_date ? format(new Date(req.start_date), 'dd/MM/yy') : '—'}</TableCell>
                            <TableCell>{req.end_date ? format(new Date(req.end_date), 'dd/MM/yy') : '—'}</TableCell>
                            <TableCell>{req.days_requested || '—'}</TableCell>
                            <TableCell><StatusBadge etapa={req.etapa_aprobacion} /></TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </>
        )}
      </Tabs>

      <Dialog open={rejectDialog.open} onOpenChange={(open) => {
        if (!open) { setRejectDialog({ open: false, requestId: null }); setRejectNote(''); }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rechazar solicitud</DialogTitle>
            <DialogDescription>
              Ingresa el motivo del rechazo. Esta información será visible para el solicitante.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Motivo del rechazo <span className="text-destructive">*</span></Label>
              <Textarea
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                placeholder="Explica el motivo del rechazo..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRejectDialog({ open: false, requestId: null }); setRejectNote(''); }}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => rechazarSolicitud.mutate()}
              disabled={rechazarSolicitud.isPending || !rejectNote.trim()}
            >
              {rechazarSolicitud.isPending ? 'Rechazando...' : 'Rechazar solicitud'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SolicitudesPage;
