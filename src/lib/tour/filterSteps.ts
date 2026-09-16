import type { TourStep } from './types';

/**
 * Drops steps the current user is not allowed to see.
 *
 * A step without `moduleKey` is considered chrome (layout, sidebar, header) and
 * always passes. Order of the surviving steps is preserved.
 */
export function filterStepsByPermissions(
  steps: TourStep[],
  canView: (moduleKey: string) => boolean,
): TourStep[] {
  return steps.filter((step) => !step.moduleKey || canView(step.moduleKey));
}
