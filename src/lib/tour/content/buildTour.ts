import { anchorSelector } from '../anchors';
import type { TourDefinition, TourStep } from '../types';
import type { GuideSection, GuideTopic } from './types';

/** Derives a tour step from a topic, or null when the topic has no UI anchor. */
export function topicToStep(topic: GuideTopic): TourStep | null {
  if (!topic.anchor) return null;
  return {
    id: topic.id,
    target: anchorSelector(topic.anchor),
    title: topic.title,
    body: topic.summary,
    route: topic.route,
    moduleKey: topic.moduleKey,
    placement: topic.placement,
    align: topic.align,
  };
}

/** Derives the tour for a guide section, skipping its guide-only topics. */
export function sectionToTour(section: GuideSection): TourDefinition {
  return {
    id: section.id,
    label: section.label,
    description: section.description,
    steps: section.topics
      .map(topicToStep)
      .filter((step): step is TourStep => step !== null),
  };
}
