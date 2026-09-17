import type { SolicitudEstado, SolicitudTipo } from '@/types/solicitudes';

/** Longitud mínima que exige el backend. Se replica para avisar antes del 422. */
export const DESCRIPCION_MINIMA = 10;
export const DESCRIPCION_MAXIMA = 1000;

export const TIPOS_SOLICITUD: { valor: SolicitudTipo; etiqueta: string; ayuda: string }[] = [
  {
    valor: 'nomina',
    etiqueta: 'Consulta de nómina',
    ayuda: 'Diferencias en el sueldo, comisiones, descuentos o provisiones.',
  },
  {
    valor: 'certificado',
    etiqueta: 'Certificado o documento',
    ayuda: 'Certificados laborales, constancias de ingresos y documentos similares.',
  },
  {
    valor: 'otro',
    etiqueta: 'Otro',
    ayuda: 'Cualquier pedido que no encaje en las opciones anteriores.',
  },
];

export function etiquetaTipo(tipo: SolicitudTipo | string): string {
  return TIPOS_SOLICITUD.find((opcion) => opcion.valor === tipo)?.etiqueta ?? 'Otro';
}

const ESTADOS: Record<SolicitudEstado, string> = {
  pendiente: 'Pendiente',
  aprobado: 'Aprobada',
  rechazado: 'Rechazada',
};

export function etiquetaEstado(estado: SolicitudEstado | string): string {
  return ESTADOS[estado as SolicitudEstado] ?? estado;
}

/** Variante de Badge por estado. `outline` para lo pendiente, color al resolver. */
export function varianteEstado(estado: SolicitudEstado | string): 'outline' | 'default' | 'destructive' {
  if (estado === 'aprobado') return 'default';
  if (estado === 'rechazado') return 'destructive';
  return 'outline';
}

/**
 * Una solicitud solo admite acciones mientras está pendiente.
 *
 * Espeja el guard del servidor (EmployeeRequest::resolver). Aquí evita ofrecer un
 * botón que terminaría en un 409; la garantía real sigue estando en el backend.
 */
export function admiteResolucion(estado: SolicitudEstado | string): boolean {
  return estado === 'pendiente';
}

export function descripcionValida(descripcion: string): boolean {
  const limpio = descripcion.trim();
  return limpio.length >= DESCRIPCION_MINIMA && limpio.length <= DESCRIPCION_MAXIMA;
}

export function fechaCorta(iso: string | null | undefined): string {
  if (!iso) return '—';
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return '—';

  return new Intl.DateTimeFormat('es-EC', {
    day: '2-digit', month: 'short', year: 'numeric',
  }).format(fecha);
}
