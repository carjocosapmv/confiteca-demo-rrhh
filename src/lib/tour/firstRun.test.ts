import { describe, it, expect } from 'vitest';
import { shouldOfferOverviewTour, type FirstRunConditions } from './firstRun';

const ready: FirstRunConditions = {
  authLoading: false,
  permissionsLoading: false,
  userId: 'user-1',
  role: 'admin',
  hasSeenOverview: false,
  isTourRunning: false,
};

describe('shouldOfferOverviewTour', () => {
  it('offers the tour once everything resolved and the user has not seen it', () => {
    expect(shouldOfferOverviewTour(ready)).toBe(true);
  });

  it('waits for auth to finish loading', () => {
    expect(shouldOfferOverviewTour({ ...ready, authLoading: true })).toBe(false);
  });

  it('waits for permissions to finish loading', () => {
    // Steps are permission-filtered, so offering before permissions land could
    // start a tour with the wrong steps.
    expect(shouldOfferOverviewTour({ ...ready, permissionsLoading: true })).toBe(false);
  });

  it('requires a resolved user and role', () => {
    expect(shouldOfferOverviewTour({ ...ready, userId: null })).toBe(false);
    expect(shouldOfferOverviewTour({ ...ready, role: null })).toBe(false);
  });

  it('never nags a user who already saw or dismissed the tour', () => {
    expect(shouldOfferOverviewTour({ ...ready, hasSeenOverview: true })).toBe(false);
  });

  it('does not interrupt a tour that is already running', () => {
    expect(shouldOfferOverviewTour({ ...ready, isTourRunning: true })).toBe(false);
  });
});
