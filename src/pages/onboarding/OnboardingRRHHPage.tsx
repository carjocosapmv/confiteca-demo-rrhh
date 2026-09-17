import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { get, post, put, del } from '@/lib/api-client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Users, PlayCircle, Loader2, CheckCircle2, Circle, UserPlus, UserCheck, BookOpen, Plus, Pencil, Trash2, GripVertical, RotateCcw, Heart, Building2, FileText, Shield, Monitor, GraduationCap, TrendingUp, Gift } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const ICON_OPTIONS = ['Heart', 'Building2', 'FileText', 'Shield', 'Monitor', 'GraduationCap', 'TrendingUp', 'Gift'];

interface ChapterProgress {
  id: string;
  titulo: string;
  total: number;
  watched: number;
}

interface EmployeeVideo {
  id: string;
  titulo: string;
  chapter_id: string | null;
  watched_at: string;
}

interface EmployeeProgress {
  id: string;
  display_name: string;
  email: string;
  hire_date: string | null;
  progress: number;
  watched: number;
  total_videos: number;
  chapters: ChapterProgress[];
  videos: EmployeeVideo[];
}

interface AssignedUser {
  id: string;
  display_name: string;
  email: string;
  onboarding_assigned: boolean;
}

interface Chapter {
  id: string;
  titulo: string;
  descripcion: string;
  icono: string;
  orden: number;
  activo: boolean;
  videos: Video[];
}

interface Video {
  id: string;
  titulo: string;
  descripcion: string;
  url: string;
  duracion_minutos: number;
  orden: number;
  activo: boolean;
  chapter_id: string;
}

type Tab = 'progreso' | 'asignaciones' | 'contenido';

