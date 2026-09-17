import { describe, it, expect } from 'vitest';
import {
  ESTIMADO_SUFIJO,
  etiquetaEsquema,
  etiquetaPeriodo,
  formatoDinero,
  formatoPorcentaje,
  textoAntiguedad,
  totalProvisiones,
} from './nomina-utils';
import type { NominaDesglose } from '@/types/nomina';

const desglose = (overrides: Partial<NominaDesglose> = {}): NominaDesglose => ({
  salario_base: 1000,
  comisiones: [],
  total_comisiones: 0,
  variable_objetivo: 0,
  cumplimiento_variable_pct: null,
  total_ingresos: 1000,
  iess_personal: 94.5,
  neto_a_pagar: 905.5,
  iess_patronal: 111.5,
  provision_decimo_tercero: 83.33,
  provision_decimo_cuarto: 40.17,
  provision_fondos_reserva: 83.3,
  fondos_reserva_aplica: true,
  meses_antiguedad: 24,
  costo_total_empleador: 1318.3,
  ...overrides,
});

describe('formatoDinero', () => {
  it('formatea en dólares', () => {
    expect(formatoDinero(1234.5)).toContain('1.234,50');
  });

  it('trata null como cero', () => {
    expect(formatoDinero(null)).toContain('0,00');
  });
});

describe('formatoPorcentaje', () => {
  it('muestra un decimal', () => {
    expect(formatoPorcentaje(9.45)).toBe('9,5%');
  });

  it('redondea sobre el decimal, no con toFixed', () => {
    // (9.45).toFixed(1) === "9.4": 9,45% es una tarifa real del módulo.
    expect(formatoPorcentaje(9.45)).toBe('9,5%');
  });

  it('admite dos decimales para mostrar tarifas exactas', () => {
    expect(formatoPorcentaje(9.45, 2)).toBe('9,45%');
    expect(formatoPorcentaje(11.15, 2)).toBe('11,15%');
    expect(formatoPorcentaje(8.33, 2)).toBe('8,33%');
  });

  it('omite decimales innecesarios', () => {
    expect(formatoPorcentaje(50)).toBe('50%');
  });

  it('devuelve un guion cuando no hay dato', () => {
    expect(formatoPorcentaje(null)).toBe('—');
  });
});

describe('etiquetaPeriodo', () => {
  it('convierte YYYY-MM a mes y año', () => {
    expect(etiquetaPeriodo('2026-03')).toBe('marzo 2026');
  });

  it('devuelve la entrada cuando no es un período válido', () => {
    expect(etiquetaPeriodo('no-es-periodo')).toBe('no-es-periodo');
  });
});

describe('etiquetaEsquema', () => {
  it('traduce los esquemas conocidos', () => {
    expect(etiquetaEsquema('fijo')).toBe('Fijo');
    expect(etiquetaEsquema('fijo_variable')).toBe('Fijo + variable');
    expect(etiquetaEsquema('comision')).toBe('Comisión');
  });

  it('devuelve el valor original si es desconocido', () => {
    expect(etiquetaEsquema('otro')).toBe('otro');
  });
});

describe('textoAntiguedad', () => {
  it('describe meses cuando es menos de un año', () => {
    expect(textoAntiguedad(7)).toBe('7 meses');
  });

  it('describe años y meses', () => {
    expect(textoAntiguedad(26)).toBe('2 años 2 meses');
  });

  it('omite los meses cuando son exactos', () => {
    expect(textoAntiguedad(24)).toBe('2 años');
  });

  it('maneja la ausencia de dato', () => {
    expect(textoAntiguedad(null)).toBe('Sin dato');
  });
});

describe('totalProvisiones', () => {
  it('suma las tres provisiones', () => {
    expect(totalProvisiones(desglose())).toBeCloseTo(206.8, 2);
  });

  it('excluye fondos de reserva cuando no aplican', () => {
    expect(
      totalProvisiones(desglose({ provision_fondos_reserva: 0, fondos_reserva_aplica: false })),
    ).toBeCloseTo(123.5, 2);
  });
});

describe('ESTIMADO_SUFIJO', () => {
  it('deja explícito que el valor no está confirmado', () => {
    expect(ESTIMADO_SUFIJO.toLowerCase()).toContain('estimado');
    expect(ESTIMADO_SUFIJO.toLowerCase()).toContain('confirmaci');
  });
});
