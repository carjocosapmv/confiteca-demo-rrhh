import type { NominaDesglose } from '@/types/nomina';

/**
 * Sufijo obligatorio para cualquier cifra del módulo de nómina.
 *
 * Ninguna tarifa usada en este cálculo fue confirmada por el cliente ni por un
 * contador, así que ningún valor puede mostrarse como resultado definitivo.
 */
export const ESTIMADO_SUFIJO = 'Estimado — pendiente de confirmación';

const monedaEC = new Intl.NumberFormat('es-EC', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const monedaCompacta = new Intl.NumberFormat('es-EC', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

export function formatoDinero(valor: number | null | undefined): string {
  return monedaEC.format(valor ?? 0);
}

export function formatoDineroCompacto(valor: number | null | undefined): string {
  return monedaCompacta.format(valor ?? 0);
}

/**
 * Porcentajes en formato local.
 *
 * Usa Intl y NO `toFixed`: `(9.45).toFixed(1)` devuelve "9.4" porque 9.45 no es
 * representable en binario, y 9,45% es justamente una de las tarifas que este
 * módulo muestra. Intl redondea sobre la representación decimal y devuelve 9,5.
 */
export function formatoPorcentaje(valor: number | null | undefined, decimales = 1): string {
  if (valor === null || valor === undefined) return '—';

  const formato = new Intl.NumberFormat('es-EC', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimales,
  });

  return `${formato.format(valor)}%`;
}

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

/** `2026-03` → `marzo 2026`. Devuelve la entrada si no tiene el formato esperado. */
export function etiquetaPeriodo(periodo: string): string {
  const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(periodo);
  if (!match) return periodo;

  const [, anio, mes] = match;
  return `${MESES[Number(mes) - 1]} ${anio}`;
}

const ESQUEMAS: Record<string, string> = {
  fijo: 'Fijo',
  fijo_variable: 'Fijo + variable',
  comision: 'Comisión',
};

export function etiquetaEsquema(esquema: string): string {
  return ESQUEMAS[esquema] ?? esquema;
}

export function textoAntiguedad(meses: number | null | undefined): string {
  if (meses === null || meses === undefined) return 'Sin dato';
  if (meses < 12) return `${meses} ${meses === 1 ? 'mes' : 'meses'}`;

  const anios = Math.floor(meses / 12);
  const resto = meses % 12;
  const textoAnios = `${anios} ${anios === 1 ? 'año' : 'años'}`;

  if (resto === 0) return textoAnios;
  return `${textoAnios} ${resto} ${resto === 1 ? 'mes' : 'meses'}`;
}

/** Provisiones mensuales acumuladas: décimo tercero + décimo cuarto + fondos. */
export function totalProvisiones(desglose: NominaDesglose): number {
  return (
    desglose.provision_decimo_tercero +
    desglose.provision_decimo_cuarto +
    desglose.provision_fondos_reserva
  );
}
