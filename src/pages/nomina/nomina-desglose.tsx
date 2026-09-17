import { PiggyBank } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import type { NominaColaborador, NominaTarifas } from '@/types/nomina';
import { ESTIMADO_SUFIJO, formatoDinero, formatoPorcentaje, totalProvisiones } from './nomina-utils';

interface ExtrasProps {
  colaborador: NominaColaborador;
  tarifas: NominaTarifas | undefined;
  /** El separador superior solo tiene sentido dentro del cajón de detalle. */
  conSeparador?: boolean;
}

/**
 * Bloques que no entran en el formato de campo/valor: la meta variable y el
 * costo del empleador. Ambos necesitan su explicación al lado del número.
 */
export function NominaDesgloseExtras({ colaborador, tarifas, conSeparador = true }: ExtrasProps) {
  return (
    <div className="space-y-4">
      {/* El objetivo variable es una meta contractual, no dinero devengado. */}
      {colaborador.variable_objetivo > 0 ? (
        <>
          {conSeparador ? <Separator /> : null}
          <div className="rounded-md border bg-muted/40 p-3 text-sm">
            <p className="font-medium">Variable objetivo</p>
            <p className="mt-1 text-muted-foreground">
              Meta contractual de {formatoDinero(colaborador.variable_objetivo)}. Es una referencia
              de desempeño y <strong>no</strong> se suma al ingreso bruto: lo devengado son las
              comisiones del período.
            </p>
            <p className="mt-2">
              Cumplimiento:{' '}
              <span className="font-semibold tabular-nums">
                {formatoPorcentaje(colaborador.cumplimiento_variable_pct)}
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
            <dd className="tabular-nums">{formatoDinero(colaborador.iess_patronal)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Provisiones del mes</dt>
            <dd className="tabular-nums">{formatoDinero(totalProvisiones(colaborador))}</dd>
          </div>
          <div className="flex justify-between gap-4 border-t pt-1 font-semibold">
            <dt>Costo total estimado</dt>
            <dd className="tabular-nums">{formatoDinero(colaborador.costo_total_empleador)}</dd>
          </div>
        </dl>
        <p className="mt-2 text-xs text-muted-foreground">
          Este valor no se descuenta del neto del colaborador. {ESTIMADO_SUFIJO}.
        </p>
      </div>

      <p className="text-xs text-muted-foreground">
        La regla de combinación de las 4 variables de comisión no está definida por el cliente: por
        ahora se suman de forma independiente. Es un supuesto provisional.
      </p>
    </div>
  );
}
