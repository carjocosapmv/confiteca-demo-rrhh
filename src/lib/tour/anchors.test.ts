import { describe, it, expect } from 'vitest';
import { anchorSelector, moduleAnchor, statAnchor, tableAnchor } from './anchors';

describe('anchorSelector', () => {
  it('wraps an anchor name into a data-tour attribute selector', () => {
    expect(anchorSelector('nav:/rotacion')).toBe('[data-tour="nav:/rotacion"]');
  });
});

describe('moduleAnchor', () => {
  it('returns undefined when the page opted out of tour anchors', () => {
    expect(moduleAnchor(undefined, 'root')).toBeUndefined();
    expect(moduleAnchor('', 'header')).toBeUndefined();
  });

  it('namespaces the root region without a region suffix', () => {
    expect(moduleAnchor('rotacion', 'root')).toBe('module:rotacion');
  });

  it('suffixes every non-root region', () => {
    expect(moduleAnchor('rotacion', 'header')).toBe('module:rotacion:header');
    expect(moduleAnchor('rotacion', 'actions')).toBe('module:rotacion:actions');
    expect(moduleAnchor('rotacion', 'toolbar')).toBe('module:rotacion:toolbar');
    expect(moduleAnchor('rotacion', 'content')).toBe('module:rotacion:content');
  });
});

describe('statAnchor / tableAnchor', () => {
  it('returns undefined without a tour id', () => {
    expect(statAnchor(undefined)).toBeUndefined();
    expect(tableAnchor(undefined, 'root')).toBeUndefined();
  });

  it('namespaces stats and tables separately from modules', () => {
    expect(statAnchor('bajas-12m')).toBe('stat:bajas-12m');
    expect(tableAnchor('riesgo', 'root')).toBe('table:riesgo');
    expect(tableAnchor('riesgo', 'toolbar')).toBe('table:riesgo:toolbar');
  });
});
