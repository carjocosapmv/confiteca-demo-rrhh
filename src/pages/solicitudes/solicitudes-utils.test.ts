import { describe, expect, it } from 'vitest';
import {
  admiteResolucion,
  descripcionValida,
  etiquetaEstado,
  etiquetaTipo,
  fechaCorta,
  varianteEstado,
} from './solicitudes-utils';

describe('etiquetaTipo', () => {
  it('traduce los tipos conocidos', () => {
    expect(etiquetaTipo('nomina')).toBe('Consulta de nómina');
    expect(etiquetaTipo('certificado')).toBe('Certificado o documento');
    expect(etiquetaTipo('otro')).toBe('Otro');
  });

  it('cae en "Otro" ante un tipo desconocido en lugar de mostrar el valor crudo', () => {
    expect(etiquetaTipo('inventado')).toBe('Otro');
  });
});

describe('etiquetaEstado', () => {
  it('usa el género correcto: la solicitud es femenina', () => {
    expect(etiquetaEstado('aprobado')).toBe('Aprobada');
    expect(etiquetaEstado('rechazado')).toBe('Rechazada');
    expect(etiquetaEstado('pendiente')).toBe('Pendiente');
  });
});

describe('admiteResolucion', () => {
  it('solo habilita acciones sobre solicitudes pendientes', () => {
    expect(admiteResolucion('pendiente')).toBe(true);
    expect(admiteResolucion('aprobado')).toBe(false);
    expect(admiteResolucion('rechazado')).toBe(false);
  });
});

describe('varianteEstado', () => {
  it('asigna una variante por estado', () => {
    expect(varianteEstado('pendiente')).toBe('outline');
    expect(varianteEstado('aprobado')).toBe('default');
    expect(varianteEstado('rechazado')).toBe('destructive');
  });
});

describe('descripcionValida', () => {
  it('rechaza textos demasiado cortos, incluso rellenos de espacios', () => {
    expect(descripcionValida('corto')).toBe(false);
    expect(descripcionValida('   corto   ')).toBe(false);
  });

  it('acepta un texto de al menos 10 caracteres útiles', () => {
    expect(descripcionValida('Me falta el pago de comisiones.')).toBe(true);
  });

  it('rechaza textos que superan el máximo del backend', () => {
    expect(descripcionValida('a'.repeat(1001))).toBe(false);
    expect(descripcionValida('a'.repeat(1000))).toBe(true);
  });
});

describe('fechaCorta', () => {
  it('devuelve un guion ante valores ausentes o inválidos', () => {
    expect(fechaCorta(null)).toBe('—');
    expect(fechaCorta(undefined)).toBe('—');
    expect(fechaCorta('no es una fecha')).toBe('—');
  });

  it('formatea una fecha ISO', () => {
    expect(fechaCorta('2026-03-15T12:00:00Z')).toContain('2026');
  });
});
