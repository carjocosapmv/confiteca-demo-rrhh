import { sectionToTour } from './buildTour';
import type { GuideSection } from './types';
import type { TourDefinition } from '../types';

import { overviewSection } from './overview';
import { ausenciasSection } from './ausencias';
import { rotacionSection } from './rotacion';
import { talentoSection } from './talento';
import { administracionSection } from './administracion';

/**
 * The single source of truth for guided-tour and help content.
 *
 * Sections are authored once as prose; the tours are derived from them, so the
 * popover text and the written guide can never contradict each other. Order is
 * meaningful: it is the order shown in the help menu.
 */
export const GUIDE_SECTIONS: GuideSection[] = [
  overviewSection,
  ausenciasSection,
  rotacionSection,
  talentoSection,
  administracionSection,
];

export const TOURS: TourDefinition[] = GUIDE_SECTIONS.map(sectionToTour);

export function getTour(tourId: string): TourDefinition | undefined {
  return TOURS.find((tour) => tour.id === tourId);
}

export function getGuideSection(sectionId: string): GuideSection | undefined {
  return GUIDE_SECTIONS.find((section) => section.id === sectionId);
}

export type { GuideSection, GuideTopic } from './types';
