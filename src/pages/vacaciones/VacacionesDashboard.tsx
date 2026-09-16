import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarDays, Check, CheckCircle2, Circle, X, Clock, User, Briefcase } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { get } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const ETAPA_LABELS: Record<string, string> = {
  enviado: 'Enviado',
  aprobado_jefe: 'Aprobado por Jefe',
  aprobado_th: 'Aprobado por TH',
  rechazado: 'Rechazado',
};

const ETAPA_ORDER = ['enviado', 'aprobado_jefe', 'aprobado_th'];

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

function getStepStatus(etapa: string) {
  if (etapa === 'rechazado') {
    return ETAPA_ORDER.map((s) => ({ key: s, status: 'rejected' as const }));
  }
  const idx = ETAPA_ORDER.indexOf(etapa);
  return ETAPA_ORDER.map((s, i) => ({
    key: s,
    status: i < idx ? 'completed' as const : i === idx ? 'active' as const : 'pending' as const,
  }));
}

const ALL_STEPS = [
  { key: 'enviado', label: 'Enviado' },
  { key: 'aprobado_jefe', label: 'Jefe' },
  { key: 'aprobado_th', label: 'TH' },
  { key: 'completado', label: 'Aprobado' },
];

function StatusStepper({ etapa }: { etapa: string }) {
  if (etapa === 'rechazado') {
    return (
      <div className="flex items-center gap-1">
        <div className="flex items-center">
          <div className="flex items-center gap-1 text-destructive">
            <X className="h-4 w-4" />
            <span className="text-xs font-medium">Rechazado</span>
          </div>
        </div>
      </div>
    );
  }

  const etapaIdx = ETAPA_ORDER.indexOf(etapa);
  const isAllCompleted = etapa === 'aprobado_th';

  return (
    <div className="flex items-center gap-0">
      {ALL_STEPS.map((step, i) => {
        let isCompleted = false;
        let isActive = false;

        if (isAllCompleted) {
          isCompleted = true;
        } else if (i < etapaIdx) {
          isCompleted = true;
        } else if (i === etapaIdx) {
          isActive = true;
        }

        return (
          <div key={step.key} className="flex items-center">
            <div className="flex items-center gap-1.5">
              {isCompleted && <CheckCircle2 className="h-4 w-4 text-green-500" />}
              {isActive && !isCompleted && <Circle className="h-4 w-4 text-amber-500" />}
              {!isActive && !isCompleted && <Circle className="h-4 w-4 text-muted-foreground/30" />}
              <span className={cn(
                'text-xs whitespace-nowrap',
                isCompleted && 'text-green-600 font-medium',
                isActive && !isCompleted && 'text-amber-600 font-medium',
                !isActive && !isCompleted && 'text-muted-foreground/50',
              )}>
                {step.label}
              </span>
            </div>
            {i < ALL_STEPS.length - 1 && (
              <div className={cn(
                'h-px w-4 mx-1',
                (isCompleted || (isActive && i < etapaIdx + 1)) ? 'bg-green-400' : 'bg-muted-foreground/20',
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function StatusBadge({ etapa }: { etapa: string }) {
  if (etapa === 'rechazado') {
    return <Badge variant="destructive">Rechazado</Badge>;
  }
  if (etapa === 'aprobado_th') {
    return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Aprobado</Badge>;
  }
  if (etapa === 'aprobado_jefe') {
    return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">{ETAPA_LABELS[etapa]}</Badge>;
  }
  return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">{ETAPA_LABELS[etapa]}</Badge>;
}

const VacacionesDashboard = () => {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState('mis-solicitudes');

  const { data: userData } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const res = await get<any>('/api/me');
      return res.data.user;
    },
    enabled: !!user,
  });

  const { data: saldo } = useQuery({
    queryKey: ['permisos-saldo', user?.id],
    queryFn: async () => {
      const res = await get<any>('/api/permisos-vacaciones/saldo', { user_id: user!.id });
      return res.data;
    },
    enabled: !!user,
  });

  const { data: misSolicitudes, isLoading: loadingSolicitudes } = useQuery({
    queryKey: ['mis-solicitudes'],
    queryFn: async () => {
      const res = await get<any>('/api/permisos-vacaciones/mis-solicitudes');
      return res.data;
    },
    enabled: !!user,
  });

  const solicitudes = misSolicitudes?.solicitudes?.data || [];
  const historial = misSolicitudes?.historial || [];

  const totalDays = saldo?.total_days ?? 15;
  const usedDays = saldo?.used_days ?? 3;
  const availableDays = saldo?.available_days ?? 12;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">Mis Ausencias</h1>
          <p className="text-muted-foreground">
            Bienvenido, {profile?.display_name || userData?.display_name || user?.email || 'Usuario'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Vacaciones disponibles</CardTitle>
            <CalendarDays className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{availableDays}</div>
            <p className="text-xs text-muted-foreground mt-1">de {totalDays} días asignados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Días usados</CardTitle>
            <Briefcase className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{usedDays}</div>
            <p className="text-xs text-muted-foreground mt-1">días utilizados este período</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Solicitudes activas</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{solicitudes.length}</div>
            <p className="text-xs text-muted-foreground mt-1">solicitudes en curso</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="mis-solicitudes">Mis Solicitudes</TabsTrigger>
          <TabsTrigger value="historial">Historial</TabsTrigger>
        </TabsList>

        <TabsContent value="mis-solicitudes" className="mt-4 space-y-3">
          {loadingSolicitudes ? (
            <div className="text-center py-8 text-muted-foreground">Cargando solicitudes...</div>
          ) : solicitudes.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No tienes solicitudes pendientes.
              </CardContent>
            </Card>
          ) : (
            solicitudes.map((req: any) => (
              <Card key={req.id}>
                <CardContent className="pt-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{TIPO_LABELS[req.tipo] || req.tipo || '—'}</span>
                        <StatusBadge etapa={req.etapa_aprobacion} />
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {req.start_date && format(new Date(req.start_date), 'dd/MM/yyyy', { locale: es })}
                        {req.end_date && req.end_date !== req.start_date && (
                          <> — {format(new Date(req.end_date), 'dd/MM/yyyy', { locale: es })}</>
                        )}
                        {req.days_requested && <> · {req.days_requested} días</>}
                      </p>
                      {req.razon && (
                        <p className="text-sm text-muted-foreground mt-1">Motivo: {req.razon}</p>
                      )}
                    </div>
                  </div>
                  <StatusStepper etapa={req.etapa_aprobacion} />
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="historial" className="mt-4 space-y-3">
          {historial.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No hay solicitudes en el historial.
              </CardContent>
            </Card>
          ) : (
            historial.map((req: any) => (
              <Card key={req.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {req.etapa_aprobacion === 'rechazado' ? (
                        <X className="h-5 w-5 text-destructive" />
                      ) : (
                        <Check className="h-5 w-5 text-green-500" />
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{TIPO_LABELS[req.tipo] || req.tipo || '—'}</span>
                          <StatusBadge etapa={req.etapa_aprobacion} />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {req.start_date && format(new Date(req.start_date), 'dd/MM/yyyy', { locale: es })}
                          {req.end_date && req.end_date !== req.start_date && (
                            <> — {format(new Date(req.end_date), 'dd/MM/yyyy', { locale: es })}</>
                          )}
                          {req.days_requested && <> · {req.days_requested} días</>}
                        </p>
                        {req.nota_rechazo && (
                          <p className="text-sm text-destructive mt-1">Motivo: {req.nota_rechazo}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VacacionesDashboard;
