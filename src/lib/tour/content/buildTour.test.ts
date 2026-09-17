import { describe, it, expect } from 'vitest';
import { sectionToTour, topicToStep } from './buildTour';
import type { GuideSection, GuideTopic } from './types';

const anchored: GuideTopic = {
  id: 'nueva-solicitud',
  title: 'Nueva Solicitud',
  summary: 'Carga una solicitud de vacaciones en pocos pasos.',
  details: ['Párrafo largo para la guía escrita.'],
  anchor: 'nav:/vacaciones/nueva',
  route: '/vacaciones/nueva',
  moduleKey: 'vacaciones',
  placement: 'right',
};

const proseOnly: GuideTopic = {
  id: 'politica',
  title: 'Política de vacaciones',
  summary: 'Cómo se acumulan los días.',
  details: ['Solo texto: no tiene anclaje en la interfaz.'],
  moduleKey: 'vacaciones',
};

describe('topicToStep', () => {
  it('derives a tour step from an anchored topic, reusing title and summary', () => {
    const step = topicToStep(anchored);
    expect(step).toEqual({
      id: 'nueva-solicitud',
      target: '[data-tour="nav:/vacaciones/nueva"]',
      title: 'Nueva Solicitud',
      body: 'Carga una solicitud de vacaciones en pocos pasos.',
      route: '/vacaciones/nueva',
      moduleKey: 'vacaciones',
      placement: 'right',
      align: undefined,
    });
  });

  it('returns null for guide-only topics so prose can be richer than the tour', () => {
    expect(topicToStep(proseOnly)).toBeNull();
  });
});

describe('sectionToTour', () => {
  const section: GuideSection = {
    id: 'ausencias',
    label: 'Ausencias',
    description: 'Solicitudes, saldos y calendario.',
    topics: [anchored, proseOnly],
  };

  it('carries the section identity onto the tour definition', () => {
    const tour = sectionToTour(section);
    expect(tour.id).toBe('ausencias');
    expect(tour.label).toBe('Ausencias');
    expect(tour.description).toBe('Solicitudes, saldos y calendario.');
  });

  it('includes only anchored topics as steps, in order', () => {
    expect(sectionToTour(section).steps.map((s) => s.id)).toEqual(['nueva-solicitud']);
  });
});
