import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle, Banknote, Calculator, Info, PiggyBank, Receipt, Users,
} from 'lucide-react';
import { get } from '@/lib/api-client';
import {
  DataTable, DetailDrawer, ModulePage, StatCard,
  type DataTableColumn, type DataTableFilter, type DetailSection,
} from '@/components/module';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import type { NominaColaborador, NominaDashboardData } from '@/types/nomina';
import {
  ESTIMADO_SUFIJO,
  etiquetaEsquema,
  etiquetaPeriodo,
  formatoDinero,
  formatoDineroCompacto,
  formatoPorcentaje,
  textoAntiguedad,
  totalProvisiones,
} from './nomina-utils';

/**
 * Nómina — calculadora de estimados.
 *
 * Proyección de solo lectura. No genera roles de pago, no guarda histórico y
 * no produce archivos bancarios ni declaraciones al IESS. Cada cifra que se
 * muestra aquí depende de tarifas de referencia sin confirmar, por eso el
 * panel de supuestos y las etiquetas "estimado" no son decorativos: son parte
 * del contrato de esta pantalla.
 */
export default function NominaPage() {
  const [periodo, setPeriodo] = useState<string | undefined>(undefined);
  const [seleccionado, setSeleccionado] = useState<NominaColaborador | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['nomina-dashboard', periodo],
    queryFn: async () => {
      const response = await get<{ data: NominaDashboardData }>(
        '/api/nomina/dashboard',
        periodo ? { periodo } : undefined,
      );
      return response.data.data;
    },
  });

  const resumen = data?.resumen;
  const supuestos = data?.supuestos;
  const tarifas = supuestos?.tarifas;
  const colaboradores = useMemo(() => data?.colaboradores ?? [], [data]);

  const columnas: DataTableColumn<NominaColaborador>[] = [
    { key: 'nombre', header: 'Colaborador', sortable: true },
    { key: 'puesto', header: 'Puesto', sortable: true },
    { key: 'area', header: 'Área', sortable: true },
    {
      key: 'esquema',
      header: 'Esquema',
      sortable: true,
      render: (row) => <Badge variant="outline">{etiquetaEsquema(row.esquema)}</Badge>,
    },
    {
      key: 'salario_base',
      header: 'Salario base',
      align: 'right',
      sortable: true,
      render: (row) => formatoDinero(row.salario_base),
    },
    {
      key: 'total_comisiones',
      header: 'Comisiones',
      align: 'right',
      sortable: true,
      render: (row) =>
        row.total_comisiones > 0
          ? formatoDinero(row.total_comisiones)
          : <span className="text-muted-foreground">—</span>,
    },
    {
      key: 'total_ingresos',
      header: 'Ingreso bruto',
      align: 'right',
      sortable: true,
      render: (row) => <span className="font-medium">{formatoDinero(row.total_ingresos)}</span>,
    },
    {
      key: 'iess_personal',
      header: 'IESS personal',
      align: 'right',
      sortable: true,
      render: (row) => (
        <span className="text-muted-foreground">-{formatoDinero(row.iess_personal)}</span>
      ),
    },
    {
      key: 'neto_a_pagar',
      header: 'Neto estimado',
      align: 'right',
      sortable: true,
      render: (row) => (
        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
          {formatoDinero(row.neto_a_pagar)}
        </span>
      ),
    },
  ];

  const filtros: DataTableFilter<NominaColaborador>[] = [
    {
      key: 'area',
      label: 'Área',
      options: data?.catalogos.areas ?? [],
      accessor: (row) => row.area,
    },
    {
      key: 'esquema',
      label: 'Esquema',
      options: data?.catalogos.esquemas ?? [],
      accessor: (row) => row.esquema,
    },
    {
      key: 'tipo_contrato',
      label: 'Contrato',
      options: data?.catalogos.tipos_contrato ?? [],
      accessor: (row) => row.tipo_contrato,
    },
  ];

  const secciones: DetailSection[] = seleccionado
    ? [
        {
          fields: [
            { label: 'Código', value: seleccionado.employee_code },
            { label: 'Cédula', value: seleccionado.cedula ?? '—' },
            { label: 'Puesto', value: seleccionado.puesto ?? '—' },
            { label: 'Área', value: seleccionado.area },
            { label: 'Esquema', value: etiquetaEsquema(seleccionado.esquema) },
            { label: 'Antigüedad', value: textoAntiguedad(seleccionado.meses_antiguedad) },
          ],
        },
        {
          title: 'Ingresos del período',
          fields: [
            { label: 'Salario base', value: formatoDinero(seleccionado.salario_base) },
            ...seleccionado.comisiones.map((comision) => ({
              label: comision.etiqueta,
              value: formatoDinero(comision.monto),
            })),
            {
              label: 'Total comisiones',
              value: <span className="font-semibold">{formatoDinero(seleccionado.total_comisiones)}</span>,
            },
            {
              label: 'Ingreso bruto',
              value: <span className="font-semibold">{formatoDinero(seleccionado.total_ingresos)}</span>,
            },
          ],
        },
        {
          title: 'Deducciones y neto',
          fields: [
            {
              label: `IESS personal (${formatoPorcentaje(tarifas?.iess_personal_pct, 2)})`,
              value: <span className="text-red-600 dark:text-red-400">-{formatoDinero(seleccionado.iess_personal)}</span>,
            },
            {
              label: 'Neto a pagar',
              value: (
                <span className="text-base font-semibold text-emerald-600 dark:text-emerald-400">
                  {formatoDinero(seleccionado.neto_a_pagar)}
                </span>
              ),
              wide: true,
            },
          ],
        },
        {
          title: 'Provisiones mensuales acumuladas',
          fields: [
            { label: 'Décimo tercero', value: formatoDinero(seleccionado.provision_decimo_tercero) },
            { label: 'Décimo cuarto', value: formatoDinero(seleccionado.provision_decimo_cuarto) },
            {
              label: 'Fondos de reserva',
              value: seleccionado.fondos_reserva_aplica
                ? formatoDinero(seleccionado.provision_fondos_reserva)
                : <span className="text-muted-foreground">No aplica todavía</span>,
            },
            {
              label: 'Total provisiones',
              value: <span className="font-semibold">{formatoDinero(totalProvisiones(seleccionado))}</span>,
            },
          ],
        },
      ]
    : [];

  return (
    <ModulePage
      title="Nómina — calculadora de estimados"
      description="Proyección mensual de ingresos, aportes y provisiones a partir de la compensación vigente y las comisiones registradas. No reemplaza al rol de pago."
      actions={
        <Select value={data?.periodo ?? ''} onValueChange={setPeriodo}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            {(data?.catalogos.periodos ?? []).map((opcion) => (
              <SelectItem key={opcion} value={opcion}>
                Período: {etiquetaPeriodo(opcion)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      }
      toolbar={
        <div className="flex flex-col gap-4">
          {/* Disclaimer principal: el módulo entero es una estimación. */}
          {supuestos && !tarifas?.confirmado ? (
            <Alert variant="destructive">
              <AlertTriangle className="size-4" />
              <AlertTitle>Cifras estimadas, pendientes de confirmación</AlertTitle>
              <AlertDescription>
                <ul className="mt-1 list-disc space-y-1 pl-4 text-sm">
                  {supuestos.advertencias.map((advertencia) => (
                    <li key={advertencia}>{advertencia}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          ) : null}

          {isLoading || !resumen ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[92px]" />)}
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                label="Colaboradores"
                value={resumen.colaboradores}
                hint={`${resumen.con_comisiones} con comisiones en el período`}
                icon={Users}
              />
              <StatCard
                label="Ingreso bruto"
                value={formatoDineroCompacto(resumen.total_ingresos)}
                hint={`Comisiones: ${formatoDineroCompacto(resumen.total_comisiones)} · ${ESTIMADO_SUFIJO}`}
                icon={Receipt}
              />
              <StatCard
                label="Neto a pagar"
                value={formatoDineroCompacto(resumen.total_neto)}
                hint={`IESS personal: ${formatoDineroCompacto(resumen.total_iess_personal)} · ${ESTIMADO_SUFIJO}`}
                icon={Banknote}
                tone="positive"
              />
              <StatCard
                label="Costo empleador"
                value={formatoDineroCompacto(resumen.costo_total_empleador)}
                hint={`Incluye aporte patronal y provisiones · ${ESTIMADO_SUFIJO}`}
                icon={Calculator}
                tone="warning"
              />
            </div>
          )}
        </div>
      }
    >
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Detalle por colaborador</CardTitle>
          <CardDescription>
            Seleccione una fila para ver el desglose completo del período{' '}
            {data?.periodo ? etiquetaPeriodo(data.periodo) : ''}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columnas}
            rows={colaboradores}
            rowKey={(row) => row.user_id}
            loading={isLoading}
            filters={filtros}
            searchAccessor={(row) => `${row.nombre} ${row.employee_code} ${row.cedula ?? ''}`}
            searchPlaceholder="Buscar por nombre, código o cédula..."
            onRowClick={setSeleccionado}
            emptyMessage="Sin colaboradores con compensación registrada en el período."
          />
        </CardContent>
      </Card>

      {/* Supuestos: qué tarifa se usó y de dónde salió. */}
      {tarifas ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Info className="size-4" />
              Supuestos del cálculo ({tarifas.anio_referencia})
            </CardTitle>
            <CardDescription>
              Referencias públicas sin validación contable. Se corrigen en un solo archivo de
              configuración cuando el cliente confirme las cifras reales.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Supuesto
              etiqueta="IESS aportación personal"
              valor={formatoPorcentaje(tarifas.iess_personal_pct, 2)}
              nota="Se descuenta del ingreso bruto."
            />
            <Supuesto
              etiqueta="IESS aportación patronal"
              valor={formatoPorcentaje(tarifas.iess_patronal_pct, 2)}
              nota={
                tarifas.iess_patronal_ambiguo
                  ? `Las fuentes públicas varían entre ${formatoPorcentaje(tarifas.iess_patronal_rango[0], 2)} y ${formatoPorcentaje(tarifas.iess_patronal_rango[1], 2)}. Requiere confirmación contable.`
                  : 'Costo del empleador: no se descuenta del neto.'
              }
              alerta={tarifas.iess_patronal_ambiguo}
            />
            <Supuesto
              etiqueta="SBU"
              valor={formatoDinero(tarifas.sbu)}
              nota="Base del décimo cuarto (1 SBU al año)."
            />
            <Supuesto
              etiqueta="Fondos de reserva"
              valor={formatoPorcentaje(tarifas.fondos_reserva_pct, 2)}
              nota={`Aplican desde el mes ${tarifas.fondos_reserva_meses_minimos + 1} de trabajo continuo.`}
            />
          </CardContent>
        </Card>
      ) : null}

      <DetailDrawer
        open={seleccionado !== null}
        onOpenChange={(abierto) => !abierto && setSeleccionado(null)}
        title={seleccionado?.nombre ?? ''}
        description={`${etiquetaPeriodo(data?.periodo ?? '')} · ${ESTIMADO_SUFIJO}`}
        sections={secciones}
      >
        {seleccionado ? (
          <div className="space-y-4">
            {/* El objetivo variable es una meta contractual, no dinero devengado. */}
            {seleccionado.variable_objetivo > 0 ? (
              <>
                <Separator />
                <div className="rounded-md border bg-muted/40 p-3 text-sm">
                  <p className="font-medium">Variable objetivo</p>
                  <p className="mt-1 text-muted-foreground">
                    Meta contractual de {formatoDinero(seleccionado.variable_objetivo)}. Es una
                    referencia de desempeño y <strong>no</strong> se suma al ingreso bruto: lo
                    devengado son las comisiones del período.
                  </p>
                  <p className="mt-2">
                    Cumplimiento:{' '}
                    <span className="font-semibold tabular-nums">
                      {formatoPorcentaje(seleccionado.cumplimiento_variable_pct)}
                    </span>
                  </p>
                </div>
              </>
            ) : null}

            {/* Costo patronal: informativo, jamás descontado del neto. */}
            <div className="rounded-md border border-amber-500/40 bg-amber-500/5 p-3 text-sm">
              <p className="flex items-center gap-2 font-medium">
                <PiggyBank className="size-4" />
                Costo del empleador (informativo)
              </p>
              <dl className="mt-2 space-y-1">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">
                    IESS patronal ({formatoPorcentaje(tarifas?.iess_patronal_pct, 2)})
                  </dt>
                  <dd className="tabular-nums">{formatoDinero(seleccionado.iess_patronal)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Provisiones del mes</dt>
                  <dd className="tabular-nums">{formatoDinero(totalProvisiones(seleccionado))}</dd>
                </div>
                <div className="flex justify-between gap-4 border-t pt-1 font-semibold">
                  <dt>Costo total estimado</dt>
                  <dd className="tabular-nums">{formatoDinero(seleccionado.costo_total_empleador)}</dd>
                </div>
              </dl>
              <p className="mt-2 text-xs text-muted-foreground">
                Este valor no se descuenta del neto del colaborador. {ESTIMADO_SUFIJO}.
              </p>
            </div>

            <p className="text-xs text-muted-foreground">
              La regla de combinación de las 4 variables de comisión no está definida por el
              cliente: por ahora se suman de forma independiente. Es un supuesto provisional.
            </p>
          </div>
        ) : null}
      </DetailDrawer>
    </ModulePage>
  );
}

function Supuesto({
  etiqueta, valor, nota, alerta = false,
}: { etiqueta: string; valor: string; nota: string; alerta?: boolean }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {etiqueta}
      </p>
      <p className="font-display text-xl font-semibold tabular-nums">{valor}</p>
      <p className={alerta ? 'text-xs text-amber-600 dark:text-amber-400' : 'text-xs text-muted-foreground'}>
        {nota}
      </p>
    </div>
  );
}
