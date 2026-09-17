import type { DetailSection } from '@/components/module';
import type { NominaColaborador, NominaTarifas } from '@/types/nomina';
import {
  etiquetaEsquema,
  formatoDinero,
  formatoPorcentaje,
  textoAntiguedad,
  totalProvisiones,
} from './nomina-utils';

/**
 * Campos del desglose de nómina, compartidos por las dos vistas.
 *
 * Talento Humano lo ve dentro del cajón de detalle del módulo administrativo y
 * el colaborador lo ve en su propia página. Es el MISMO desglose: separarlos en
 * dos maquetas implicaría que un día el neto que ve Talento Humano y el que ve
 * el colaborador dejen de coincidir, y esa conversación no la quiere nadie.
 *
 * Vive aparte del componente de extras para no mezclar exportaciones de
 * componentes con exportaciones de funciones en un mismo archivo.
 */

interface OpcionesDesglose {
  /** Datos de identificación. Se ocultan en la vista propia: ya sabe quién es. */
  incluirIdentificacion?: boolean;
}

export function seccionesDesglose(
  colaborador: NominaColaborador,
  tarifas: NominaTarifas | undefined,
  { incluirIdentificacion = true }: OpcionesDesglose = {},
): DetailSection[] {
  const identificacion: DetailSection[] = incluirIdentificacion
    ? [
        {
          fields: [
            { label: 'Código', value: colaborador.employee_code },
            { label: 'Cédula', value: colaborador.cedula ?? '—' },
            { label: 'Puesto', value: colaborador.puesto ?? '—' },
            { label: 'Área', value: colaborador.area },
            { label: 'Esquema', value: etiquetaEsquema(colaborador.esquema) },
            { label: 'Antigüedad', value: textoAntiguedad(colaborador.meses_antiguedad) },
          ],
        },
      ]
    : [];

  return [
    ...identificacion,
    {
      title: 'Ingresos del período',
      fields: [
        { label: 'Salario base', value: formatoDinero(colaborador.salario_base) },
        ...colaborador.comisiones.map((comision) => ({
          label: comision.etiqueta,
          value: formatoDinero(comision.monto),
        })),
        {
          label: 'Total comisiones',
          value: <span className="font-semibold">{formatoDinero(colaborador.total_comisiones)}</span>,
        },
        {
          label: 'Ingreso bruto',
          value: <span className="font-semibold">{formatoDinero(colaborador.total_ingresos)}</span>,
        },
      ],
    },
    {
      title: 'Deducciones y neto',
      fields: [
        {
          label: `IESS personal (${formatoPorcentaje(tarifas?.iess_personal_pct, 2)})`,
          value: (
            <span className="text-red-600 dark:text-red-400">
              -{formatoDinero(colaborador.iess_personal)}
            </span>
          ),
        },
        {
          label: 'Neto a pagar',
          value: (
            <span className="text-base font-semibold text-emerald-600 dark:text-emerald-400">
              {formatoDinero(colaborador.neto_a_pagar)}
            </span>
          ),
          wide: true,
        },
      ],
    },
    {
      title: 'Provisiones mensuales acumuladas',
      fields: [
        { label: 'Décimo tercero', value: formatoDinero(colaborador.provision_decimo_tercero) },
        { label: 'Décimo cuarto', value: formatoDinero(colaborador.provision_decimo_cuarto) },
        {
          label: 'Fondos de reserva',
          value: colaborador.fondos_reserva_aplica
            ? formatoDinero(colaborador.provision_fondos_reserva)
            : <span className="text-muted-foreground">No aplica todavía</span>,
        },
        {
          label: 'Total provisiones',
          value: <span className="font-semibold">{formatoDinero(totalProvisiones(colaborador))}</span>,
        },
      ],
    },
  ];
}
