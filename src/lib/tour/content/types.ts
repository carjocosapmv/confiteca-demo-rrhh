import type { TourAlignment, TourPlacement } from '../types';

/**
 * A single explainable thing in the product: a screen, a group of screens or a
 * concept. One topic feeds two surfaces:
 *
 *   - the guided tour popover  -> `title` + `summary`
 *   - the written guide page   -> `title` + `summary` + `details`
 *
 * Keeping both on one object is the point: the tour and the guide can never
 * drift apart because there is only one copy of the facts.
 */
export interface GuideTopic {
  /** Stable id, unique within its section. Becomes the tour step id. */
  id: string;
  title: string;
  /** One or two sentences. Shown verbatim in the tour popover. */
  summary: string;
  /** Long-form paragraphs: what it is, what it is for, who uses it. */
  details: string[];
  /**
   * `data-tour` anchor name this topic points at, e.g. `nav:/rotacion`.
   * Topics without an anchor are guide-only and produce no tour step.
   */
  anchor?: string;
  /** Route the tour navigates to before showing this step. */
  route?: string;
  /** Permission module gating this topic. */
  moduleKey?: string;
  placement?: TourPlacement;
  align?: TourAlignment;
}

/** A domain group: one guide chapter and one tour, sharing the same id. */
export interface GuideSection {
  id: string;
  label: string;
  description: string;
  topics: GuideTopic[];
}
