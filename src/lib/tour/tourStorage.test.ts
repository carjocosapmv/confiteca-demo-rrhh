import { describe, it, expect, beforeEach, vi } from 'vitest';
import { tourStorageKey, hasSeenTour, markTourSeen, resetAllTours } from './tourStorage';

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('tourStorageKey', () => {
  it('builds the namespaced versioned key', () => {
    expect(tourStorageKey('42', 'overview')).toBe('confiteca:tour:v1:42:overview');
  });

  it('falls back to an anonymous bucket when there is no user id', () => {
    expect(tourStorageKey(undefined, 'overview')).toBe('confiteca:tour:v1:anonymous:overview');
  });
});

describe('hasSeenTour / markTourSeen', () => {
  it('reports false for a tour that was never seen', () => {
    expect(hasSeenTour('42', 'overview')).toBe(false);
  });

  it('reports true after the tour is marked as seen', () => {
    markTourSeen('42', 'overview');
    expect(hasSeenTour('42', 'overview')).toBe(true);
  });

  it('scopes seen state per user', () => {
    markTourSeen('42', 'overview');
    expect(hasSeenTour('99', 'overview')).toBe(false);
  });

  it('scopes seen state per tour', () => {
    markTourSeen('42', 'overview');
    expect(hasSeenTour('42', 'ausencias')).toBe(false);
  });

  it('writes the value under the documented key', () => {
    markTourSeen('42', 'overview');
    expect(localStorage.getItem('confiteca:tour:v1:42:overview')).not.toBeNull();
  });
});

describe('resetAllTours', () => {
  it('clears every tour key for the given user', () => {
    markTourSeen('42', 'overview');
    markTourSeen('42', 'ausencias');

    resetAllTours('42');

    expect(hasSeenTour('42', 'overview')).toBe(false);
    expect(hasSeenTour('42', 'ausencias')).toBe(false);
  });

  it('leaves other users tour state untouched', () => {
    markTourSeen('42', 'overview');
    markTourSeen('99', 'overview');

    resetAllTours('42');

    expect(hasSeenTour('99', 'overview')).toBe(true);
  });

  it('leaves unrelated localStorage entries untouched', () => {
    localStorage.setItem('confiteca:auth:token', 'abc');
    markTourSeen('42', 'overview');

    resetAllTours('42');

    expect(localStorage.getItem('confiteca:auth:token')).toBe('abc');
  });
});

describe('resilience', () => {
  it('returns false instead of throwing when localStorage reads fail', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });
    expect(() => hasSeenTour('42', 'overview')).not.toThrow();
    expect(hasSeenTour('42', 'overview')).toBe(false);
  });

  it('does not throw when localStorage writes fail', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    expect(() => markTourSeen('42', 'overview')).not.toThrow();
  });
});
