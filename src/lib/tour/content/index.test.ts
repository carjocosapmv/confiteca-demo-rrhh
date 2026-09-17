import { describe, it, expect } from 'vitest';
import { GUIDE_SECTIONS, TOURS, getGuideSection, getTour } from './index';
import { filterStepsByPermissions } from '../filterSteps';

describe('tour content registry', () => {
  it('exposes the overview tour plus one tour per domain group', () => {
    expect(TOURS.map((t) => t.id)).toEqual([
      'overview',
      'ausencias',
      'rotacion',
      'talento',
      'administracion',
    ]);
  });

  it('keeps one guide section per tour, sharing the same ids', () => {
    expect(GUIDE_SECTIONS.map((s) => s.id)).toEqual(TOURS.map((t) => t.id));
  });

  it('looks tours and sections up by id', () => {
    expect(getTour('rotacion')?.label).toBe('Rotación');
    expect(getGuideSection('rotacion')?.id).toBe('rotacion');
  });

  it('returns undefined for an unknown id instead of throwing', () => {
    expect(getTour('nope')).toBeUndefined();
    expect(getGuideSection('nope')).toBeUndefined();
  });
});

describe('tour content invariants', () => {
  it('gives every tour a non-empty set of steps', () => {
    for (const tour of TOURS) expect(tour.steps.length).toBeGreaterThan(0);
  });

  it('keeps the overview short enough to actually finish', () => {
    const overview = getTour('overview')!;
    expect(overview.steps.length).toBeGreaterThanOrEqual(6);
    expect(overview.steps.length).toBeLessThanOrEqual(8);
  });

  it('uses unique step ids within each tour', () => {
    for (const tour of TOURS) {
      const ids = tour.steps.map((s) => s.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('targets every step at a data-tour anchor, never a CSS class', () => {
    for (const tour of TOURS) {
      for (const step of tour.steps) {
        expect(step.target).toMatch(/^\[data-tour="[^"]+"\]$/);
      }
    }
  });

  it('gates every step of a domain tour behind a moduleKey', () => {
    // Without this, a domain tour would stay listed in the help menu for users
    // who cannot reach any of its screens.
    for (const tour of TOURS.filter((t) => t.id !== 'overview')) {
      for (const step of tour.steps) {
        expect(step.moduleKey, `${tour.id}/${step.id}`).toBeTruthy();
      }
    }
  });

  it('only references module keys seeded by the backend', () => {
    const seeded = new Set([
      'dashboard', 'vacaciones', 'vacantes', 'onboarding', 'induccion',
      'rotacion', 'copilot', 'onboarding_ia', 'documentos', 'dispensario',
      'evaluacion', 'nomina', 'reclutamiento', 'cartera',
      'admin_usuarios', 'admin_permisos',
    ]);
    for (const tour of TOURS) {
      for (const step of tour.steps) {
        if (step.moduleKey) expect(seeded, `${tour.id}/${step.id}`).toContain(step.moduleKey);
      }
    }
  });

  it('writes guide prose for every topic so /ayuda has content to render', () => {
    for (const section of GUIDE_SECTIONS) {
      expect(section.topics.length).toBeGreaterThan(0);
      for (const topic of section.topics) {
        expect(topic.summary.length).toBeGreaterThan(20);
        expect(topic.details.length).toBeGreaterThan(0);
        expect(topic.details.join(' ').length).toBeGreaterThan(80);
      }
    }
  });
});

describe('tour content under real role permissions', () => {
  const viewerModules = ['dashboard', 'vacaciones', 'rotacion', 'evaluacion', 'onboarding'];
  const canView = (key: string) => viewerModules.includes(key);

  it('leaves the viewer a usable overview, ausencias and rotacion tour', () => {
    for (const id of ['overview', 'ausencias', 'rotacion']) {
      const steps = filterStepsByPermissions(getTour(id)!.steps, canView);
      expect(steps.length, id).toBeGreaterThan(0);
    }
  });

  it('hides every administracion step from a viewer', () => {
    const steps = filterStepsByPermissions(getTour('administracion')!.steps, canView);
    expect(steps).toEqual([]);
  });
});
