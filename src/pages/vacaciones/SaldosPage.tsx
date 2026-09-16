import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { get, post, put } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';
import { Edit, CalendarDays, Briefcase } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';

const SaldosPage = () => {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingVacation, setEditingVacation] = useState<any>(null);
  const [editingRemote, setEditingRemote] = useState<any>(null);
  const [vacDays, setVacDays] = useState('');
  const [vacUsed, setVacUsed] = useState('');
  const [vacWeekendUses, setVacWeekendUses] = useState('');
  const [vacRenewal, setVacRenewal] = useState('');
  const [remoteDays, setRemoteDays] = useState('6');
  const [remoteUsed, setRemoteUsed] = useState('');
  const [remoteRenewal, setRemoteRenewal] = useState('');

  const { data: users = [] } = useQuery({
    queryKey: ['adminBalanceUsers'],
    queryFn: async () => {
      // TODO: profiles endpoint in Laravel; for now return empty
      // In a real migration, you'd fetch users from /api/users and join with balances
      const [vacRes, remoteRes] = await Promise.all([
        get<any[]>('/api/vacation-balances', { year: new Date().getFullYear() }),
        get<any[]>('/api/remote-work-balances'),
      ]);
      const vacations = vacRes.data || [];
      const remotes = remoteRes.data || [];

      // Group by user_id
      const userMap = new Map<string, any>();
      for (const v of vacations) {
        if (!userMap.has(v.user_id)) userMap.set(v.user_id, {
          user_id: v.user_id,
          display_name: v.user?.display_name || '',
          email: v.user?.email || '',
        });
        userMap.get(v.user_id)!.vacation = v;
      }
      for (const r of remotes) {
        if (!userMap.has(r.user_id)) userMap.set(r.user_id, {
          user_id: r.user_id,
          display_name: r.user?.display_name || '',
          email: r.user?.email || '',
        });
        userMap.get(r.user_id)!.remote = r;
      }
      return Array.from(userMap.values());
    },
  });

  const saveVacation = useMutation({
    mutationFn: async ({ userId, totalDays, usedDays, weekendUses, renewalDate }: any) => {
      const existing = users.find((u: any) => u.user_id === userId)?.vacation;
      const payload = {
        user_id: userId, total_days: totalDays, used_days: usedDays,
        weekend_rule_uses: weekendUses, renewal_date: renewalDate || null, year: new Date().getFullYear(),
      };
      if (existing) {
        await put(`/api/vacation-balances/${existing.id}`, payload);
      } else {
        await post('/api/vacation-balances', payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminBalanceUsers'] });
      toast({ title: 'Saldo de vacaciones actualizado' });
      setEditingVacation(null);
    },
    onError: (err: any) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  const saveRemote = useMutation({
    mutationFn: async ({ userId, totalDays, usedDays, renewalDate }: any) => {
      const existing = users.find((u: any) => u.user_id === userId)?.remote;
      const payload = {
        user_id: userId, total_days: totalDays, used_days: usedDays, renewal_date: renewalDate || null,
      };
      if (existing) {
        await put(`/api/remote-work-balances/${existing.id}`, payload);
      } else {
        await post('/api/remote-work-balances', payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminBalanceUsers'] });
      toast({ title: 'Saldo de teletrabajo actualizado' });
      setEditingRemote(null);
    },
    onError: (err: any) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  if (!isAdmin) return <p className="text-muted-foreground">No tienes permisos para gestionar saldos.</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Gestión de Saldos</h1>
        <p className="text-muted-foreground">Configura días de vacaciones y teletrabajo por usuario</p>
      </div>

      <Tabs defaultValue="vacation">
        <TabsList>
          <TabsTrigger value="vacation" className="gap-1.5"><CalendarDays className="h-3.5 w-3.5" /> Vacaciones</TabsTrigger>
          <TabsTrigger value="remote" className="gap-1.5"><Briefcase className="h-3.5 w-3.5" /> Teletrabajo</TabsTrigger>
        </TabsList>

        <TabsContent value="vacation">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Empleado</TableHead>
                    <TableHead>Días asignados</TableHead>
                    <TableHead>Días usados</TableHead>
                    <TableHead>Disponibles</TableHead>
                    <TableHead>Renovación</TableHead>
                    <TableHead>Regla fds</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u: any) => (
                    <TableRow key={u.user_id}>
                      <TableCell className="font-medium">{u.display_name || u.email || '—'}</TableCell>
                      <TableCell>{u.vacation?.total_days || 0}</TableCell>
                      <TableCell>{u.vacation?.used_days || 0}</TableCell>
                      <TableCell className="font-semibold">{(u.vacation?.total_days || 0) - (u.vacation?.used_days || 0)}</TableCell>
                      <TableCell>{u.vacation?.renewal_date ? new Date(u.vacation.renewal_date).toLocaleDateString('es') : '—'}</TableCell>
                      <TableCell>{u.vacation?.weekend_rule_uses || 0}/2</TableCell>
                      <TableCell>
                        <Button size="sm" variant="ghost" onClick={() => {
                          setEditingVacation(u);
                          setVacDays(String(u.vacation?.total_days || 0));
                          setVacUsed(String(u.vacation?.used_days || 0));
                          setVacWeekendUses(String(u.vacation?.weekend_rule_uses || 0));
                          setVacRenewal(u.vacation?.renewal_date || '');
                        }}><Edit className="h-3.5 w-3.5" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="remote">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Empleado</TableHead>
                    <TableHead>Días asignados</TableHead>
                    <TableHead>Días usados</TableHead>
                    <TableHead>Disponibles</TableHead>
                    <TableHead>Renovación</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u: any) => (
                    <TableRow key={u.user_id}>
                      <TableCell className="font-medium">{u.display_name || u.email || '—'}</TableCell>
                      <TableCell>{u.remote?.total_days || 6}</TableCell>
                      <TableCell>{u.remote?.used_days || 0}</TableCell>
                      <TableCell className="font-semibold">{(u.remote?.total_days || 6) - (u.remote?.used_days || 0)}</TableCell>
                      <TableCell>{u.remote?.renewal_date ? new Date(u.remote.renewal_date).toLocaleDateString('es') : '—'}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="ghost" onClick={() => {
                          setEditingRemote(u);
                          setRemoteDays(String(u.remote?.total_days || 6));
                          setRemoteUsed(String(u.remote?.used_days || 0));
                          setRemoteRenewal(u.remote?.renewal_date || '');
                        }}><Edit className="h-3.5 w-3.5" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!editingVacation} onOpenChange={(open) => !open && setEditingVacation(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Vacaciones - {editingVacation?.display_name || editingVacation?.email}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Días asignados</Label><Input type="number" value={vacDays} onChange={e => setVacDays(e.target.value)} min="0" /></div>
            <div className="space-y-2"><Label>Días usados</Label><Input type="number" value={vacUsed} onChange={e => setVacUsed(e.target.value)} min="0" /><p className="text-xs text-muted-foreground">Solo para correcciones</p></div>
            <div className="space-y-2"><Label>Usos regla fin de semana (máx 2)</Label><Input type="number" value={vacWeekendUses} onChange={e => setVacWeekendUses(e.target.value)} min="0" max="2" /></div>
            <div className="space-y-2"><Label>Fecha de renovación</Label><Input type="date" value={vacRenewal} onChange={e => setVacRenewal(e.target.value)} /></div>
            <Button className="w-full" onClick={() => editingVacation && saveVacation.mutate({
              userId: editingVacation.user_id, totalDays: Number(vacDays), usedDays: Number(vacUsed),
              weekendUses: Number(vacWeekendUses), renewalDate: vacRenewal,
            })}>Guardar</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingRemote} onOpenChange={(open) => !open && setEditingRemote(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Teletrabajo - {editingRemote?.display_name || editingRemote?.email}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Días asignados (máx 6/año)</Label><Input type="number" value={remoteDays} onChange={e => setRemoteDays(e.target.value)} min="0" max="6" /></div>
            <div className="space-y-2"><Label>Días usados</Label><Input type="number" value={remoteUsed} onChange={e => setRemoteUsed(e.target.value)} min="0" /></div>
            <div className="space-y-2"><Label>Fecha de renovación</Label><Input type="date" value={remoteRenewal} onChange={e => setRemoteRenewal(e.target.value)} /></div>
            <Button className="w-full" onClick={() => editingRemote && saveRemote.mutate({
              userId: editingRemote.user_id, totalDays: Number(remoteDays), usedDays: Number(remoteUsed), renewalDate: remoteRenewal,
            })}>Guardar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SaldosPage;
