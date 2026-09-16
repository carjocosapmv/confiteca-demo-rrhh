import { describe, it, expect } from 'vitest';
import { filterStepsByPermissions } from './filterSteps';
import type { TourStep } from './types';

const steps: TourStep[] = [
  { id: 'layout', target: '[data-tour="chrome:sidebar-trigger"]', title: 'Layout', body: 'Chrome' },
  { id: 'ausencias', target: '[data-tour="nav:/vacaciones"]', title: 'Ausencias', body: 'Vac', moduleKey: 'vacaciones' },
  { id: 'rotacion', target: '[data-tour="nav:/rotacion"]', title: 'Rotación', body: 'Rot', moduleKey: 'rotacion' },
  { id: 'admin', target: '[data-tour="nav:/admin/usuarios"]', title: 'Admin', body: 'Adm', moduleKey: 'admin_usuarios' },
];

describe('filterStepsByPermissions', () => {
  it('keeps steps without a moduleKey regardless of permissions', () => {
    const result = filterStepsByPermissions(steps, () => false);
    expect(result.map(s => s.id)).toEqual(['layout']);
  });

  it('drops steps whose moduleKey is not viewable', () => {
    const canView = (key: string) => key === 'vacaciones';
    const result = filterStepsByPermissions(steps, canView);
    expect(result.map(s => s.id)).toEqual(['layout', 'ausencias']);
  });

  it('keeps every step when all modules are viewable (superadmin)', () => {
    const result = filterStepsByPermissions(steps, () => true);
    expect(result.map(s => s.id)).toEqual(['layout', 'ausencias', 'rotacion', 'admin']);
  });

  it('preserves the original step order', () => {
    const canView = (key: string) => key !== 'rotacion';
    const result = filterStepsByPermissions(steps, canView);
    expect(result.map(s => s.id)).toEqual(['layout', 'ausencias', 'admin']);
  });

  it('does not mutate the input array', () => {
    const input = [...steps];
    filterStepsByPermissions(input, () => false);
    expect(input).toHaveLength(4);
  });

  it('returns an empty array for empty input', () => {
    expect(filterStepsByPermissions([], () => true)).toEqual([]);
  });
});
