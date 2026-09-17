/**
 * Solicitudes genéricas del colaborador hacia Talento Humano.
 *
 * Contrato del recurso `employee_requests`: un tipo, un texto libre y una única
 * resolución. No modela trámites con reglas propias — esos siguen viviendo en
 * su módulo (ausencias, vacantes).
 */

export type SolicitudTipo = 'nomina' | 'certificado' | 'otro';

export type SolicitudEstado = 'pendiente' | 'aprobado' | 'rechazado';

export interface SolicitudResolutor {
  id: string;
  display_name: string | null;
}

export interface Solicitud {
  id: string;
  user_id: string;
  tipo: SolicitudTipo;
  descripcion: string;
  estado: SolicitudEstado;
  respuesta_rrhh: string | null;
  resuelto_por: string | null;
  resuelto_at: string | null;
  created_at: string;
  updated_at: string;
  resolutor?: SolicitudResolutor | null;
  user?: SolicitudResolutor | null;
}

export interface NuevaSolicitud {
  tipo: SolicitudTipo;
  descripcion: string;
}
