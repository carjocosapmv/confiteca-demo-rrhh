/**
 * Nómina — contratos de la API de cálculo.
 *
 * Todos los montos son ESTIMADOS calculados con tarifas de referencia sin
 * confirmar (ver backend/config/payroll.php). No representan un rol de pago
 * ni un cálculo con validez contable o legal.
 */

export type ConceptoComision =
  | 'cumplimiento_cuota'
  | 'cobranza'
  | 'nuevos_clientes'
  | 'mix_producto';

export interface ComisionDetalle {
  concepto: ConceptoComision;
  etiqueta: string;
  monto: number;
}

/** Resultado del cálculo para un colaborador en un período. */
export interface NominaDesglose {
  salario_base: number;
  comisiones: ComisionDetalle[];
  total_comisiones: number;
  /** Meta contractual: NO se suma al ingreso bruto. */
  variable_objetivo: number;
  cumplimiento_variable_pct: number | null;

  total_ingresos: number;

  iess_personal: number;
  neto_a_pagar: number;

  /** Costo del empleador: informativo, nunca se descuenta del neto. */
  iess_patronal: number;

  provision_decimo_tercero: number;
  provision_decimo_cuarto: number;
  provision_fondos_reserva: number;
  fondos_reserva_aplica: boolean;
  meses_antiguedad: number | null;

  costo_total_empleador: number;
}

export interface NominaColaborador extends NominaDesglose {
  user_id: string;
  employee_code: string;
  cedula: string | null;
  nombre: string;
  puesto: string | null;
  area: string;
  nivel: string;
  business_unit: string | null;
  tipo_contrato: string;
  fecha_ingreso: string;
  esquema: string;
  moneda: string;
  vigente_desde: string;
}

export interface NominaResumen {
  periodo: string;
  colaboradores: number;
  total_ingresos: number;
  total_comisiones: number;
  total_iess_personal: number;
  total_neto: number;
  total_iess_patronal: number;
  total_provisiones: number;
  costo_total_empleador: number;
  con_fondos_reserva: number;
  con_comisiones: number;
}

export interface NominaTarifas {
  iess_personal_pct: number;
  iess_patronal_pct: number;
  iess_patronal_rango: [number, number];
  iess_patronal_ambiguo: boolean;
  sbu: number;
  fondos_reserva_pct: number;
  fondos_reserva_meses_minimos: number;
  anio_referencia: number;
  confirmado: boolean;
}

export interface NominaSupuestos {
  tarifas: NominaTarifas;
  conceptos_comision: { concepto: ConceptoComision; etiqueta: string }[];
  advertencias: string[];
}

export interface NominaCatalogos {
  areas: string[];
  esquemas: string[];
  tipos_contrato: string[];
  periodos: string[];
}

export interface NominaDashboardData {
  periodo: string;
  resumen: NominaResumen;
  colaboradores: NominaColaborador[];
  catalogos: NominaCatalogos;
  supuestos: NominaSupuestos;
}
