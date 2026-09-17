export interface FirstRunConditions {
  /** AuthContext is still resolving the session. */
  authLoading: boolean;
  /** PermissionsContext is still fetching the role/module matrix. */
  permissionsLoading: boolean;
  userId: string | null | undefined;
  role: string | null | undefined;
  hasSeenOverview: boolean;
  isTourRunning: boolean;
}

/**
 * Decides whether to offer the overview tour on first load.
 *
 * Pulled out of the component because the ordering matters and is easy to get
 * wrong: offering the tour before permissions resolve would build the step list
 * from an empty permission map and silently drop every gated step.
 */
export function shouldOfferOverviewTour(c: FirstRunConditions): boolean {
  if (c.authLoading || c.permissionsLoading) return false;
  if (!c.userId || !c.role) return false;
  if (c.hasSeenOverview) return false;
  if (c.isTourRunning) return false;
  return true;
}
