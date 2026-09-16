const TOUR_KEY_PREFIX = 'confiteca:tour:v1';
const ANONYMOUS_USER = 'anonymous';

/** `confiteca:tour:v1:{userId}:{tourId}` */
export function tourStorageKey(userId: string | undefined | null, tourId: string): string {
  return `${TOUR_KEY_PREFIX}:${userId || ANONYMOUS_USER}:${tourId}`;
}

/**
 * localStorage can throw (Safari private mode, storage disabled, quota).
 * Never let "have you seen this tour?" break the app — degrade to "not seen".
 */
function safeRead(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeWrite(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* storage unavailable — the tour just shows again next time */
  }
}

export function hasSeenTour(userId: string | undefined | null, tourId: string): boolean {
  return safeRead(tourStorageKey(userId, tourId)) !== null;
}

export function markTourSeen(userId: string | undefined | null, tourId: string): void {
  safeWrite(tourStorageKey(userId, tourId), new Date().toISOString());
}

/** Removes every tour key belonging to `userId`, leaving other namespaces alone. */
export function resetAllTours(userId: string | undefined | null): void {
  const userPrefix = `${TOUR_KEY_PREFIX}:${userId || ANONYMOUS_USER}:`;
  try {
    const doomed: string[] = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (key && key.startsWith(userPrefix)) doomed.push(key);
    }
    doomed.forEach((key) => localStorage.removeItem(key));
  } catch {
    /* storage unavailable — nothing to reset */
  }
}
