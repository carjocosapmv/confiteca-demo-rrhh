import { useQuery } from '@tanstack/react-query';
import { get } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Users, CalendarDays, FileText, PlayCircle, Clock, AlertTriangle, CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface LeaveRequest {
  id: string;
  user_id: string;
  request_type: string;
  fecha_inicio: string;
  fecha_fin: string;
  estado: string;
  user: { id: string; display_name: string; email: string };
}

interface RrhhDashboard {
  pending_requests: number;
  today_absences: number;
  balances: { user_name: string; assigned_days: number; used_days: number; available_days: number }[];
}

interface VacancyRequest {
  id: string;
  cargo_solicitado: string;
  departamento: string;
  nivel_urgencia: string;
  status: string;
  user: { display_name: string };
}

interface OnboardingData {
  progress: number;
  watched: number;
  total: number;
}

const TYPE_LABELS: Record<string, string> = {
  vacation: 'Vacaciones',
  remote_work: 'Teletrabajo',
  personal: 'Personal',
  medical: 'Médico',
  hourly: 'Permiso por Horas',
};

const STATUS_BADGE: Record<string, string> = {
  pendiente: 'bg-amber-100 text-amber-800',
  aprobada: 'bg-emerald-100 text-emerald-800',
  rechazada: 'bg-red-100 text-red-800',
};

const URGENCY_BADGE: Record<string, string> = {
  baja: 'bg-slate-100 text-slate-800',
  media: 'bg-amber-100 text-amber-800',
  alta: 'bg-red-100 text-red-800',
};

function KPICard({ label, value, icon: Icon, subtitle }: {
  label: string; value: string; icon: React.ElementType; subtitle?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{value}</p>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { user } = useAuth();

  const { data: leaveRequests, isLoading: loadingLeaves } = useQuery<LeaveRequest[]>({
    queryKey: ['leave-requests'],
    queryFn: async () => {
      const res = await get<any[]>('/api/leave-requests');
      return res.data ?? [];
    },
  });

  const { data: rrhhData, isLoading: loadingRrhh } = useQuery<RrhhDashboard>({
    queryKey: ['rrhh-dashboard'],
    queryFn: async () => {
      const res = await get<any>('/api/vacation/rrhh-dashboard');
      return res.data ?? {};
    },
  });

  const { data: vacancies, isLoading: loadingVacancies } = useQuery<VacancyRequest[]>({
    queryKey: ['vacancy-requests'],
    queryFn: async () => {
      const res = await get<any>('/api/vacancy-requests');
      return (res.data as any)?.data ?? [];
    },
  });

  const { data: onboarding, isLoading: loadingOnboarding } = useQuery<OnboardingData>({
    queryKey: ['onboarding-videos'],
    queryFn: async () => {
      const res = await get<OnboardingData>('/api/onboarding/videos');
      return res.data;
    },
  });

  const recentLeaves = leaveRequests?.slice(0, 5) ?? [];
  const pendingLeaves = leaveRequests?.filter((l) => l.estado === 'pendiente') ?? [];
  const pendingVacancies = vacancies?.filter((v) => v.status === 'pendiente') ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard RRHH</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Bienvenido, {user?.display_name ?? user?.email}. Resumen general de gestión de personal.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          label="Colaboradores"
          value={rrhhData?.balances?.length?.toString() ?? '—'}
          icon={Users}
          subtitle="Con saldo registrado"
        />
        <KPICard
          label="Ausencias hoy"
          value={rrhhData?.today_absences?.toString() ?? '0'}
          icon={CalendarDays}
          subtitle="Personal ausente"
        />
        <KPICard
          label="Solicitudes pendientes"
          value={pendingLeaves.length.toString()}
          icon={FileText}
          subtitle={`${(pendingLeaves.length)} permisos sin revisar`}
        />
        <KPICard
          label="Progreso inducción"
          value={onboarding ? `${onboarding.progress}%` : '—'}
          icon={PlayCircle}
          subtitle={onboarding ? `${onboarding.watched} de ${onboarding.total} videos` : undefined}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Últimas solicitudes de permisos</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Colaborador</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Inicio</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingLeaves && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-4">
                      <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                )}
                {!loadingLeaves && recentLeaves.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-4">
                      Sin solicitudes aún
                    </TableCell>
                  </TableRow>
                )}
                {recentLeaves.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="font-medium">{l.user?.display_name ?? '—'}</TableCell>
                    <TableCell>{TYPE_LABELS[l.request_type] ?? l.request_type}</TableCell>
                    <TableCell className="tabular-nums">
                      {new Date(l.fecha_inicio).toLocaleDateString('es-AR')}
                    </TableCell>
                    <TableCell>
                      <Badge className={STATUS_BADGE[l.estado] ?? ''}>
                        {l.estado === 'pendiente' && <Clock className="h-3 w-3 mr-1" />}
                        {l.estado === 'aprobada' && <CheckCircle className="h-3 w-3 mr-1" />}
                        {l.estado === 'rechazada' && <XCircle className="h-3 w-3 mr-1" />}
                        {l.estado}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Solicitudes de vacantes pendientes</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Departamento</TableHead>
                  <TableHead>Urgencia</TableHead>
                  <TableHead>Solicitante</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingVacancies && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-4">
                      <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                )}
                {!loadingVacancies && pendingVacancies.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-4">
                      Sin vacantes pendientes
                    </TableCell>
                  </TableRow>
                )}
                {pendingVacancies.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell className="font-medium">{v.cargo_solicitado}</TableCell>
                    <TableCell>{v.departamento}</TableCell>
                    <TableCell>
                      <Badge className={URGENCY_BADGE[v.nivel_urgencia] ?? ''}>
                        {v.nivel_urgencia === 'alta' && <AlertTriangle className="h-3 w-3 mr-1" />}
                        {v.nivel_urgencia}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{v.user?.display_name ?? '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Saldos de vacaciones</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Colaborador</TableHead>
                <TableHead className="text-right">Asignados</TableHead>
                <TableHead className="text-right">Usados</TableHead>
                <TableHead className="text-right">Disponibles</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingRrhh && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              )}
              {rrhhData?.balances?.map((b, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{b.user_name}</TableCell>
                  <TableCell className="text-right tabular-nums">{b.assigned_days}</TableCell>
                  <TableCell className="text-right tabular-nums">{b.used_days}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    <span className={b.available_days <= 0 ? 'text-destructive font-medium' : 'text-emerald-600 font-medium'}>
                      {b.available_days}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
              {!loadingRrhh && (!rrhhData?.balances || rrhhData.balances.length === 0) && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-4">
                    Sin datos de saldo disponibles
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