export default function OnboardingRRHHPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>('progreso');

  const [chapterDialog, setChapterDialog] = useState<{ open: boolean; edit?: Chapter }>({ open: false });
  const [chapterForm, setChapterForm] = useState({ titulo: '', descripcion: '', icono: 'Heart', orden: 0 });

  const [videoDialog, setVideoDialog] = useState<{ open: boolean; chapterId?: string; edit?: Video }>({ open: false });
  const [videoForm, setVideoForm] = useState({ chapter_id: '', titulo: '', descripcion: '', url: '', duracion_minutos: 5, orden: 0 });

  const { data: employees, isLoading } = useQuery<EmployeeProgress[]>({
    queryKey: ['onboarding-rrhh'],
    queryFn: async () => {
      const res = await get<EmployeeProgress[]>('/api/onboarding/rrhh');
      return res.data ?? [];
    },
  });

  const { data: allUsers = [] } = useQuery<AssignedUser[]>({
    queryKey: ['onboarding-assigned-users'],
    queryFn: async () => {
      const res = await get<AssignedUser[]>('/api/onboarding/assigned-users');
      return res.data ?? [];
    },
  });

  const { data: chapters = [], refetch: refetchChapters } = useQuery<Chapter[]>({
    queryKey: ['onboarding-admin-chapters'],
    queryFn: async () => {
      const res = await get<Chapter[]>('/api/onboarding/admin/chapters');
      return res.data ?? [];
    },
  });

  const toggleAssign = useMutation({
    mutationFn: async ({ userId, assigned }: { userId: string; assigned: boolean }) => {
      await post(`/api/onboarding/users/${userId}/toggle-assignment`, { assigned });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding-assigned-users'] });
      queryClient.invalidateQueries({ queryKey: ['onboarding-rrhh'] });
    },
    onError: (err: any) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  const saveChapter = useMutation({
    mutationFn: async () => {
      if (chapterDialog.edit) {
        await put(`/api/onboarding/admin/chapters/${chapterDialog.edit.id}`, chapterForm);
      } else {
        await post('/api/onboarding/admin/chapters', chapterForm);
      }
    },
    onSuccess: () => {
      refetchChapters();
      setChapterDialog({ open: false });
      setChapterForm({ titulo: '', descripcion: '', icono: 'Heart', orden: 0 });
      toast({ title: chapterDialog.edit ? 'Capítulo actualizado' : 'Capítulo creado' });
    },
    onError: (err: any) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  const deleteChapter = useMutation({
    mutationFn: async (chapterId: string) => {
      await del(`/api/onboarding/admin/chapters/${chapterId}`);
    },
    onSuccess: () => {
      refetchChapters();
      queryClient.invalidateQueries({ queryKey: ['onboarding-videos'] });
      toast({ title: 'Capítulo eliminado' });
    },
    onError: (err: any) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  const saveVideo = useMutation({
    mutationFn: async () => {
      if (videoDialog.edit) {
        await put(`/api/onboarding/admin/videos/${videoDialog.edit.id}`, videoForm);
      } else {
        await post('/api/onboarding/admin/videos', videoForm);
      }
    },
    onSuccess: () => {
      refetchChapters();
      queryClient.invalidateQueries({ queryKey: ['onboarding-videos'] });
      setVideoDialog({ open: false });
      setVideoForm({ chapter_id: '', titulo: '', descripcion: '', url: '', duracion_minutos: 5, orden: 0 });
      toast({ title: videoDialog.edit ? 'Video actualizado' : 'Video creado' });
    },
    onError: (err: any) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  const deleteVideo = useMutation({
    mutationFn: async (videoId: string) => {
      await del(`/api/onboarding/admin/videos/${videoId}`);
    },
    onSuccess: () => {
      refetchChapters();
      queryClient.invalidateQueries({ queryKey: ['onboarding-videos'] });
      toast({ title: 'Video eliminado' });
    },
  });

  const resetProgress = useMutation({
    mutationFn: async (userId: string) => {
      await post(`/api/onboarding/admin/users/${userId}/reset-progress`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding-rrhh'] });
      toast({ title: 'Progreso reiniciado' });
    },
  });

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  const inOnboarding = employees?.filter((e) => e.progress < 100) ?? [];
  const completed = employees?.filter((e) => e.progress >= 100) ?? [];
  const assignedCount = allUsers.filter((u) => u.onboarding_assigned).length;

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: 'progreso', label: 'Progreso', icon: PlayCircle },
    { key: 'asignaciones', label: 'Asignaciones', icon: UserPlus },
    { key: 'contenido', label: 'Contenido', icon: BookOpen },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Progreso de Inducciones</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {assignedCount} colaborador{assignedCount !== 1 ? 'es' : ''} asignado{assignedCount !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="flex gap-1 border-b">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>

      {tab === 'asignaciones' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-primary" />
              Asignar inducción a colaboradores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Asignado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allUsers.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.display_name || '—'}</TableCell>
                    <TableCell className="text-muted-foreground">{u.email}</TableCell>
                    <TableCell>
                      <Switch checked={u.onboarding_assigned} onCheckedChange={(c) => toggleAssign.mutate({ userId: u.id, assigned: c })} disabled={toggleAssign.isPending} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {tab === 'contenido' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={chapterDialog.open} onOpenChange={(open) => { if (!open) setChapterDialog({ open: false }); }}>
              <DialogTrigger asChild>
                <Button size="sm" onClick={() => { setChapterForm({ titulo: '', descripcion: '', icono: 'Heart', orden: chapters.length + 1 }); setChapterDialog({ open: true, edit: undefined }); }}>
                  <Plus className="h-4 w-4 mr-1" /> Nuevo capítulo
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>{chapterDialog.edit ? 'Editar capítulo' : 'Nuevo capítulo'}</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div><Label>Título</Label><Input value={chapterForm.titulo} onChange={e => setChapterForm(p => ({ ...p, titulo: e.target.value }))} /></div>
                  <div><Label>Descripción</Label><Textarea value={chapterForm.descripcion} onChange={e => setChapterForm(p => ({ ...p, descripcion: e.target.value }))} /></div>
                  <div>
                    <Label>Icono</Label>
                    <Select value={chapterForm.icono} onValueChange={v => setChapterForm(p => ({ ...p, icono: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {ICON_OPTIONS.map(ico => <SelectItem key={ico} value={ico}>{ico}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Orden</Label><Input type="number" value={chapterForm.orden} onChange={e => setChapterForm(p => ({ ...p, orden: parseInt(e.target.value) || 0 }))} /></div>
                  <Button className="w-full" onClick={() => saveChapter.mutate()} disabled={!chapterForm.titulo || saveChapter.isPending}>
                    {chapterDialog.edit ? 'Guardar cambios' : 'Crear capítulo'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {chapters.length === 0 && (
            <Card><CardContent className="p-6 text-center text-muted-foreground text-sm">No hay capítulos creados.</CardContent></Card>
          )}

          {chapters.map((ch) => {
            const totalVids = ch.videos?.length ?? 0;
            const activeVids = ch.videos?.filter(v => v.activo) ?? [];
            return (
              <Card key={ch.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                        <BookOpen className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{ch.titulo}</CardTitle>
                        {ch.descripcion && <p className="text-sm text-muted-foreground">{ch.descripcion}</p>}
                        <p className="text-xs text-muted-foreground mt-0.5">Orden {ch.orden} · {totalVids} videos{!ch.activo ? ' · Inactivo' : ''}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8"
                        onClick={() => {
                          setVideoForm({ chapter_id: ch.id, titulo: '', descripcion: '', url: '', duracion_minutos: 5, orden: activeVids.length + 1 });
                          setVideoDialog({ open: true, chapterId: ch.id });
                        }}>
                        <Plus className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8"
                        onClick={() => {
                          setChapterForm({ titulo: ch.titulo, descripcion: ch.descripcion || '', icono: ch.icono || 'Heart', orden: ch.orden });
                          setChapterDialog({ open: true, edit: ch });
                        }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"
                        onClick={() => { if (confirm('Eliminar este capítulo y todos sus videos?')) deleteChapter.mutate(ch.id); }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {totalVids === 0 ? (
                    <p className="text-sm text-muted-foreground italic">Sin videos. Agrega el primero.</p>
                  ) : (
                    <div className="space-y-1">
                      {ch.videos.map((v) => (
                        <div key={v.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                          <div className="flex-1 min-w-0">
                            <span className={`font-medium ${!v.activo ? 'text-muted-foreground line-through' : ''}`}>{v.titulo}</span>
                            <span className="text-muted-foreground ml-2">{v.duracion_minutos}min</span>
                          </div>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7"
                              onClick={() => {
                                setVideoForm({ chapter_id: v.chapter_id, titulo: v.titulo, descripcion: v.descripcion || '', url: v.url || '', duracion_minutos: v.duracion_minutos, orden: v.orden });
                                setVideoDialog({ open: true, chapterId: v.chapter_id, edit: v });
                              }}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"
                              onClick={() => { if (confirm('Eliminar este video?')) deleteVideo.mutate(v.id); }}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}

          <Dialog open={videoDialog.open} onOpenChange={(open) => { if (!open) setVideoDialog({ open: false }); }}>
            <DialogContent>
              <DialogHeader><DialogTitle>{videoDialog.edit ? 'Editar video' : 'Nuevo video'}</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>Título</Label><Input value={videoForm.titulo} onChange={e => setVideoForm(p => ({ ...p, titulo: e.target.value }))} /></div>
                <div><Label>Descripción</Label><Textarea value={videoForm.descripcion} onChange={e => setVideoForm(p => ({ ...p, descripcion: e.target.value }))} /></div>
                <div><Label>URL (YouTube embed)</Label><Input value={videoForm.url} onChange={e => setVideoForm(p => ({ ...p, url: e.target.value }))} placeholder="https://www.youtube.com/embed/..." /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Duración (min)</Label><Input type="number" value={videoForm.duracion_minutos} onChange={e => setVideoForm(p => ({ ...p, duracion_minutos: parseInt(e.target.value) || 0 }))} /></div>
                  <div><Label>Orden</Label><Input type="number" value={videoForm.orden} onChange={e => setVideoForm(p => ({ ...p, orden: parseInt(e.target.value) || 0 }))} /></div>
                </div>
                <Button className="w-full" onClick={() => saveVideo.mutate()} disabled={!videoForm.titulo || saveVideo.isPending}>
                  {videoDialog.edit ? 'Guardar cambios' : 'Crear video'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {tab === 'progreso' && (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Asignados</CardTitle>
                <UserCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent><p className="text-2xl font-bold">{assignedCount}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">En inducción</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent><p className="text-2xl font-bold">{inOnboarding.length}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Completaron</CardTitle>
                <PlayCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent><p className="text-2xl font-bold">{completed.length}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total videos</CardTitle>
                <PlayCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent><p className="text-2xl font-bold">{employees?.[0]?.total_videos ?? 0}</p></CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Colaboradores asignados</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Ingreso</TableHead>
                    <TableHead>Progreso</TableHead>
                    <TableHead>Capítulos</TableHead>
                    <TableHead>Videos</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(!employees || employees.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        Ningún colaborador asignado.
                      </TableCell>
                    </TableRow>
                  )}
                  {employees?.map((emp) => (
                    <TableRow key={emp.id}>
                      <TableCell className="font-medium">{emp.display_name}</TableCell>
                      <TableCell className="text-muted-foreground">{emp.email}</TableCell>
                      <TableCell>{emp.hire_date ? new Date(emp.hire_date).toLocaleDateString('es-AR') : '—'}</TableCell>
                      <TableCell>
                        <Tooltip>
                          <TooltipTrigger className="w-full max-w-[160px]">
                            <div className="flex items-center gap-2">
                              <Progress value={emp.progress} className="h-2 flex-1" />
                              <span className="text-xs tabular-nums w-10 text-right">{emp.progress}%</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="space-y-1 max-w-xs">
                            {emp.videos.length === 0 ? (
                              <p className="text-xs">Sin videos vistos</p>
                            ) : (
                              emp.videos.slice(0, 5).map((v) => (
                                <p key={v.id} className="text-xs"><Badge variant="outline" className="mr-1 text-[10px] px-1 py-0">✓</Badge>{v.titulo}</p>
                              ))
                            )}
                            {emp.videos.length > 5 && <p className="text-xs text-muted-foreground">+{emp.videos.length - 5} más</p>}
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {emp.chapters.map((ch) => (
                            <Tooltip key={ch.id}>
                              <TooltipTrigger>
                                {ch.watched >= ch.total ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : ch.watched > 0 ? <Circle className="h-4 w-4 text-amber-400" /> : <Circle className="h-4 w-4 text-muted-foreground/30" />}
                              </TooltipTrigger>
                              <TooltipContent side="top">
                                <p className="text-xs font-medium">{ch.titulo}</p>
                                <p className="text-xs text-muted-foreground">{ch.watched}/{ch.total} videos</p>
                              </TooltipContent>
                            </Tooltip>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="tabular-nums">{emp.watched} / {emp.total_videos}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground"
                          onClick={() => { if (confirm('Reiniciar progreso de este colaborador?')) resetProgress.mutate(emp.id); }}>
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
