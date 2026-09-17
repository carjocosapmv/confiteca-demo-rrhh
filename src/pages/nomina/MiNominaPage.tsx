import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Banknote, Receipt, ShieldCheck, Wallet } from 'lucide-react';
import { get } from '@/lib/api-client';
import { DetailSections, ModulePage, StatCard } from '@/components/module';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import type { NominaColaborador, NominaSupuestos } from '@/types/nomina';
import { NominaDesgloseExtras } from './nomina-desglose';
import { seccionesDesglose } from './nomina-secciones';
import {
  ESTIMADO_SUFIJO, etiquetaEsquema, etiquetaPeriodo, formatoDinero, textoAntiguedad,
} from './nomina-utils';
import { Link } from 'react-router-dom';

interface MiNominaRespuesta {
  data: NominaColaborador;
  meta: { periodo: string; periodos: string[]; supuestos: NominaSupuestos };
}

/**
 * Mi Nómina — autoservicio del colaborador.
 *
 * Consume `/api/nomina/mi-nomina`, que no recibe a quién consultar: el servidor
 * lo deriva de la sesión. Esta página no tiene ni puede tener un selector de
 * persona, y por eso está abierta a todos los roles mientras el módulo
 * administrativo sigue reservado a Talento Humano.
 */
export default function MiNominaPage() {
  const { profile } = useAuth();
  const [periodo, setPeriodo] = useState<string | undefined>(undefined);

  const { data, isLoading, error } = useQuery<MiNominaRespuesta, { status?: number }>({
    queryKey: ['mi-nomina', periodo],
    queryFn: async () => {
      const response = await get<MiNominaRespuesta>(
        '/api/nomina/mi-nomina',
        periodo ? { periodo } : undefined,
      );
      return response.data;
    },
    retry: false,
  });

  const desglose = data?.data;
  const supuestos = data?.meta.supuestos;
  const tarifas = supuestos?.tarifas;
  const sinRegistro = !isLoading && !desglose;

  const selectorPeriodo = (
    <Select value={data?.meta.periodo ?? ''} onValueChange={setPeriodo}>
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Período" />
      </SelectTrigger>
      <SelectContent>
        {(data?.meta.periodos ?? []).map((opcion) => (
          <SelectItem key={opcion} value={opcion}>
            Período: {etiquetaPeriodo(opcion)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  return (
    <ModulePage
      title="Mi Nómina"
      description="Estimación de tus ingresos, aportes y provisiones del período. Solo puedes ver tu propia información."
      actions={data ? selectorPeriodo : null}
      toolbar={
        <div className="flex flex-col gap-4">
          {supuestos && !tarifas?.confirmado ? (
            <Alert variant="destructive">
              <AlertTriangle className="size-4" />
              <AlertTitle>Cifras estimadas, pendientes de confirmación</AlertTitle>
              <AlertDescription>
                <p className="mt-1 text-sm">
                  Este cálculo es una proyección: no reemplaza a tu rol de pago. Si encuentras una
                  diferencia, envía una solicitud a Talento Humano desde{' '}
                  <Link className="underline underline-offset-2" to="/mis-solicitudes">
                    Mis Solicitudes
                  </Link>
                  .
                </p>
              </AlertDescription>
            </Alert>
          ) : null}

          {isLoading ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-[92px]" />)}
            </div>
          ) : null}

          {desglose ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <StatCard
                label="Ingreso bruto"
                value={formatoDinero(desglose.total_ingresos)}
                hint={`Comisiones: ${formatoDinero(desglose.total_comisiones)} · ${ESTIMADO_SUFIJO}`}
                icon={Receipt}
              />
              <StatCard
                label="IESS personal"
                value={formatoDinero(desglose.iess_personal)}
                hint="Aporte que se descuenta de tu ingreso bruto."
                icon={ShieldCheck}
                tone="warning"
              />
              <StatCard
                label="Neto a pagar"
                value={formatoDinero(desglose.neto_a_pagar)}
                hint={ESTIMADO_SUFIJO}
                icon={Banknote}
                tone="positive"
              />
            </div>
          ) : null}
        </div>
      }
    >
      {sinRegistro ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Wallet className="size-4" />
              Sin información para este período
            </CardTitle>
            <CardDescription>
              {(error as { status?: number } | null)?.status === 404
                ? 'No hay una compensación registrada a tu nombre para el período seleccionado.'
                : 'No fue posible cargar tu información de nómina en este momento.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {data ? selectorPeriodo : null}
            <Button asChild variant="outline">
              <Link to="/mis-solicitudes">Consultar a Talento Humano</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {desglose ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              {profile?.display_name ?? desglose.nombre} · {etiquetaPeriodo(data?.meta.periodo ?? '')}
            </CardTitle>
            <CardDescription>
              {etiquetaEsquema(desglose.esquema)} · {desglose.puesto ?? 'Sin puesto registrado'} ·
              Antigüedad: {textoAntiguedad(desglose.meses_antiguedad)} · {ESTIMADO_SUFIJO}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Mismo desglose que ve Talento Humano en el módulo de nómina. */}
            <DetailSections sections={seccionesDesglose(desglose, tarifas, { incluirIdentificacion: false })} />
            <NominaDesgloseExtras colaborador={desglose} tarifas={tarifas} />
          </CardContent>
        </Card>
      ) : null}
    </ModulePage>
  );
}
