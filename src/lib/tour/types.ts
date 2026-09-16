/**
 * Placement of the tour popover relative to its anchor element.
 * Mirrors the subset of driver.js placements we actually use.
 */
export type TourPlacement = 'top' | 'right' | 'bottom' | 'left';
export type TourAlignment = 'start' | 'center' | 'end';

export interface TourStep {
  /** Stable identifier, unique within a tour. Used for logging and tests. */
  id: string;
  /** CSS selector for the anchor element, e.g. `[data-tour="nav:/rotacion"]`. */
  target: string;
  /** Popover heading. */
  title: string;
  /** Popover body copy. Plain text or trusted HTML string. */
  body: string;
  /**
   * Route to navigate to before this step is shown. When present, the provider
   * navigates and waits for `target` to exist before advancing.
   */
  route?: string;
  /**
   * Permission module this step belongs to. Steps whose module the current user
   * cannot view are filtered out before the tour starts.
   */
  moduleKey?: string;
  placement?: TourPlacement;
  align?: TourAlignment;
  /** Escape hatch for steps that need to prepare the UI (open a dialog, etc.). */
  onBeforeStep?: () => Promise<void>;
}

export interface TourDefinition {
  /** Stable identifier, also used as the localStorage "seen" key suffix. */
  id: string;
  /** Human-readable name shown in the help menu. */
  label: string;
  /** One-line summary shown in the help menu. */
  description: string;
  steps: TourStep[];
}
