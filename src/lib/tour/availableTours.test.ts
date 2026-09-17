import { describe, it, expect } from 'vitest';
import { getAvailableTours } from './availableTours';
import type { TourDefinition } from './types';

function tour(id: string, moduleKeys: (string | undefined)[]): TourDefinition {
  return {
    id,
    label: id,
    description: id,
    steps: moduleKeys.map((moduleKey, i) => ({
      id: `${id}-${i}`,
      target: `[data-tour="${id}-${i}"]`,
      title: 't',
      body: 'b',
      moduleKey,
    })),
  };
}

const allow = (keys: string[]) => (key: string) => keys.includes(key);

describe('getAvailableTours', () => {
  it('keeps a tour when at least one step survives permission filtering', () => {
    const tours = [tour('ausencias', ['vacaciones', 'vacaciones'])];
    expect(getAvailableTours(tours, allow(['vacaciones'])).map((t) => t.id)).toEqual(['ausencias']);
  });

  it('drops a tour whose every step is gated behind modules the user cannot view', () => {
    const tours = [tour('administracion', ['admin_usuarios', 'admin_permisos'])];
    expect(getAvailableTours(tours, allow([]))).toEqual([]);
  });

  it('always keeps chrome-only tours such as the overview', () => {
    const tours = [tour('overview', [undefined])];
    expect(getAvailableTours(tours, allow([])).map((t) => t.id)).toEqual(['overview']);
  });

  it('preserves registry order and returns tours carrying only their visible steps', () => {
    const tours = [tour('a', ['x']), tour('b', ['y', 'x']), tour('c', ['z'])];
    const result = getAvailableTours(tours, allow(['x', 'y']));
    expect(result.map((t) => t.id)).toEqual(['a', 'b']);
    expect(result[1].steps.map((s) => s.moduleKey)).toEqual(['y', 'x']);
  });
});
