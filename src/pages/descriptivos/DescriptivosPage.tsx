import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { get, post, put, del } from '@/lib/api-client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Plus, Eye, Pencil, FileText, Loader2, Search, History, GitCompare, Building2, Calendar, User, BookOpen, Award, Star, CheckCircle, Clock, XCircle } from 'lucide-react';

interface Funcion {
  nombre: string;
  actividades: string[];
}

interface Competencia {
  nombre: string;
  nivel: string;
}

interface JobDescriptionType {
  id: string; nombre_cargo: string; empresa: string; area: string;
  jefe_inmediato: string | null; mision_cargo: string | null;
  funciones: Funcion[] | null;
  nivel_formacion: string | null; area_estudios: string | null;
  certificaciones: string | null; anios_experiencia: number;
  experiencia_descripcion: string | null;
  competencias_tecnicas: Competencia[] | null;
  competencias_conductuales: Competencia[] | null;
  elaborado_por_nombre: string | null; elaborado_por_cargo: string | null;
  fecha_elaboracion: string | null; estado: string;
  version_actual: number; vinculado_requisicion: boolean;
  versions: JobDescriptionVersionType[];
  created_at: string; updated_at: string;
}

interface JobDescriptionVersionType {
  id: string; version: number; estado: string;
  data: any; creado_por_nombre: string | null;
  created_at: string;
}

const emptyForm = () => ({
  nombre_cargo: '', empresa: '', area: '', jefe_inmediato: '',
  mision_cargo: '',
  funciones: [{ nombre: '', actividades: [''] }],
  nivel_formacion: '', area_estudios: '', certificaciones: '',
  anios_experiencia: '0', experiencia_descripcion: '',
  competencias_tecnicas: [{ nombre: '', nivel: 'Medio' }],
  competencias_conductuales: [{ nombre: '', nivel: 'Medio' }],
  elaborado_por_nombre: '', elaborado_por_cargo: '',
  fecha_elaboracion: new Date().toISOString().split('T')[0],
});

const estadoColors: Record<string, string> = {
  borrador: 'bg-gray-100 text-gray-600',
  en_revision: 'bg-blue-100 text-blue-700',
  aprobado: 'bg-green-100 text-green-700',
  desactualizado: 'bg-amber-100 text-amber-700',
};

const nivelFormacion = ['Bachillerato', 'Técnico', 'Tecnólogo', 'Universitario', 'Posgrado'];
const empresasList = ['Planta', 'Ventas de Campo', 'Distribución', 'Administración', 'Dispensario Médico'];

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-primary border-b pb-2">{title}</h3>
      {children}
    </div>
  );
}

