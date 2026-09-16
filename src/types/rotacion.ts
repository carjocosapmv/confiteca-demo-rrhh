export interface RotacionResumen {
  headcount: number;
  bajas_12m: number;
  tasa_rotacion_12m: number;
  tasa_voluntaria_12m: number;
  tasa_involuntaria_12m: number;
  tasa_lamentable_12m: number;
  antiguedad_promedio_meses: number;
  antiguedad_mediana_meses: number;
  ausentismo_pct: number;
  horas_extra_promedio_mes: number;
  desempeno_promedio: number;
  clima_promedio: number;
  enps: number | null;
  costo_estimado_rotacion: number;
  ventana_meses: number;
}

export interface RotacionTendenciaPunto {
  periodo: string;
  etiqueta: string;
  headcount: number;
  bajas: number;
  bajas_voluntarias: number;
  tasa_anualizada: number;
}

export interface RotacionDimensionFila {
  categoria: string;
  headcount: number;
  muestra: number;
  muestra_suficiente: boolean;
  bajas_12m: number;
  bajas_voluntarias_12m: number;
  tasa_rotacion: number;
  antiguedad_promedio_meses: number;
  ausentismo_pct: number;
  horas_extra_promedio: number;
  salario_promedio: number;
  desempeno_promedio: number;
  clima_promedio: number;
}

export interface RotacionDimension {
  dimension: string;
  etiqueta: string;
  filas: RotacionDimensionFila[];
}

export interface RotacionMotivo {
  motivo: string;
  tipo: string;
  cantidad: number;
  porcentaje: number;
  es_lamentable: boolean;
}

export interface RotacionRiesgo {
  user_id: string;
  nombre: string;
  employee_code: string;
  puesto: string | null;
  area: string;
  supervisor: string | null;
  antiguedad_meses: number;
  score: number;
  nivel_riesgo: 'alto' | 'medio' | 'bajo';
  factores: string[];
}

export interface RotacionCatalogos {
  areas: string[];
  paises: string[];
  tipos_contrato: string[];
  niveles: string[];
  unidades: string[];
  dimensiones: Record<string, string>;
}

export interface RotacionDashboardData {
  resumen: RotacionResumen;
  tendencia: RotacionTendenciaPunto[];
  dimension: RotacionDimension;
  motivos: RotacionMotivo[];
  riesgo: RotacionRiesgo[];
  catalogos: RotacionCatalogos;
}
