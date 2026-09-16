import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/contexts/PermissionsContext';
import { get, post } from '@/lib/api-client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Eye, CheckCircle, XCircle, Clock, Loader2, Send, ChevronRight, Building2, Users, FileCheck, Ban, UserCheck, UserPlus, Briefcase, DollarSign, GraduationCap, Calendar } from 'lucide-react';

interface UserRef {
  id: string; display_name: string; email: string;
  puesto?: { id: string; nombre: string }; businessUnit?: { id: string; nombre: string; codigo: string };
}

interface VacancyRequest {
  id: string; user_id: string; created_at: string;
  fecha_requerimiento: string | null; cargo_solicitante: string | null; area_solicitante: string | null;
  cargo_reporta: string | null; cargo_requerimiento: string; num_vacantes: number;
  horario_trabajo: string | null; turno: string | null; disponibilidad_viajar: boolean;
  requiere_vehiculo: boolean; ciudad: string | null; fecha_tentativa_ingreso: string | null;
  empresa: string | null; departamento: string; motivo: string; grupo_ocupacional: string | null;
  rango_edad: string | null; nacionalidad: string | null; genero: string | null;
  estado_civil: string | null; carga_familiar: string | null; discapacidad: string | null;
  caracteristicas_jefe: string | null; experiencia_requerida: string | null;
  experiencia_sectores: { sector: string; tiempo: string }[] | null;
  especificaciones_hunting: string | null; justificativo_contratacion: string | null;
  tipo_contratacion: string | null; motivo_salida: string | null; tipo_contrato: string | null;
  remuneracion_base: number; remuneracion_variable: number; modo_pago_variable: string | null;
  remuneracion_total: number; movilizacion: boolean; movilizacion_monto: number;
  otros_rubros: string | null; candidato_interno: boolean; candidato_nombre: string | null;
  candidato_area: string | null; candidato_cargo_actual: string | null;
  nivel_urgencia: string; status: string; etapa_aprobacion: string;
  reviewed_by: string | null; nota_revision: string | null; reviewed_at: string | null;
  aprobado_por_gerente_id: string | null; aprobado_por_gerente_at: string | null;
  nota_gerente: string | null; aprobado_por_th_id: string | null;
  aprobado_por_th_at: string | null; nota_th: string | null;
  recibido_seleccion_id: string | null; recibido_seleccion_at: string | null;
  nota_seleccion: string | null; revision_final_id: string | null;
  revision_final_at: string | null; nota_revision_final: string | null;
  user: UserRef; reviewer: UserRef | null;
  aprobadoPorGerente: UserRef | null; aprobadoPorTH: UserRef | null;
  recibidoSeleccion: UserRef | null; revisionFinal: UserRef | null;
}

const etapas = [
  { key: 'borrador', label: 'Borrador', icon: FileCheck },
  { key: 'en_revision', label: 'Revisión Gerente', icon: Clock },
  { key: 'aprobado_gerente', label: 'Aprobado Gerente', icon: UserCheck },
  { key: 'aprobado_th', label: 'Aprobado TH', icon: Users },
  { key: 'en_seleccion', label: 'En Selección', icon: UserPlus },
  { key: 'aprobado', label: 'Aprobado', icon: CheckCircle },
  { key: 'rechazado', label: 'Rechazado', icon: XCircle },
];

const etapaBadge = (e: string) => {
  const etapa = etapas.find(ep => ep.key === e);
  if (!etapa) return <Badge variant="outline">{e}</Badge>;
  const colors: Record<string, string> = {
    borrador: 'bg-gray-100 text-gray-600',
    en_revision: 'bg-blue-100 text-blue-700',
    aprobado_gerente: 'bg-indigo-100 text-indigo-700',
    aprobado_th: 'bg-purple-100 text-purple-700',
    en_seleccion: 'bg-amber-100 text-amber-700',
    aprobado: 'bg-green-100 text-green-700',
    rechazado: 'bg-red-100 text-red-700',
  };
  return <Badge className={colors[e] || ''}>{etapa.label}</Badge>;
};

const getEtapaProgress = (e: string) => {
  const idx = etapas.findIndex(ep => ep.key === e);
  return idx >= 0 ? idx : -1;
};