export default function DescriptivosPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ empresa: '', area: '', estado: '' });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formTab, setFormTab] = useState('general');
  const [form, setForm] = useState(emptyForm());

  const [detailItem, setDetailItem] = useState<JobDescriptionType | null>(null);
  const [compareDialog, setCompareDialog] = useState<{ open: boolean; id: string; v1: number; v2: number } | null>(null);
  const [compareData, setCompareData] = useState<any>(null);

  const params: Record<string, string> = { ...filters };
  if (search) params.search = search;

  const { data: areas } = useQuery({
    queryKey: ['descriptivos-areas'],
    queryFn: async () => {
      const res = await get<{ data: string[] }>('/api/descriptivos/catalogos/areas');
      return res.data?.data || [];
    },
  });

  const { data: items = [], isLoading, refetch } = useQuery({
    queryKey: ['descriptivos', params],
    queryFn: async () => {
      const res = await get<{ data: JobDescriptionType[] }>('/api/descriptivos', params);
      return res.data?.data || [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = { ...form, anios_experiencia: parseInt(form.anios_experiencia) || 0 };
      if (editingId) {
        await put(`/api/descriptivos/${editingId}`, payload);
      } else {
        await post('/api/descriptivos', payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['descriptivos'] });
      toast({ title: editingId ? 'Descriptivo actualizado' : 'Descriptivo creado' });
      resetForm();
    },
    onError: (err: any) => toast({ title: 'Error', description: err?.response?.data?.message || err.message, variant: 'destructive' }),
  });

  const cambiarEstado = useMutation({
    mutationFn: async ({ id, estado }: { id: string; estado: string }) => {
      await post(`/api/descriptivos/${id}/cambiar-estado`, { estado });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['descriptivos'] });
      toast({ title: 'Estado actualizado' });
    },
    onError: (err: any) => toast({ title: 'Error', description: err?.response?.data?.message || err.message, variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await del(`/api/descriptivos/${id}`); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['descriptivos'] });
      toast({ title: 'Eliminado' });
    },
    onError: (err: any) => toast({ title: 'Error', description: err?.response?.data?.message || err.message, variant: 'destructive' }),
  });

  const resetForm = () => {
    setDialogOpen(false);
    setEditingId(null);
    setForm(emptyForm());
    setFormTab('general');
  };

  const openEdit = async (id: string) => {
    const res = await get<{ data: JobDescriptionType }>(`/api/descriptivos/${id}`);
    const jd = res.data?.data;
    if (!jd) return;
    setForm({
      nombre_cargo: jd.nombre_cargo, empresa: jd.empresa, area: jd.area,
      jefe_inmediato: jd.jefe_inmediato || '', mision_cargo: jd.mision_cargo || '',
      funciones: jd.funciones && jd.funciones.length > 0 ? jd.funciones : [{ nombre: '', actividades: [''] }],
      nivel_formacion: jd.nivel_formacion || '', area_estudios: jd.area_estudios || '',
      certificaciones: jd.certificaciones || '', anios_experiencia: String(jd.anios_experiencia),
      experiencia_descripcion: jd.experiencia_descripcion || '',
      competencias_tecnicas: jd.competencias_tecnicas && jd.competencias_tecnicas.length > 0 ? jd.competencias_tecnicas : [{ nombre: '', nivel: 'Medio' }],
      competencias_conductuales: jd.competencias_conductuales && jd.competencias_conductuales.length > 0 ? jd.competencias_conductuales : [{ nombre: '', nivel: 'Medio' }],
      elaborado_por_nombre: jd.elaborado_por_nombre || user?.display_name || '',
      elaborado_por_cargo: jd.elaborado_por_cargo || '',
      fecha_elaboracion: jd.fecha_elaboracion || new Date().toISOString().split('T')[0],
    });
    setEditingId(id);
    setFormTab('general');
    setDialogOpen(true);
  };

  const addFuncion = () => {
    setForm(p => ({ ...p, funciones: [...(p.funciones || []), { nombre: '', actividades: [''] }] }));
  };
  const updFuncion = (i: number, f: Partial<Funcion>) => {
    const fs = [...(form.funciones || [])];
    fs[i] = { ...fs[i], ...f };
    setForm(p => ({ ...p, funciones: fs }));
  };
  const addActividad = (fi: number) => {
    const fs = [...(form.funciones || [])];
    fs[fi] = { ...fs[fi], actividades: [...fs[fi].actividades, ''] };
    setForm(p => ({ ...p, funciones: fs }));
  };

  const addCompetencia = (field: 'competencias_tecnicas' | 'competencias_conductuales') => {
    setForm(p => ({ ...p, [field]: [...(p[field] || []), { nombre: '', nivel: 'Medio' }] }));
  };
  const updCompetencia = (field: 'competencias_tecnicas' | 'competencias_conductuales', i: number, c: Partial<Competencia>) => {
    const list = [...(form[field] || [])];
    list[i] = { ...list[i], ...c };
    setForm(p => ({ ...p, [field]: list }));
  };

  const openCompare = async (id: string, v1: number, v2: number) => {
    const res = await get<{ data: any }>(`/api/descriptivos/${id}/comparar/${v1}/${v2}`);
    setCompareData(res.data?.data);
    setCompareDialog({ open: true, id, v1, v2 });
  };

  const filteredEmpresas = [...new Set(items.map(i => i.empresa))];
  const filteredAreas = [...new Set(items.map(i => i.area))];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Descriptivos de Cargo</h1>
          <p className="text-muted-foreground">Repositorio digital de descriptivos de cargo — Confiteca</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={o => { setDialogOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingId(null); setForm({ ...emptyForm(), elaborado_por_nombre: user?.display_name || '' }); setDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-1" /> Nuevo Descriptivo
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-4xl max-h-[90vh]">
            <DialogHeader><DialogTitle>{editingId ? 'Editar Descriptivo' : 'Nuevo Descriptivo de Cargo'}</DialogTitle>
              <DialogDescription>Formulario oficial de levantamiento de cargo — Confiteca</DialogDescription>
            </DialogHeader>
            <Tabs value={formTab} onValueChange={setFormTab}>
              <TabsList className="grid grid-cols-4">
                <TabsTrigger value="general">Datos</TabsTrigger>
                <TabsTrigger value="mision">Misión</TabsTrigger>
                <TabsTrigger value="funciones">Funciones</TabsTrigger>
                <TabsTrigger value="perfil">Perfil</TabsTrigger>
              </TabsList>
              <ScrollArea className="max-h-[65vh] px-1">
                <TabsContent value="general" className="mt-4 space-y-6">
                  <FormSection title="Datos Generales">
                    <div className="grid grid-cols-2 gap-4">
                      <div><Label>Nombre del cargo *</Label><Input value={form.nombre_cargo} onChange={e => setForm(p => ({ ...p, nombre_cargo: e.target.value }))} /></div>
                      <div><Label>Empresa *</Label>
                        <Select value={form.empresa} onValueChange={v => setForm(p => ({ ...p, empresa: v }))}>
                          <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                          <SelectContent>{empresasList.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div><Label>Área *</Label>
                        <Select value={form.area} onValueChange={v => setForm(p => ({ ...p, area: v }))}>
                          <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                          <SelectContent>{(areas || []).map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div><Label>Jefe inmediato</Label><Input value={form.jefe_inmediato} onChange={e => setForm(p => ({ ...p, jefe_inmediato: e.target.value }))} /></div>
                    </div>
                  </FormSection>
                  <FormSection title="Datos de quien completa">
                    <div className="grid grid-cols-2 gap-4">
                      <div><Label>Nombre</Label><Input value={form.elaborado_por_nombre} onChange={e => setForm(p => ({ ...p, elaborado_por_nombre: e.target.value }))} /></div>
                      <div><Label>Cargo</Label><Input value={form.elaborado_por_cargo} onChange={e => setForm(p => ({ ...p, elaborado_por_cargo: e.target.value }))} /></div>
                      <div><Label>Fecha</Label><Input type="date" value={form.fecha_elaboracion} onChange={e => setForm(p => ({ ...p, fecha_elaboracion: e.target.value }))} /></div>
                    </div>
                  </FormSection>
                  <div className="flex justify-end"><Button onClick={() => setFormTab('mision')}>Siguiente →</Button></div>
                </TabsContent>

                <TabsContent value="mision" className="mt-4 space-y-6">
                  <FormSection title="Misión del Cargo">
                    <div><Label>Propósito principal del cargo</Label>
                      <Textarea value={form.mision_cargo} onChange={e => setForm(p => ({ ...p, mision_cargo: e.target.value }))} rows={4} placeholder="Describe en 2-3 líneas el propósito principal del cargo..." />
                    </div>
                  </FormSection>
                  <div className="flex justify-between">
                    <Button variant="outline" onClick={() => setFormTab('general')}>← Anterior</Button>
                    <Button onClick={() => setFormTab('funciones')}>Siguiente →</Button>
                  </div>
                </TabsContent>

                <TabsContent value="funciones" className="mt-4 space-y-6">
                  <FormSection title="Funciones y Actividades">
                    {(form.funciones || []).map((fn, fi) => (
                      <div key={fi} className="border rounded-lg p-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground font-mono">Macro-función {fi + 1}</span>
                          <Input value={fn.nombre} onChange={e => updFuncion(fi, { nombre: e.target.value })} placeholder="Nombre de la macro-función" className="flex-1" />
                          {(form.funciones?.length || 0) > 1 && (
                            <Button variant="ghost" size="sm" className="text-red-500 h-8" onClick={() => setForm(p => ({ ...p, funciones: (p.funciones || []).filter((_, j) => j !== fi) }))}>×</Button>
                          )}
                        </div>
                        {fn.actividades.map((act, ai) => (
                          <div key={ai} className="flex items-center gap-2 ml-6">
                            <span className="text-xs text-muted-foreground font-mono">{fi + 1}.{ai + 1}</span>
                            <Input value={act} onChange={e => {
                              const acts = [...fn.actividades];
                              acts[ai] = e.target.value;
                              updFuncion(fi, { actividades: acts });
                            }} placeholder="Describe la actividad..." className="flex-1" />
                            {fn.actividades.length > 1 && (
                              <Button variant="ghost" size="sm" className="h-7 w-7 text-red-400" onClick={() => {
                                const acts = fn.actividades.filter((_, j) => j !== ai);
                                updFuncion(fi, { actividades: acts });
                              }}>×</Button>
                            )}
                          </div>
                        ))}
                        {fn.actividades.length < 6 && (
                          <Button variant="ghost" size="sm" className="ml-6" onClick={() => addActividad(fi)}>+ Actividad</Button>
                        )}
                      </div>
                    ))}
                    {(form.funciones?.length || 0) < 6 && (
                      <Button variant="outline" onClick={addFuncion} className="w-full"><Plus className="h-4 w-4 mr-1" /> Agregar macro-función</Button>
                    )}
                  </FormSection>
                  <div className="flex justify-between">
                    <Button variant="outline" onClick={() => setFormTab('mision')}>← Anterior</Button>
                    <Button onClick={() => setFormTab('perfil')}>Siguiente →</Button>
                  </div>
                </TabsContent>

                <TabsContent value="perfil" className="mt-4 space-y-6">
                  <FormSection title="Formación Académica">
                    <div className="grid grid-cols-2 gap-4">
                      <div><Label>Nivel requerido</Label>
                        <Select value={form.nivel_formacion} onValueChange={v => setForm(p => ({ ...p, nivel_formacion: v }))}>
                          <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                          <SelectContent>{nivelFormacion.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div><Label>Área de estudios</Label><Input value={form.area_estudios} onChange={e => setForm(p => ({ ...p, area_estudios: e.target.value }))} /></div>
                    </div>
                    <div><Label>Certificaciones deseables</Label><Textarea value={form.certificaciones} onChange={e => setForm(p => ({ ...p, certificaciones: e.target.value }))} rows={2} /></div>
                  </FormSection>

                  <FormSection title="Experiencia Mínima">
                    <div className="grid grid-cols-3 gap-4">
                      <div><Label>Años de experiencia</Label><Input type="number" min="0" value={form.anios_experiencia} onChange={e => setForm(p => ({ ...p, anios_experiencia: e.target.value }))} /></div>
                      <div className="col-span-2"><Label>Funciones / Cargos / Sectores</Label>
                        <Textarea value={form.experiencia_descripcion} onChange={e => setForm(p => ({ ...p, experiencia_descripcion: e.target.value }))} rows={2} />
                      </div>
                    </div>
                  </FormSection>

                  <FormSection title="Competencias Técnicas">
                    {(form.competencias_tecnicas || []).map((c, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <Input value={c.nombre} onChange={e => updCompetencia('competencias_tecnicas', i, { nombre: e.target.value })} placeholder="Competencia" className="flex-1" />
                        <Select value={c.nivel} onValueChange={v => updCompetencia('competencias_tecnicas', i, { nivel: v })}>
                          <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                          <SelectContent>{['Alto', 'Medio', 'Bajo'].map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent>
                        </Select>
                        <Button variant="ghost" size="sm" className="text-red-500 h-8" onClick={() => setForm(p => ({ ...p, competencias_tecnicas: (p.competencias_tecnicas || []).filter((_, j) => j !== i) }))}>×</Button>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={() => addCompetencia('competencias_tecnicas')}><Plus className="h-3 w-3 mr-1" /> Agregar</Button>
                  </FormSection>

                  <FormSection title="Competencias Conductuales">
                    {(form.competencias_conductuales || []).map((c, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <Input value={c.nombre} onChange={e => updCompetencia('competencias_conductuales', i, { nombre: e.target.value })} placeholder="Competencia" className="flex-1" />
                        <Select value={c.nivel} onValueChange={v => updCompetencia('competencias_conductuales', i, { nivel: v })}>
                          <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                          <SelectContent>{['Alto', 'Medio', 'Bajo'].map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent>
                        </Select>
                        <Button variant="ghost" size="sm" className="text-red-500 h-8" onClick={() => setForm(p => ({ ...p, competencias_conductuales: (p.competencias_conductuales || []).filter((_, j) => j !== i) }))}>×</Button>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={() => addCompetencia('competencias_conductuales')}><Plus className="h-3 w-3 mr-1" /> Agregar</Button>
                  </FormSection>

                  <div className="flex justify-between pt-4 border-t">
                    <Button variant="outline" onClick={() => setFormTab('funciones')}>← Anterior</Button>
                    <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !form.nombre_cargo || !form.empresa || !form.area}>
                      {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                      {editingId ? 'Guardar Cambios' : 'Crear Descriptivo'}
                    </Button>
                  </div>
                </TabsContent>
              </ScrollArea>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm font-medium">Filtros y Búsqueda</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3 items-end">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nombre de cargo..." className="pl-9" />
            </div>
            <Select value={filters.empresa} onValueChange={v => setFilters(p => ({ ...p, empresa: v === 'all' ? '' : v }))}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Empresa" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {filteredEmpresas.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filters.area} onValueChange={v => setFilters(p => ({ ...p, area: v === 'all' ? '' : v }))}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Área" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {filteredAreas.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filters.estado} onValueChange={v => setFilters(p => ({ ...p, estado: v === 'all' ? '' : v }))}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Estado" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="borrador">Borrador</SelectItem>
                <SelectItem value="en_revision">En revisión</SelectItem>
                <SelectItem value="aprobado">Aprobado</SelectItem>
                <SelectItem value="desactualizado">Desactualizado</SelectItem>
              </SelectContent>
            </Select>
            {(filters.empresa || filters.area || filters.estado || search) && (
              <Button variant="ghost" size="sm" onClick={() => { setFilters({ empresa: '', area: '', estado: '' }); setSearch(''); }}>Limpiar</Button>
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
                <TableHead>Versión</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Actualización</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
              ) : items.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No hay descriptivos de cargo.</TableCell></TableRow>
              ) : items.map(jd => (
                <TableRow key={jd.id}>
                  <TableCell className="font-medium">{jd.nombre_cargo}</TableCell>
                  <TableCell>{jd.empresa}</TableCell>
                  <TableCell>{jd.area}</TableCell>
                  <TableCell><Badge variant="outline">v{jd.version_actual}</Badge></TableCell>
                  <TableCell>
                    <Badge className={estadoColors[jd.estado] || ''}>
                      {jd.estado === 'en_revision' ? 'En revisión' : jd.estado}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(jd.updated_at).toLocaleDateString('es-AR')}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={async () => {
                        const res = await get<{ data: JobDescriptionType }>(`/api/descriptivos/${jd.id}`);
                        setDetailItem(res.data?.data || null);
                      }}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(jd.id)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {jd.versions && jd.versions.length >= 2 && (
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openCompare(jd.id, jd.versions[jd.versions.length - 1].version, jd.version_actual)}>
                          <GitCompare className="h-4 w-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => {
                        if (confirm(`Eliminar descriptivo "${jd.nombre_cargo}"?`)) deleteMutation.mutate(jd.id);
                      }}>
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!detailItem} onOpenChange={o => { if (!o) setDetailItem(null); }}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh]">
          <DialogHeader><DialogTitle>Descriptivo de Cargo</DialogTitle></DialogHeader>
          {detailItem && (
            <ScrollArea className="max-h-[70vh] pr-4">
              <div className="space-y-6">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-lg">{detailItem.nombre_cargo}</span>
                  <Badge className={estadoColors[detailItem.estado] || ''}>{detailItem.estado}</Badge>
                  <Badge variant="outline">v{detailItem.version_actual}</Badge>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div><span className="text-muted-foreground">Empresa</span><p className="font-medium">{detailItem.empresa}</p></div>
                  <div><span className="text-muted-foreground">Área</span><p className="font-medium">{detailItem.area}</p></div>
                  <div><span className="text-muted-foreground">Jefe inmediato</span><p>{detailItem.jefe_inmediato || '—'}</p></div>
                  <div><span className="text-muted-foreground">Fecha</span><p>{detailItem.fecha_elaboracion ? new Date(detailItem.fecha_elaboracion).toLocaleDateString('es-AR') : '—'}</p></div>
                </div>

                {detailItem.mision_cargo && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">Misión del Cargo</h4>
                      <p className="text-sm whitespace-pre-wrap">{detailItem.mision_cargo}</p>
                    </div>
                  </>
                )}

                {detailItem.funciones && detailItem.funciones.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">Funciones y Actividades</h4>
                      <div className="space-y-3">
                        {detailItem.funciones.map((fn, fi) => (
                          <div key={fi} className="border rounded-lg p-3">
                            <p className="font-medium text-sm">{fi + 1}. {fn.nombre}</p>
                            <ol className="list-decimal list-inside text-sm text-muted-foreground mt-1 space-y-0.5">
                              {fn.actividades.map((act, ai) => <li key={ai}>{act}</li>)}
                            </ol>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <Separator />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Formación</h4>
                    <p className="text-sm">{detailItem.nivel_formacion || '—'} {detailItem.area_estudios ? `— ${detailItem.area_estudios}` : ''}</p>
                    {detailItem.certificaciones && <p className="text-sm text-muted-foreground mt-1">{detailItem.certificaciones}</p>}
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Experiencia</h4>
                    <p className="text-sm">{detailItem.anios_experiencia} año(s)</p>
                    {detailItem.experiencia_descripcion && <p className="text-sm text-muted-foreground mt-1">{detailItem.experiencia_descripcion}</p>}
                  </div>
                </div>

                {detailItem.competencias_tecnicas && detailItem.competencias_tecnicas.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1"><Star className="h-3 w-3" /> Competencias Técnicas</h4>
                      <div className="flex flex-wrap gap-2">{detailItem.competencias_tecnicas.map((c, i) => (
                        <Badge key={i} variant="secondary">{c.nombre}: <span className="font-semibold">{c.nivel}</span></Badge>
                      ))}</div>
                    </div>
                  </>
                )}

                {detailItem.competencias_conductuales && detailItem.competencias_conductuales.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1"><Award className="h-3 w-3" /> Competencias Conductuales</h4>
                      <div className="flex flex-wrap gap-2">{detailItem.competencias_conductuales.map((c, i) => (
                        <Badge key={i} variant="secondary">{c.nombre}: <span className="font-semibold">{c.nivel}</span></Badge>
                      ))}</div>
                    </div>
                  </>
                )}

                <Separator />
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-muted-foreground">Elaborado por</span><p className="font-medium">{detailItem.elaborado_por_nombre || '—'} {detailItem.elaborado_por_cargo ? `(${detailItem.elaborado_por_cargo})` : ''}</p></div>
                </div>

                {detailItem.versions && detailItem.versions.length > 1 && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1"><History className="h-3 w-3" /> Historial de Versiones</h4>
                      <div className="space-y-1">
                        {detailItem.versions.map(v => (
                          <div key={v.id} className="flex items-center justify-between text-sm border rounded px-3 py-2">
                            <span className="font-mono">v{v.version}</span>
                            <Badge className={estadoColors[v.estado] || ''}>{v.estado}</Badge>
                            <span className="text-muted-foreground">{v.creado_por_nombre || '—'}</span>
                            <span className="text-muted-foreground text-xs">{new Date(v.created_at).toLocaleDateString('es-AR')}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {detailItem.estado !== 'aprobado' && (
                  <div className="flex gap-2 pt-2">
                    {detailItem.estado === 'borrador' && (
                      <Button onClick={() => cambiarEstado.mutate({ id: detailItem.id, estado: 'en_revision' })}>
                        <Clock className="h-4 w-4 mr-1" /> Enviar a revisión
                      </Button>
                    )}
                    {detailItem.estado === 'en_revision' && (
                      <Button onClick={() => cambiarEstado.mutate({ id: detailItem.id, estado: 'aprobado' })}>
                        <CheckCircle className="h-4 w-4 mr-1" /> Aprobar
                      </Button>
                    )}
                    {detailItem.estado !== 'aprobado' && detailItem.estado !== 'desactualizado' && (
                      <Button variant="destructive" onClick={() => {
                        if (confirm('Rechazar este descriptivo?')) cambiarEstado.mutate({ id: detailItem.id, estado: 'borrador' });
                      }}>Rechazar</Button>
                    )}
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={compareDialog?.open || false} onOpenChange={o => { if (!o) { setCompareDialog(null); setCompareData(null); }}}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh]">
          <DialogHeader><DialogTitle>Comparar Versiones</DialogTitle></DialogHeader>
          {compareData && (
            <ScrollArea className="max-h-[70vh] pr-4">
              <div className="space-y-4">
                <p className="font-medium">{compareData.cargo} — {compareData.empresa}</p>
                <div className="grid grid-cols-2 gap-4">
                  <Card><CardHeader className="pb-2"><CardTitle className="text-sm">v{compareData.version_1.version}</CardTitle></CardHeader>
                    <CardContent className="text-sm"><EstadoBadge estado={compareData.version_1.estado} /><pre className="mt-2 text-xs whitespace-pre-wrap">{JSON.stringify(compareData.version_1.data, null, 2)}</pre></CardContent>
                  </Card>
                  <Card><CardHeader className="pb-2"><CardTitle className="text-sm">v{compareData.version_2.version}</CardTitle></CardHeader>
                    <CardContent className="text-sm"><EstadoBadge estado={compareData.version_2.estado} /><pre className="mt-2 text-xs whitespace-pre-wrap">{JSON.stringify(compareData.version_2.data, null, 2)}</pre></CardContent>
                  </Card>
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EstadoBadge({ estado }: { estado: string }) {
  const colors: Record<string, string> = {
    borrador: 'bg-gray-100 text-gray-600', en_revision: 'bg-blue-100 text-blue-700',
    aprobado: 'bg-green-100 text-green-700', desactualizado: 'bg-amber-100 text-amber-700',
  };
  return <Badge className={colors[estado] || ''}>{estado}</Badge>;
}
