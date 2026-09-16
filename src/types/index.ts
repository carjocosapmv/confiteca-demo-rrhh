export interface UnidadNegocio {
  id: string;
  nombre: string;
  responsable: string;
}

// Catálogo global de centros de costos
export interface CentroCostos {
  id: string;
  nombre: string;
  codigo: string; // e.g. "6", "7"
  descripcion: string;
  activo: boolean;
  department_id?: string; // departamento (unidad de negocio) vinculado para autoasignación
}

// Listado maestro de colaboradores (independiente de unidad)
export interface Colaborador {
  id: string;
  nombre: string;
  rol: string; // legacy free-text label, kept for compat
  puesto_id?: string | null;
  costo_empresa: number; // costo total mensual
  email?: string;
  activo: boolean;
}

// Asignación de un colaborador a una unidad con % de dedicación
// Equipos o Marcas dentro de una Unidad de Negocio
export interface EquipoMarca {
  id: string;
  unidad_negocio_id: string;
  nombre: string;
  responsable_id: string; // colaborador_id del responsable
  activo: boolean;
}

// Asignación de un colaborador a una unidad con % de dedicación
export interface ColaboradorAsignacion {
  id: string;
  colaborador_id: string;
  unidad_negocio_id: string;
  equipo_marca_id?: string; // opcional, asignar a un equipo/marca específico
  porcentaje_asignacion: number; // % del tiempo dedicado a esta unidad
  costo_imputado: number; // costo_empresa * porcentaje_asignacion / 100
}

export type EstadoFactura = 'pendiente' | 'facturado' | 'cobrado';

export interface Ingreso {
  id: string;
  unidad_negocio_id: string;
  equipo_marca_id?: string; // equipo/marca asociado
  cliente: string;
  marca?: string; // marca asociada al ingreso (puede diferir del cliente)
  nombre_comercial?: string; // nombre comercial del cliente
  centro_costos: string;
  mes: string; // YYYY-MM
  monto: number;
  descripcion: string;
  factura: string;
  estado_factura: EstadoFactura; // pendiente | facturado | cobrado
  es_interno: boolean; // true si es una factura entre unidades internas
  unidad_origen_id?: string; // unidad que emite la factura interna
  egreso_vinculado_id?: string; // ID del egreso espejo generado automáticamente
}

export interface EgresoOperativo {
  id: string;
  unidad_negocio_id: string;
  equipo_marca_id?: string; // equipo/marca asociado
  tipo_gasto: string;
  proveedor: string;
  centro_costos: string;
  mes: string;
  monto: number;
  orden_compra: string;
  descripcion: string;
  es_interno: boolean; // true si fue generado automáticamente por factura interna
  ingreso_vinculado_id?: string; // ID del ingreso que generó este egreso
  source_tool_id?: string; // si proviene de imputación automática de una herramienta
}

export interface MiembroEquipo {
  id: string;
  unidad_negocio_id: string;
  colaborador: string;
  rol: string;
  costo_empresa: number;
  porcentaje_asignacion: number;
  costo_imputado: number; // computed: costo_empresa * porcentaje_asignacion / 100
}

export interface Herramienta {
  id: string;
  unidad_negocio_id: string;
  herramienta: string;
  costo_total: number;
  porcentaje_asignacion: number;
  costo_imputado: number; // computed: costo_total * porcentaje_asignacion / 100
  department_id?: string; // vinculación con departamento
  mes?: string; // YYYY-MM start month; if set, only counts from this month onwards
}

export interface ConfiguracionComisiones {
  id: string;
  unidad_negocio_id?: string;
  porcentaje_max_costo_equipo: number; // default 50
  porcentaje_max_fondo_comision: number; // default 4
}

export interface EvaluacionEquipo {
  id: string;
  unidad_negocio_id: string;
  colaborador: string;
  trimestre: string; // e.g. "2026-Q1"
  impacto_equipo: number; // percentage e.g. 0.4
  evaluacion_desempeno: number; // 0-100
  porcentaje_acumulado_pendiente: number;
}

// Distribution table from Excel (PAX 2-10)
export const DISTRIBUCION_PAX: Record<number, number[]> = {
  2: [30, 40, 30],
  3: [27.5, 32.5, 20, 20],
  4: [25, 27.5, 17.5, 17.5, 12.5],
  5: [22.5, 27.5, 12.5, 12.5, 12.5, 12.5],
  6: [20, 25, 12.5, 12.5, 10, 10, 10],
  7: [20, 22.5, 12.5, 10, 10, 10, 7.5, 7.5],
  8: [17.5, 20, 12.5, 10, 10, 8, 8, 7, 7],
  9: [17, 20, 12.5, 8, 8, 8, 7.5, 7, 6, 6],
  10: [16, 18, 12, 8, 8, 7, 7, 6, 6, 6, 6],
};

// Financial summary for a unit in a period
export interface ResumenFinanciero {
  totalIngresos: number;
  totalEgresosOperativos: number;
  totalEgresosEquipo: number;
  totalEgresosHerramientas: number;
  totalEgresos: number;
  margenOperativo: number;
  rendimiento: number; // margen / ingresos
  esRentable: boolean;
}

export interface ComisionTrimestral {
  ingresosTotales: number;
  costoEquipoTotal: number;
  porcentajeCostoEquipo: number;
  cumpleCondicion: boolean; // costo equipo <= 50% ingresos
  optimizacion: number; // 50% - porcentaje real
  fondoComision: number; // min(optimizacion, 4%) * ingresos
  distribuciones: {
    colaborador: string;
    impactoEquipo: number;
    comisionBase: number;
    evaluacion: number;
    comisionFinal: number;
    pendienteAcumulado: number;
  }[];
}

export type Periodo = 'mensual' | 'trimestral' | 'anual';
export type Trimestre = 'Q1' | 'Q2' | 'Q3' | 'Q4';
