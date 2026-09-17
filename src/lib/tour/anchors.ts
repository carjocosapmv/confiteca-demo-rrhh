/**
 * Helpers for building `data-tour` anchor names.
 *
 * Tours address the UI through `data-tour` attributes instead of CSS classes or
 * DOM structure, so restyling a component never silently breaks a tour. These
 * helpers keep the naming scheme in one place:
 *
 *   chrome:{name}            app shell (sidebar trigger, notifications, help)
 *   nav:{url}                sidebar navigation link
 *   navgroup:{label}         sidebar navigation group
 *   module:{tourId}[:region] page scaffold regions
 *   stat:{tourId}            a single KPI card
 *   table:{tourId}[:region]  a data table and its toolbar
 */

export type ModuleRegion = 'root' | 'header' | 'actions' | 'toolbar' | 'content';
export type TableRegion = 'root' | 'toolbar';

/** Turns an anchor name into the selector a tour step targets. */
export function anchorSelector(anchor: string): string {
  return `[data-tour="${anchor}"]`;
}

function namespaced(prefix: string, tourId: string | undefined, region: string): string | undefined {
  // Components opt in. No id means no attribute at all, so nothing changes for
  // the pages that never asked to be tour-aware.
  if (!tourId) return undefined;
  return region === 'root' ? `${prefix}:${tourId}` : `${prefix}:${tourId}:${region}`;
}

export function moduleAnchor(tourId: string | undefined, region: ModuleRegion): string | undefined {
  return namespaced('module', tourId, region);
}

export function tableAnchor(tourId: string | undefined, region: TableRegion): string | undefined {
  return namespaced('table', tourId, region);
}

export function statAnchor(tourId: string | undefined): string | undefined {
  return namespaced('stat', tourId, 'root');
}