interface FormData {
  fecha_requerimiento: string; cargo_solicitante: string; area_solicitante: string;
  cargo_reporta: string; cargo_requerimiento: string; num_vacantes: string;
  horario_trabajo: string; turno: string; disponibilidad_viajar: boolean;
  requiere_vehiculo: boolean; ciudad: string; fecha_tentativa_ingreso: string;
  empresa: string; grupo_ocupacional: string; rango_edad: string;
  nacionalidad: string; genero: string; estado_civil: string;
  carga_familiar: string; discapacidad: string; caracteristicas_jefe: string;
  experiencia_requerida: string; experiencia_sectores: string;
  especificaciones_hunting: string; justificativo_contratacion: string;
  tipo_contratacion: string; motivo_salida: string; tipo_contrato: string;
  remuneracion_base: string; remuneracion_variable: string; modo_pago_variable: string;
  movilizacion: boolean; movilizacion_monto: string; otros_rubros: string;
  candidato_interno: boolean; candidato_nombre: string; candidato_area: string;
  candidato_cargo_actual: string; motivo: string; nivel_urgencia: string;
}

const emptyForm = (userName: string): FormData => ({
  fecha_requerimiento: new Date().toISOString().split('T')[0], cargo_solicitante: userName,
  area_solicitante: '', cargo_reporta: '', cargo_requerimiento: '', num_vacantes: '1',
  horario_trabajo: 'Lunes a Viernes 8:00-17:00', turno: 'Mañana', disponibilidad_viajar: false,
  requiere_vehiculo: false, ciudad: '', fecha_tentativa_ingreso: '', empresa: 'Planta',
  grupo_ocupacional: '', rango_edad: '', nacionalidad: 'Ecuatoriana', genero: 'Indiferente',
  estado_civil: 'Indiferente', carga_familiar: '', discapacidad: 'Indiferente', caracteristicas_jefe: '',
  experiencia_requerida: '', experiencia_sectores: '', especificaciones_hunting: '',
  justificativo_contratacion: '', tipo_contratacion: 'nuevo_cargo', motivo_salida: '',
  tipo_contrato: 'Indefinido', remuneracion_base: '0', remuneracion_variable: '0',
  modo_pago_variable: '', movilizacion: false, movilizacion_monto: '0', otros_rubros: '',
  candidato_interno: false, candidato_nombre: '', candidato_area: '', candidato_cargo_actual: '',
  motivo: '', nivel_urgencia: 'media',
});

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-primary border-b pb-2">{title}</h3>
      {children}
    </div>
  );
}

