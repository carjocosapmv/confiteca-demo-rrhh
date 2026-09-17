import { filterStepsByPermissions } from './filterSteps';
import type { TourDefinition } from './types';

/**
 * Tours the current user can actually complete, each trimmed to its visible
 * steps.
 *
 * A tour survives when at least one step passes permission filtering. Domain
 * tours gate every step behind a `moduleKey`, so a user with no access to the
 * domain loses the whole tour; the overview is chrome-only and always stays.
 */
export function getAvailableTours(
  tours: TourDefinition[],
  canView: (moduleKey: string) => boolean,
): TourDefinition[] {
  const available: TourDefinition[] = [];
  for (const tour of tours) {
    const steps = filterStepsByPermissions(tour.steps, canView);
    if (steps.length > 0) available.push({ ...tour, steps });
  }
  return available;
}
