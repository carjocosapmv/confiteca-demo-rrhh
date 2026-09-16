import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CalendarDays, Clock, Users, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { get, post } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

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

export default function AusenciasRRHHDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; requestId: string | null }>({ open: false, requestId: null });
  const [rejectNote, setRejectNote] = useState('');

  const { data: pendientesTH, isLoading: loadingTH } = useQuery({
    queryKey: ['rrhh-pendientes-th'],
    queryFn: async () => {
      const res = await get<any>('/api/permisos-vacaciones/pendientes-th');
      return res.data?.data || [];
    },
    enabled: !!user,
  });

  const { data: recientes } = useQuery({
    queryKey: ['rrhh-recientes'],
    queryFn: async () => {
      const res = await get<any>('/api/permisos-vacaciones/solicitudes', { per_page: '5', sort_by: 'created_at', sort_direction: 'desc' });
      return res.data?.data || [];
    },
    enabled: !!user,
  });

  const aprobarTH = useMutation({
    mutationFn: async (requestId: string) => {
      await post(`/api/permisos-vacaciones/${requestId}/aprobar-th`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rrhh-pendientes-th'] });
      queryClient.invalidateQueries({ queryKey: ['rrhh-recientes'] });
      toast({ title: 'Solicitud aprobada' });
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err?.response?.data?.message || err.message, variant: 'destructive' });
    },
  });

  const rechazarSolicitud = useMutation({
    mutationFn: async () => {
      if (!rejectDialog.requestId) throw new Error('ID no encontrado');
      await post(`/api/permisos-vacaciones/${rejectDialog.requestId}/rechazar`, { nota_rechazo: rejectNote });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rrhh-pendientes-th'] });
      queryClient.invalidateQueries({ queryKey: ['rrhh-recientes'] });
      toast({ title: 'Solicitud rechazada' });
      setRejectDialog({ open: false, requestId: null });
      setRejectNote('');
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err?.response?.data?.message || err.message, variant: 'destructive' });
    },
  });

  const pendientesCount = pendientesTH?.length || 0;
  const recientesCount = recientes?.length || 0;
  const aprobadosCount = (recientes || []).filter((r: any) => r.etapa_aprobacion === 'aprobado_th').length;

  if (loadingTH) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Dashboard RRHH - Ausencias</h1>
        <p className="text-sm text-muted-foreground">Resumen general de permisos y vacaciones</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pendientes TH</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{pendientesCount}</div>
            <p className="text-xs text-muted-foreground mt-1">por aprobar</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Actividad reciente</CardTitle>
            <CalendarDays className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{recientesCount}</div>
            <p className="text-xs text-muted-foreground mt-1">solicitudes recientes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Aprobadas</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{aprobadosCount}</div>
            <p className="text-xs text-muted-foreground mt-1">completadas</p>
          </CardContent>
        </Card>
      </div>

      {pendientesCount > 0 && (
        <Card className="border-yellow-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-yellow-500" />
              Solicitudes pendientes de aprobación TH
              <Badge className="bg-yellow-500/10 text-yellow-600 ml-1">{pendientesCount}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pendientesTH.map((req: any) => (
                <div key={req.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                  <div>
                    <p className="text-sm font-medium">{req.user?.display_name || req.colaborador || '—'}</p>
                    <p className="text-xs text-muted-foreground">
                      {TIPO_LABELS[req.tipo_permiso || req.tipo] || req.tipo_permiso || req.tipo}
                      {req.days_requested ? ` · ${req.days_requested} día(s)` : ''}
                      {req.start_date && ` · ${format(new Date(req.start_date), 'dd/MM/yy', { locale: es })}`}
                      {req.end_date && req.end_date !== req.start_date && ` - ${format(new Date(req.end_date), 'dd/MM/yy', { locale: es })}`}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-green-600 hover:text-green-600 hover:bg-green-500/10"
                      onClick={() => aprobarTH.mutate(req.id)}
                      disabled={aprobarTH.isPending}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" /> Aprobar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-600 hover:text-red-600 hover:bg-red-500/10"
                      onClick={() => { setRejectDialog({ open: true, requestId: req.id }); setRejectNote(''); }}
                      disabled={rechazarSolicitud.isPending}
                    >
                      <XCircle className="h-4 w-4 mr-1" /> Rechazar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-sm">Actividad reciente</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Colaborador</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Fechas</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!recientes || recientes.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">Sin datos</TableCell></TableRow>
              ) : (
                recientes.map((req: any) => (
                  <TableRow key={req.id}>
                    <TableCell className="font-medium">{req.user?.display_name || req.colaborador || '—'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{TIPO_LABELS[req.tipo_permiso || req.tipo] || req.tipo_permiso || req.tipo}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {req.start_date && format(new Date(req.start_date), 'dd/MM/yy', { locale: es })}
                      {req.end_date && req.end_date !== req.start_date && ` - ${format(new Date(req.end_date), 'dd/MM/yy', { locale: es })}`}
                    </TableCell>
                    <TableCell><StatusBadge etapa={req.etapa_aprobacion} /></TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={rejectDialog.open} onOpenChange={(open) => {
        if (!open) { setRejectDialog({ open: false, requestId: null }); setRejectNote(''); }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rechazar solicitud</DialogTitle>
            <DialogDescription>
              Ingresa el motivo del rechazo para notificar al solicitante.
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
}
