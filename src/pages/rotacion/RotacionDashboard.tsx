import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Bar, BarChart, CartesianGrid, Cell, ComposedChart, Legend, Line,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import {
  AlertTriangle, CalendarClock, Clock, DollarSign, HeartPulse, LogOut, TrendingDown, Users,
} from 'lucide-react';
import { get } from '@/lib/api-client';
import {
  ApprovalBar, DataTable, DetailDrawer, ModulePage, StatCard,
  type DataTableColumn,
} from '@/components/module';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type {
  RotacionDashboardData, RotacionDimensionFila, RotacionRiesgo,
} from '@/types/rotacion';

const money = (value: number) =>
  new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);

const pct = (value: number) => `${value.toFixed(1)}%`;

/** Colour ramp for turnover rate: green → amber → red */
const rateColor = (rate: number) =>
  rate >= 40 ? 'hsl(var(--destructive))' : rate >= 20 ? '#f59e0b' : '#10b981';

const riskTone = (nivel: RotacionRiesgo['nivel_riesgo']) =>
  nivel === 'alto' ? 'destructive' : nivel === 'medio' ? 'secondary' : 'outline';

export default function RotacionDashboard() {
  const [dimension, setDimension] = useState('area');
  const [soloMuestraValida, setSoloMuestraValida] = useState(true);
  const [seleccionado, setSeleccionado] = useState<RotacionRiesgo | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['rotacion-dashboard', dimension],
    queryFn: async () => {
      const response = await get<{ data: RotacionDashboardData }>('/api/rotacion/dashboard', { dimension });
      return response.data.data;
    },
  });

  const filasDimension = useMemo(() => {
    const filas = data?.dimension.filas ?? [];
    return soloMuestraValida ? filas.filter((f) => f.muestra_suficiente) : filas;
  }, [data, soloMuestraValida]);

  const topDimension = useMemo(() => filasDimension.slice(0, 10), [filasDimension]);

  const columnasDimension: DataTableColumn<RotacionDimensionFila>[] = [
    { key: 'categoria', header: data?.dimension.etiqueta ?? 'Categoría', sortable: true },
    { key: 'headcount', header: 'Activos', align: 'right', sortable: true },
    { key: 'bajas_12m', header: 'Bajas 12m', align: 'right', sortable: true },
    {
      key: 'tasa_rotacion',
      header: 'Rotación',
      align: 'right',
      sortable: true,
      render: (row) => (
        <span style={{ color: rateColor(row.tasa_rotacion) }} className="font-semibold">
          {pct(row.tasa_rotacion)}
        </span>
      ),
    },
    {
      key: 'antiguedad_promedio_meses',
      header: 'Antigüedad',
      align: 'right',
      sortable: true,
      render: (row) => `${row.antiguedad_promedio_meses} m`,
    },
    {
      key: 'ausentismo_pct',
      header: 'Ausentismo',
      align: 'right',
      sortable: true,
      render: (row) => pct(row.ausentismo_pct),
    },
    {
      key: 'horas_extra_promedio',
      header: 'H. extra',
      align: 'right',
      sortable: true,
      render: (row) => `${row.horas_extra_promedio} h`,
    },
    {
      key: 'salario_promedio',
      header: 'Salario prom.',
      align: 'right',
      sortable: true,
      render: (row) => (row.salario_promedio ? money(row.salario_promedio) : '—'),
    },
    {
      key: 'clima_promedio',
      header: 'Clima',
      align: 'right',
      sortable: true,
      render: (row) => (row.clima_promedio ? row.clima_promedio.toFixed(2) : '—'),
    },
  ];

  const columnasRiesgo: DataTableColumn<RotacionRiesgo>[] = [
    { key: 'nombre', header: 'Colaborador', sortable: true },
    { key: 'puesto', header: 'Puesto', sortable: true },
    { key: 'area', header: 'Área', sortable: true },
    { key: 'supervisor', header: 'Jefe directo', sortable: true },
    {
      key: 'antiguedad_meses',
      header: 'Antigüedad',
      align: 'right',
      sortable: true,
      render: (row) => `${row.antiguedad_meses} m`,
    },
    {
      key: 'score',
      header: 'Riesgo',
      align: 'right',
      sortable: true,
      render: (row) => (
        <Badge variant={riskTone(row.nivel_riesgo)}>{row.score}</Badge>
      ),
    },
    {
      key: 'factores',
      header: 'Principal señal',
      render: (row) => (
        <span className="text-xs text-muted-foreground">{row.factores[0] ?? '—'}</span>
      ),
    },
  ];

  const resumen = data?.resumen;

  return (
    <ModulePage
      title="Dashboard de Rotación"
      description="Patrones de salida por antigüedad, jefatura, área, país, ausentismo, horas extra, contrato, salario, desempeño y clima."
      actions={
        <Select value={dimension} onValueChange={setDimension}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Analizar por..." />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(data?.catalogos.dimensiones ?? { area: 'Área' }).map(([key, label]) => (
              <SelectItem key={key} value={key}>Analizar por: {label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      }
      toolbar={
        isLoading || !resumen ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-[92px]" />)}
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Headcount activo" value={resumen.headcount} icon={Users} />
            <StatCard
              label={`Rotación ${resumen.ventana_meses}m`}
              value={pct(resumen.tasa_rotacion_12m)}
              hint={`${resumen.bajas_12m} bajas`}
              icon={TrendingDown}
              tone={resumen.tasa_rotacion_12m >= 20 ? 'danger' : 'default'}
            />
            <StatCard
              label="Rotación voluntaria"
              value={pct(resumen.tasa_voluntaria_12m)}
              hint={`Lamentable: ${pct(resumen.tasa_lamentable_12m)}`}
              icon={LogOut}
              tone="warning"
            />
            <StatCard
              label="Antigüedad promedio"
              value={`${resumen.antiguedad_promedio_meses} m`}
              hint={`Mediana ${resumen.antiguedad_mediana_meses} m`}
              icon={CalendarClock}
            />
            <StatCard label="Ausentismo" value={pct(resumen.ausentismo_pct)} icon={HeartPulse} />
            <StatCard
              label="Horas extra / mes"
              value={`${resumen.horas_extra_promedio_mes} h`}
              icon={Clock}
            />
            <StatCard
              label="eNPS"
              value={resumen.enps ?? '—'}
              hint={`Clima ${resumen.clima_promedio.toFixed(2)} / 5`}
              icon={AlertTriangle}
              tone={(resumen.enps ?? 0) < 0 ? 'danger' : 'positive'}
            />
            <StatCard
              label="Costo estimado de rotación"
              value={money(resumen.costo_estimado_rotacion)}
              hint="3 sueldos por reemplazo"
              icon={DollarSign}
              tone="danger"
            />
          </div>
        )
      }
    >
      <Tabs defaultValue="tendencia">
        <TabsList>
          <TabsTrigger value="tendencia">Tendencia</TabsTrigger>
          <TabsTrigger value="patrones">Patrones</TabsTrigger>
          <TabsTrigger value="motivos">Motivos</TabsTrigger>
          <TabsTrigger value="riesgo">Riesgo de fuga</TabsTrigger>
        </TabsList>

        {/* ── Tendencia ── */}
        <TabsContent value="tendencia" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Evolución mensual</CardTitle>
              <CardDescription>
                Headcount, bajas del mes y tasa anualizada de rotación.
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[360px]">
              {isLoading ? (
                <Skeleton className="h-full w-full" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={data?.tendencia ?? []}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="etiqueta" fontSize={11} interval="preserveStartEnd" />
                    <YAxis yAxisId="left" fontSize={11} />
                    <YAxis yAxisId="right" orientation="right" fontSize={11} unit="%" />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="bajas" name="Bajas" fill="hsl(var(--destructive))" radius={[3, 3, 0, 0]} />
                    <Line yAxisId="left" type="monotone" dataKey="headcount" name="Headcount" stroke="#3b82f6" strokeWidth={2} dot={false} />
                    <Line yAxisId="right" type="monotone" dataKey="tasa_anualizada" name="Rotación anualizada %" stroke="#f59e0b" strokeWidth={2} dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Patrones por dimensión ── */}
        <TabsContent value="patrones" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Rotación por {data?.dimension.etiqueta.toLowerCase() ?? 'área'}</CardTitle>
              <CardDescription>
                Top 10 categorías ordenadas por tasa de rotación de los últimos 12 meses.
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[360px]">
              {isLoading ? (
                <Skeleton className="h-full w-full" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topDimension} layout="vertical" margin={{ left: 20, right: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" unit="%" fontSize={11} />
                    <YAxis type="category" dataKey="categoria" width={180} fontSize={11} />
                    <Tooltip formatter={(value: number) => `${value}%`} />
                    <Bar dataKey="tasa_rotacion" name="Rotación" radius={[0, 3, 3, 0]}>
                      {topDimension.map((row) => (
                        <Cell key={row.categoria} fill={rateColor(row.tasa_rotacion)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <DataTable
            columns={columnasDimension}
            rows={filasDimension}
            rowKey={(row) => row.categoria}
            loading={isLoading}
            searchAccessor={(row) => row.categoria}
            searchPlaceholder="Buscar categoría..."
            pageSize={12}
            toolbarExtra={
              <Select
                value={soloMuestraValida ? 'validas' : 'todas'}
                onValueChange={(v) => setSoloMuestraValida(v === 'validas')}
              >
                <SelectTrigger className="w-[230px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="validas">Solo muestras ≥ 5 personas</SelectItem>
                  <SelectItem value="todas">Incluir grupos pequeños</SelectItem>
                </SelectContent>
              </Select>
            }
          />
        </TabsContent>

        {/* ── Motivos ── */}
        <TabsContent value="motivos" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Motivos de salida</CardTitle>
              <CardDescription>Últimos 12 meses. Rojo = salida lamentable (talento que no queríamos perder).</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              {isLoading ? (
                <Skeleton className="h-full w-full" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.motivos ?? []} layout="vertical" margin={{ left: 20, right: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" fontSize={11} />
                    <YAxis type="category" dataKey="motivo" width={220} fontSize={11} />
                    <Tooltip />
                    <Bar dataKey="cantidad" name="Salidas" radius={[0, 3, 3, 0]}>
                      {(data?.motivos ?? []).map((m) => (
                        <Cell key={m.motivo} fill={m.es_lamentable ? 'hsl(var(--destructive))' : '#94a3b8'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Riesgo de fuga ── */}
        <TabsContent value="riesgo" className="mt-4">
          <Card className="mb-4">
            <CardHeader>
              <CardTitle>Riesgo de fuga</CardTitle>
              <CardDescription>
                Score por reglas explícitas y auditables: ausentismo, horas extra, desempeño,
                percepción de jefatura, antigüedad sin ajuste salarial y rotación del equipo.
                Hacé clic en una fila para ver el detalle.
              </CardDescription>
            </CardHeader>
          </Card>

          <DataTable
            columns={columnasRiesgo}
            rows={data?.riesgo ?? []}
            rowKey={(row) => row.user_id}
            loading={isLoading}
            searchAccessor={(row) => `${row.nombre} ${row.area} ${row.puesto ?? ''}`}
            searchPlaceholder="Buscar colaborador..."
            onRowClick={(row) => setSeleccionado(row)}
            pageSize={10}
          />
        </TabsContent>
      </Tabs>

      <DetailDrawer
        open={seleccionado !== null}
        onOpenChange={(open) => (open ? null : setSeleccionado(null))}
        title={seleccionado?.nombre ?? ''}
        description={`${seleccionado?.puesto ?? ''} · ${seleccionado?.area ?? ''}`}
        sections={seleccionado ? [
          {
            fields: [
              { label: 'Código', value: seleccionado.employee_code },
              { label: 'Jefe directo', value: seleccionado.supervisor ?? '—' },
              { label: 'Antigüedad', value: `${seleccionado.antiguedad_meses} meses` },
              {
                label: 'Nivel de riesgo',
                value: <Badge variant={riskTone(seleccionado.nivel_riesgo)}>{seleccionado.nivel_riesgo}</Badge>,
              },
              { label: 'Score', value: `${seleccionado.score} / 100`, wide: true },
            ],
          },
          {
            title: 'Señales detectadas',
            fields: seleccionado.factores.length > 0
              ? seleccionado.factores.map((factor, i) => ({
                  label: `Señal ${i + 1}`,
                  value: factor,
                  wide: true,
                }))
              : [{ label: 'Sin señales', value: 'No se detectaron factores de riesgo', wide: true }],
          },
        ] : []}
        footer={
          <ApprovalBar
            approveLabel="Agendar conversación"
            rejectLabel="Descartar señal"
            noteOnApprove
            onApprove={() => setSeleccionado(null)}
            onReject={() => setSeleccionado(null)}
          />
        }
      />
    </ModulePage>
  );
}