export default function VacantesPage() {
  const { user, isAdmin } = useAuth();
  const { canEdit } = usePermissions();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isRRHH = user?.role === 'superadmin' || isAdmin;

  const [statusFilter, setStatusFilter] = useState('');
  const [etapaFilter, setEtapaFilter] = useState('');
  const [empresaFilter, setEmpresaFilter] = useState('');

  const [createOpen, setCreateOpen] = useState(false);
  const [formTab, setFormTab] = useState('basica');
  const [form, setForm] = useState<FormData>(emptyForm(user?.display_name || ''));

  const [detailItem, setDetailItem] = useState<VacancyRequest | null>(null);

  const [approveDialog, setApproveDialog] = useState<{ open: boolean; req: VacancyRequest | null; action: string }>({ open: false, req: null, action: '' });
  const [approveNote, setApproveNote] = useState('');

  const queryParams: Record<string, string> = {};
  if (statusFilter) queryParams.status = statusFilter;
  if (etapaFilter) queryParams.etapa_aprobacion = etapaFilter;
  if (empresaFilter) queryParams.empresa = empresaFilter;

  const { data: resData, isLoading } = useQuery({
    queryKey: ['requisiciones', queryParams],
    queryFn: async () => {
      const res = await get<{ data: VacancyRequest[] }>('/api/vacancy-requests', queryParams);
      return res.data?.data || [];
    },
    enabled: !!user,
  });

  const requests = resData || [];
  const empresas = [...new Set(requests.map(r => r.empresa).filter(Boolean))].sort();
  const pendientes = requests.filter(r => r.status === 'pendiente' || r.status === 'en_proceso');
  const aprobadas = requests.filter(r => r.status === 'aprobada');
  const borradores = requests.filter(r => r.etapa_aprobacion === 'borrador');

  const createMutation = useMutation({
    mutationFn: async () => {
      const payload = { ...form, num_vacantes: parseInt(form.num_vacantes), remuneracion_base: parseFloat(form.remuneracion_base) || 0, remuneracion_variable: parseFloat(form.remuneracion_variable) || 0, movilizacion_monto: parseFloat(form.movilizacion_monto) || 0, experiencia_sectores: form.experiencia_sectores ? form.experiencia_sectores.split('\n').filter(Boolean).map(line => { const [sector, tiempo] = line.split('|'); return { sector: sector?.trim(), tiempo: tiempo?.trim() }; }) : undefined };
      await post('/api/vacancy-requests', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requisiciones'] });
      toast({ title: 'Requisición creada', description: 'Se ha registrado la solicitud.' });
      setCreateOpen(false);
      setForm(emptyForm(user?.display_name || ''));
      setFormTab('basica');
    },
    onError: (err: any) => { toast({ title: 'Error', description: err?.response?.data?.message || err.message, variant: 'destructive' }); },
  });

  const enviarMutation = useMutation({
    mutationFn: async (id: string) => { await post(`/api/vacancy-requests/${id}/enviar`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['requisiciones'] }); toast({ title: 'Enviada a revisión' }); },
    onError: (err: any) => { toast({ title: 'Error', description: err?.response?.data?.message || err.message, variant: 'destructive' }); },
  });

  const approveMutation = useMutation({
    mutationFn: async ({ id, action, nota }: { id: string; action: string; nota: string }) => {
      const routeMap: Record<string, string> = {
        aprobar_gerente: 'aprobar-gerente', aprobar_th: 'aprobar-th',
        recibir_seleccion: 'recibir-seleccion', revision_final: 'revision-final',
      };
      await post(`/api/vacancy-requests/${id}/${routeMap[action] || action}`, { nota });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requisiciones'] });
      toast({ title: 'Acción completada' });
      setApproveDialog({ open: false, req: null, action: '' });
      setApproveNote('');
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err?.response?.data?.message || err.message, variant: 'destructive' });
    },
  });

  const rechazarMutation = useMutation({
    mutationFn: async ({ id, nota }: { id: string; nota: string }) => {
      const etapa = detailItem?.etapa_aprobacion || '';
      await post(`/api/vacancy-requests/${id}/rechazar`, { nota_rechazo: nota, etapa_origen: etapa });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requisiciones'] });
      toast({ title: 'Solicitud rechazada' });
      setApproveDialog({ open: false, req: null, action: '' });
      setApproveNote('');
      setDetailItem(null);
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err?.response?.data?.message || err.message, variant: 'destructive' });
    },
  });

  const canApprove = (req: VacancyRequest) => {
    if (!isRRHH) return false;
    switch (req.etapa_aprobacion) {
      case 'en_revision': return true;
      case 'aprobado_gerente': return true;
      case 'aprobado_th': return true;
      case 'en_seleccion': return true;
      default: return false;
    }
  };

  const getNextAction = (etapa: string) => {
    const map: Record<string, { label: string; action: string }> = {
      en_revision: { label: 'Aprobar como Gerente de Área', action: 'aprobar_gerente' },
      aprobado_gerente: { label: 'Aprobar como Talento Humano', action: 'aprobar_th' },
      aprobado_th: { label: 'Recibir en Selección', action: 'recibir_seleccion' },
      en_seleccion: { label: 'Revisión Final - Completar', action: 'revision_final' },
    };
    return map[etapa] || null;
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Requisición de Personal</h1>
          <p className="text-muted-foreground">Formulario TTHH12 — Solicitud y aprobación de nuevo personal</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-1" /> Nueva Requisición</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-3xl max-h-[90vh]">
            <DialogHeader><DialogTitle>Nueva Requisición de Personal</DialogTitle><DialogDescription>Completa todas las secciones del formulario TTHH12</DialogDescription></DialogHeader>
            <Tabs value={formTab} onValueChange={setFormTab} className="flex flex-col max-h-[70vh]">
              <TabsList className="grid grid-cols-6">
                <TabsTrigger value="basica">Básica</TabsTrigger>
                <TabsTrigger value="especificaciones">Especificaciones</TabsTrigger>
                <TabsTrigger value="experiencia">Experiencia</TabsTrigger>
                <TabsTrigger value="remuneracion">Remuneración</TabsTrigger>
                <TabsTrigger value="candidato">Candidato</TabsTrigger>
                <TabsTrigger value="justificacion">Justificación</TabsTrigger>
              </TabsList>
              <ScrollArea className="flex-1 px-1">
                <TabsContent value="basica" className="space-y-6 mt-4">
                  <FormSection title="Información Básica">
                    <div className="grid grid-cols-2 gap-4">
                      <div><Label>Fecha de requerimiento</Label><Input type="date" value={form.fecha_requerimiento} onChange={e => setForm(p => ({ ...p, fecha_requerimiento: e.target.value }))} /></div>
                      <div><Label>Cargo solicitante</Label><Input value={form.cargo_solicitante} onChange={e => setForm(p => ({ ...p, cargo_solicitante: e.target.value }))} /></div>
                      <div><Label>Área solicitante</Label>
                        <Select value={form.area_solicitante} onValueChange={v => setForm(p => ({ ...p, area_solicitante: v }))}>
                          <SelectTrigger><SelectValue placeholder="Seleccionar área" /></SelectTrigger>
                          <SelectContent>
                            {['Ventas', 'Logística', 'Administración', 'Marketing', 'Producción', 'Financiero', 'Tecnología', 'RRHH', 'Legal'].map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div><Label>Cargo al que reporta</Label><Input value={form.cargo_reporta} onChange={e => setForm(p => ({ ...p, cargo_reporta: e.target.value }))} /></div>
                      <div><Label>Cargo requerido *</Label><Input value={form.cargo_requerimiento} onChange={e => setForm(p => ({ ...p, cargo_requerimiento: e.target.value }))} /></div>
                      <div><Label>N° de vacantes</Label><Input type="number" min="1" value={form.num_vacantes} onChange={e => setForm(p => ({ ...p, num_vacantes: e.target.value }))} /></div>
                      <div><Label>Horario de trabajo</Label><Input value={form.horario_trabajo} onChange={e => setForm(p => ({ ...p, horario_trabajo: e.target.value }))} /></div>
                      <div><Label>Turno</Label>
                        <Select value={form.turno} onValueChange={v => setForm(p => ({ ...p, turno: v }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {['Mañana', 'Tarde', 'Noche', 'Rotativo'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center gap-4 pt-6">
                        <div className="flex items-center gap-2"><Checkbox id="viajar" checked={form.disponibilidad_viajar} onCheckedChange={v => setForm(p => ({ ...p, disponibilidad_viajar: !!v }))} /><Label htmlFor="viajar">Disponibilidad para viajar</Label></div>
                        <div className="flex items-center gap-2"><Checkbox id="vehiculo" checked={form.requiere_vehiculo} onCheckedChange={v => setForm(p => ({ ...p, requiere_vehiculo: !!v }))} /><Label htmlFor="vehiculo">Requiere vehículo</Label></div>
                      </div>
                      <div><Label>Ciudad</Label><Input value={form.ciudad} onChange={e => setForm(p => ({ ...p, ciudad: e.target.value }))} /></div>
                      <div><Label>Fecha tentativa de ingreso</Label><Input type="date" value={form.fecha_tentativa_ingreso} onChange={e => setForm(p => ({ ...p, fecha_tentativa_ingreso: e.target.value }))} /></div>
                      <div><Label>Empresa</Label>
                        <Select value={form.empresa} onValueChange={v => setForm(p => ({ ...p, empresa: v }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {['Planta', 'Ventas de Campo', 'Distribución', 'Administración', 'Dispensario Médico'].map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div><Label>Grupo Ocupacional</Label>
                        <Select value={form.grupo_ocupacional} onValueChange={v => setForm(p => ({ ...p, grupo_ocupacional: v }))}>
                          <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                          <SelectContent>
                            {['Ventas y Mercadeo', 'Operaciones y Logística', 'Administrativo y Financiero', 'Tecnología', 'Dirección/Gerencia', 'Producción', 'Talento Humano'].map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </FormSection>
                </TabsContent>
                <TabsContent value="especificaciones" className="space-y-6 mt-4">
                  <FormSection title="Especificaciones del Candidato">
                    <div className="grid grid-cols-2 gap-4">
                      <div><Label>Rango de edad</Label><Input value={form.rango_edad} onChange={e => setForm(p => ({ ...p, rango_edad: e.target.value }))} placeholder="Ej: 25-35" /></div>
                      <div><Label>Nacionalidad</Label><Input value={form.nacionalidad} onChange={e => setForm(p => ({ ...p, nacionalidad: e.target.value }))} /></div>
                      <div><Label>Género</Label>
                        <Select value={form.genero} onValueChange={v => setForm(p => ({ ...p, genero: v }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {['Indiferente', 'Masculino', 'Femenino'].map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div><Label>Estado civil</Label>
                        <Select value={form.estado_civil} onValueChange={v => setForm(p => ({ ...p, estado_civil: v }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {['Indiferente', 'Soltero', 'Casado', 'Otro'].map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div><Label>Carga familiar</Label><Input value={form.carga_familiar} onChange={e => setForm(p => ({ ...p, carga_familiar: e.target.value }))} placeholder="Ej: 2 hijos" /></div>
                      <div><Label>Discapacidad</Label>
                        <Select value={form.discapacidad} onValueChange={v => setForm(p => ({ ...p, discapacidad: v }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {['Indiferente', 'Sí', 'No'].map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div><Label>Características deseables del jefe inmediato</Label><Textarea value={form.caracteristicas_jefe} onChange={e => setForm(p => ({ ...p, caracteristicas_jefe: e.target.value }))} rows={2} /></div>
                  </FormSection>
                </TabsContent>
                <TabsContent value="experiencia" className="space-y-6 mt-4">
                  <FormSection title="Conocimiento y Experiencia">
                    <div><Label>Experiencia requerida *</Label><Textarea value={form.experiencia_requerida} onChange={e => setForm(p => ({ ...p, experiencia_requerida: e.target.value }))} rows={3} /></div>
                    <div><Label>Experiencia por sectores</Label><p className="text-xs text-muted-foreground">Formato: Sector | Tiempo (una por línea)</p>
                      <Textarea value={form.experiencia_sectores} onChange={e => setForm(p => ({ ...p, experiencia_sectores: e.target.value }))} rows={3} placeholder="Ventas directas | 2 años" />
                    </div>
                    <div><Label>Especificaciones para Hunting/Headhunting</Label><Textarea value={form.especificaciones_hunting} onChange={e => setForm(p => ({ ...p, especificaciones_hunting: e.target.value }))} rows={2} /></div>
                  </FormSection>
                </TabsContent>
                <TabsContent value="remuneracion" className="space-y-6 mt-4">
                  <FormSection title="Contratación y Remuneración">
                    <div className="grid grid-cols-2 gap-4">
                      <div><Label>Tipo de contratación</Label>
                        <Select value={form.tipo_contratacion} onValueChange={v => setForm(p => ({ ...p, tipo_contratacion: v }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="nuevo_cargo">Nuevo Cargo</SelectItem>
                            <SelectItem value="reemplazo">Reemplazo</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {form.tipo_contratacion === 'reemplazo' && (
                        <div><Label>Motivo de salida</Label><Input value={form.motivo_salida} onChange={e => setForm(p => ({ ...p, motivo_salida: e.target.value }))} /></div>
                      )}
                      <div><Label>Tipo de contrato</Label>
                        <Select value={form.tipo_contrato} onValueChange={v => setForm(p => ({ ...p, tipo_contrato: v }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {['Indefinido', 'Plazo fijo', 'Por obra', 'Pasantía'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div><Label>Remuneración base ($)</Label><Input type="number" step="0.01" value={form.remuneracion_base} onChange={e => setForm(p => ({ ...p, remuneracion_base: e.target.value }))} /></div>
                      <div><Label>Remuneración variable ($)</Label><Input type="number" step="0.01" value={form.remuneracion_variable} onChange={e => setForm(p => ({ ...p, remuneracion_variable: e.target.value }))} /></div>
                      <div>
                        <Label>Modo pago variable</Label>
                        <Select value={form.modo_pago_variable} onValueChange={v => setForm(p => ({ ...p, modo_pago_variable: v }))}>
                          <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
                          <SelectContent>
                            {['Comisiones', 'Bonos', 'Objetivos', 'Otro'].map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2"><Checkbox id="movilizacion" checked={form.movilizacion} onCheckedChange={v => setForm(p => ({ ...p, movilizacion: !!v }))} /><Label htmlFor="movilizacion">Movilización</Label></div>
                      {form.movilizacion && <div className="w-40"><Input type="number" step="0.01" value={form.movilizacion_monto} onChange={e => setForm(p => ({ ...p, movilizacion_monto: e.target.value }))} placeholder="Monto $" /></div>}
                    </div>
                    <div><Label>Otros rubros</Label><Textarea value={form.otros_rubros} onChange={e => setForm(p => ({ ...p, otros_rubros: e.target.value }))} rows={2} /></div>
                    <div className="bg-muted p-3 rounded-lg text-right">
                      <span className="text-lg font-bold">Total: ${(parseFloat(form.remuneracion_base) + parseFloat(form.remuneracion_variable)).toFixed(2)}</span>
                    </div>
                  </FormSection>
                </TabsContent>
                <TabsContent value="candidato" className="space-y-6 mt-4">
                  <FormSection title="Candidato Interno">
                    <div className="flex items-center gap-2 mb-4"><Checkbox id="candidato_interno" checked={form.candidato_interno} onCheckedChange={v => setForm(p => ({ ...p, candidato_interno: !!v }))} /><Label htmlFor="candidato_interno">¿Existe candidato interno?</Label></div>
                    {form.candidato_interno && (
                      <div className="grid grid-cols-3 gap-4">
                        <div><Label>Nombre del candidato</Label><Input value={form.candidato_nombre} onChange={e => setForm(p => ({ ...p, candidato_nombre: e.target.value }))} /></div>
                        <div><Label>Área actual</Label><Input value={form.candidato_area} onChange={e => setForm(p => ({ ...p, candidato_area: e.target.value }))} /></div>
                        <div><Label>Cargo actual</Label><Input value={form.candidato_cargo_actual} onChange={e => setForm(p => ({ ...p, candidato_cargo_actual: e.target.value }))} /></div>
                      </div>
                    )}
                  </FormSection>
                </TabsContent>
                <TabsContent value="justificacion" className="space-y-6 mt-4">
                  <FormSection title="Justificación">
                    <div><Label>Justificativo de contratación *</Label><Textarea value={form.justificativo_contratacion} onChange={e => setForm(p => ({ ...p, justificativo_contratacion: e.target.value }))} rows={4} /></div>
                    <div><Label>Motivo / Detalle adicional</Label><Textarea value={form.motivo} onChange={e => setForm(p => ({ ...p, motivo: e.target.value }))} rows={3} /></div>
                    <div><Label>Nivel de urgencia</Label>
                      <Select value={form.nivel_urgencia} onValueChange={v => setForm(p => ({ ...p, nivel_urgencia: v }))}>
                        <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="baja">Baja</SelectItem>
                          <SelectItem value="media">Media</SelectItem>
                          <SelectItem value="alta">Alta</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </FormSection>
                  <div className="flex justify-between pt-4 border-t">
                    <Button variant="outline" onClick={() => setFormTab('candidato')}>← Anterior</Button>
                    <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending || !form.cargo_requerimiento || !form.experiencia_requerida || !form.justificativo_contratacion}>
                      {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                      Guardar Requisición
                    </Button>
                  </div>
                </TabsContent>
              </ScrollArea>
            </Tabs>
            <div className="flex justify-between pt-2 border-t" style={{ display: formTab === 'justificacion' ? 'none' : 'flex' }}>
              <Button variant="outline" onClick={() => {
                const tabs = ['basica', 'especificaciones', 'experiencia', 'remuneracion', 'candidato', 'justificacion'];
                const idx = tabs.indexOf(formTab);
                if (idx > 0) setFormTab(tabs[idx - 1]);
              }} disabled={formTab === 'basica'}>← Anterior</Button>
              <Button onClick={() => {
                const tabs = ['basica', 'especificaciones', 'experiencia', 'remuneracion', 'candidato', 'justificacion'];
                const idx = tabs.indexOf(formTab);
                if (idx < tabs.length - 1) setFormTab(tabs[idx + 1]);
              }}>Siguiente →</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{requests.length}</p></CardContent>
        </Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">En Proceso</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-amber-600">{pendientes.length + borradores.length}</p></CardContent>
        </Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Aprobadas</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-green-600">{aprobadas.length}</p></CardContent>
        </Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Borradores</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-gray-500">{borradores.length}</p></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm font-medium">Filtros</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Select value={statusFilter} onValueChange={v => setStatusFilter(v === 'all' ? '' : v)}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Todos los estados" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pendiente">Pendiente</SelectItem>
                <SelectItem value="aprobada">Aprobada</SelectItem>
                <SelectItem value="rechazada">Rechazada</SelectItem>
                <SelectItem value="en_proceso">En Proceso</SelectItem>
              </SelectContent>
            </Select>
            <Select value={etapaFilter} onValueChange={v => setEtapaFilter(v === 'all' ? '' : v)}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Todas las etapas" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {etapas.map(e => <SelectItem key={e.key} value={e.key}>{e.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={empresaFilter} onValueChange={v => setEmpresaFilter(v === 'all' ? '' : v)}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Todas empresas" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {empresas.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
              </SelectContent>
            </Select>
            {(statusFilter || etapaFilter || empresaFilter) && (
              <Button variant="ghost" size="sm" onClick={() => { setStatusFilter(''); setEtapaFilter(''); setEmpresaFilter(''); }}>Limpiar</Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cargo</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Área</TableHead>
                <TableHead>Vacantes</TableHead>
                <TableHead>Solicitante</TableHead>
                <TableHead>Etapa</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No hay requisiciones de personal.</TableCell></TableRow>
              ) : requests.map(r => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.cargo_requerimiento}</TableCell>
                  <TableCell>{r.empresa || '—'}</TableCell>
                  <TableCell>{r.area_solicitante || '—'}</TableCell>
                  <TableCell>{r.num_vacantes}</TableCell>
                  <TableCell className="text-sm">{r.user?.display_name || '—'}</TableCell>
                  <TableCell>{etapaBadge(r.etapa_aprobacion)}</TableCell>
                  <TableCell>
                    <Badge variant={r.status === 'aprobada' ? 'default' : r.status === 'rechazada' ? 'destructive' : 'secondary'}>{r.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" className="h-8 gap-1" onClick={() => setDetailItem(r)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      {r.etapa_aprobacion === 'borrador' && r.user_id === user?.id && (
                        <Button variant="outline" size="sm" className="h-8" onClick={() => enviarMutation.mutate(r.id)} disabled={enviarMutation.isPending}>
                          <Send className="h-3 w-3 mr-1" /> Enviar
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!detailItem} onOpenChange={open => { if (!open) setDetailItem(null); }}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh]">
          <DialogHeader><DialogTitle>Detalle de Requisición</DialogTitle></DialogHeader>
          {detailItem && (
            <ScrollArea className="max-h-[70vh] pr-4">
              <div className="space-y-6">
                <div className="flex items-center gap-2 flex-wrap">
                  {etapas.filter(e => e.key !== 'rechazado').map((etapa, i) => {
                    const progress = getEtapaProgress(detailItem.etapa_aprobacion);
                    const isCompleted = progress >= etapas.findIndex(e => e.key === etapa.key);
                    const isRejected = detailItem.etapa_aprobacion === 'rechazado';
                    return (
                      <div key={etapa.key} className="flex items-center gap-1">
                        <Badge variant={isRejected ? 'destructive' : isCompleted ? 'default' : 'outline'}
                          className={`flex items-center gap-1 ${isCompleted ? '' : 'opacity-40'}`}>
                          <etapa.icon className="h-3 w-3" /> {etapa.label}
                        </Badge>
                        {i < etapas.length - 2 && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
                      </div>
                    );
                  })}
                </div>

                <Separator />

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div><Label className="text-xs text-muted-foreground">Cargo requerido</Label><p className="font-medium">{detailItem.cargo_requerimiento}</p></div>
                  <div><Label className="text-xs text-muted-foreground">Empresa</Label><p>{detailItem.empresa || '—'}</p></div>
                  <div><Label className="text-xs text-muted-foreground">Área solicitante</Label><p>{detailItem.area_solicitante || '—'}</p></div>
                  <div><Label className="text-xs text-muted-foreground">Vacantes</Label><p>{detailItem.num_vacantes}</p></div>
                  <div><Label className="text-xs text-muted-foreground">Ciudad</Label><p>{detailItem.ciudad || '—'}</p></div>
                  <div><Label className="text-xs text-muted-foreground">Fecha tentativa ingreso</Label><p>{detailItem.fecha_tentativa_ingreso ? new Date(detailItem.fecha_tentativa_ingreso).toLocaleDateString('es-AR') : '—'}</p></div>
                  <div><Label className="text-xs text-muted-foreground">Horario</Label><p>{detailItem.horario_trabajo || '—'}</p></div>
                  <div><Label className="text-xs text-muted-foreground">Turno</Label><p>{detailItem.turno || '—'}</p></div>
                  <div><Label className="text-xs text-muted-foreground">Grupo Ocupacional</Label><p>{detailItem.grupo_ocupacional || '—'}</p></div>
                </div>

                {detailItem.experiencia_requerida && (
                  <>
                    <Separator />
                    <div><Label className="text-xs text-muted-foreground flex items-center gap-1"><Briefcase className="h-3 w-3" /> Experiencia requerida</Label><p className="text-sm mt-1 whitespace-pre-wrap">{detailItem.experiencia_requerida}</p></div>
                  </>
                )}

                {(() => {
                  const sectores = Array.isArray(detailItem.experiencia_sectores)
                    ? detailItem.experiencia_sectores
                    : typeof detailItem.experiencia_sectores === 'string'
                      ? JSON.parse(detailItem.experiencia_sectores)
                      : [];
                  return sectores.length > 0 && (
                    <>
                      <Separator />
                      <div><Label className="text-xs text-muted-foreground flex items-center gap-1"><GraduationCap className="h-3 w-3" /> Experiencia por sectores</Label>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {sectores.map((s, i) => (
                            <Badge key={i} variant="secondary">{s.sector}: {s.tiempo}</Badge>
                          ))}
                        </div>
                      </div>
                    </>
                  );
                })()}

                {detailItem.justificativo_contratacion && (
                  <>
                    <Separator />
                    <div><Label className="text-xs text-muted-foreground flex items-center gap-1"><FileCheck className="h-3 w-3" /> Justificación</Label><p className="text-sm mt-1 whitespace-pre-wrap">{detailItem.justificativo_contratacion}</p></div>
                  </>
                )}

                <Separator />
                <div className="grid grid-cols-3 gap-4">
                  <div><Label className="text-xs text-muted-foreground flex items-center gap-1"><DollarSign className="h-3 w-3" /> Base</Label><p className="font-medium">${detailItem.remuneracion_base?.toFixed(2)}</p></div>
                  <div><Label className="text-xs text-muted-foreground">Variable</Label><p>${detailItem.remuneracion_variable?.toFixed(2)}</p></div>
                  <div><Label className="text-xs text-muted-foreground">Total</Label><p className="font-bold text-primary">${detailItem.remuneracion_total?.toFixed(2)}</p></div>
                </div>

                {detailItem.candidato_interno && (
                  <>
                    <Separator />
                    <div><Label className="text-xs text-muted-foreground flex items-center gap-1"><Users className="h-3 w-3" /> Candidato Interno</Label>
                      <p className="text-sm">{detailItem.candidato_nombre} — {detailItem.candidato_cargo_actual} ({detailItem.candidato_area})</p>
                    </div>
                  </>
                )}

                <Separator />
                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">Línea de aprobación</Label>
                  <div className="space-y-3">
                    {[
                      { label: 'Gerente de Área', user: detailItem.aprobadoPorGerente, at: detailItem.aprobado_por_gerente_at, nota: detailItem.nota_gerente },
                      { label: 'Talento Humano', user: detailItem.aprobadoPorTH, at: detailItem.aprobado_por_th_at, nota: detailItem.nota_th },
                      { label: 'Selección/Reclutamiento', user: detailItem.recibidoSeleccion, at: detailItem.recibido_seleccion_at, nota: detailItem.nota_seleccion },
                      { label: 'Revisión Final', user: detailItem.revisionFinal, at: detailItem.revision_final_at, nota: detailItem.nota_revision_final },
                    ].map((step, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className={`w-2 h-2 mt-2 rounded-full ${step.user ? 'bg-green-500' : 'bg-gray-300'}`} />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{step.label}</p>
                          {step.user ? (
                            <p className="text-xs text-muted-foreground">{step.user.display_name} · {step.at ? new Date(step.at).toLocaleDateString('es-AR') : ''}</p>
                          ) : (
                            <p className="text-xs text-muted-foreground italic">Pendiente</p>
                          )}
                          {step.nota && <p className="text-xs text-muted-foreground mt-1 italic">"{step.nota}"</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {detailItem.nota_revision && (
                  <>
                    <Separator />
                    <div>
                      <Label className="text-xs text-muted-foreground flex items-center gap-1"><XCircle className="h-3 w-3" /> Nota de rechazo</Label>
                      <p className="text-sm mt-1 whitespace-pre-wrap">{detailItem.nota_revision}</p>
                      {detailItem.reviewer && <p className="text-xs text-muted-foreground mt-1">Por: {detailItem.reviewer.display_name}</p>}
                    </div>
                  </>
                )}

                {canApprove(detailItem) && (
                  <>
                    <Separator />
                    <div className="flex gap-2 pt-2">
                      {getNextAction(detailItem.etapa_aprobacion) && (
                        <Button onClick={() => { setApproveDialog({ open: true, req: detailItem, action: getNextAction(detailItem.etapa_aprobacion)!.action }); setApproveNote(''); }}>
                          <CheckCircle className="h-4 w-4 mr-1" /> {getNextAction(detailItem.etapa_aprobacion)!.label}
                        </Button>
                      )}
                      <Button variant="destructive" onClick={() => { setApproveDialog({ open: true, req: detailItem, action: 'rechazar' }); setApproveNote(''); }}>
                        <Ban className="h-4 w-4 mr-1" /> Rechazar
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={approveDialog.open} onOpenChange={open => { if (!open) { setApproveDialog({ open: false, req: null, action: '' }); setApproveNote(''); }}}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{approveDialog.action === 'rechazar' ? 'Rechazar Solicitud' : 'Confirmar Acción'}</DialogTitle>
            <DialogDescription>
              {approveDialog.action === 'rechazar'
                ? 'Indica el motivo del rechazo. Esta acción no se puede deshacer.'
                : 'Agrega una nota opcional para esta aprobación.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Label>
              {approveDialog.action === 'rechazar' ? 'Motivo del rechazo *' : 'Nota (opcional)'}
            </Label>
            <Textarea value={approveNote} onChange={e => setApproveNote(e.target.value)} rows={3}
              placeholder={approveDialog.action === 'rechazar' ? 'Explica por qué se rechaza...' : 'Nota para la siguiente etapa...'} />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setApproveDialog({ open: false, req: null, action: '' }); setApproveNote(''); }}>Cancelar</Button>
              <Button
                variant={approveDialog.action === 'rechazar' ? 'destructive' : 'default'}
                onClick={() => {
                  if (!approveDialog.req) return;
                  if (approveDialog.action === 'rechazar') {
                    rechazarMutation.mutate({ id: approveDialog.req.id, nota: approveNote });
                  } else {
                    approveMutation.mutate({ id: approveDialog.req.id, action: approveDialog.action, nota: approveNote });
                  }
                }}
                disabled={approveMutation.isPending || rechazarMutation.isPending || (approveDialog.action === 'rechazar' && !approveNote)}
              >
                {approveMutation.isPending || rechazarMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                {approveDialog.action === 'rechazar' ? 'Rechazar' : 'Confirmar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
