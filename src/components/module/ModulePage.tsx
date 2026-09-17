import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { moduleAnchor } from '@/lib/tour/anchors';

interface ModulePageProps {
  title: string;
  description?: string;
  /** Rendered at the top right: buttons, selectors, export actions */
  actions?: ReactNode;
  /** Rendered under the header, above the content: filters, tabs, KPI row */
  toolbar?: ReactNode;
  children: ReactNode;
  className?: string;
  /**
   * Opts the page into guided tours. Each region gets a `data-tour` anchor
   * (`module:{tourId}`, `:header`, `:actions`, `:toolbar`, `:content`) that a
   * tour step can target. Omit it and no attributes are emitted at all.
   */
  tourId?: string;
}

/**
 * Standard page chrome for every module.
 *
 * The inherited pages each re-implemented their own header markup, which is why
 * they grew to 600-700 lines. New modules compose this instead.
 */
export function ModulePage({ title, description, actions, toolbar, children, className, tourId }: ModulePageProps) {
  return (
    <div data-tour={moduleAnchor(tourId, 'root')} className={cn('flex flex-col gap-6 p-4 md:p-6', className)}>
      <header data-tour={moduleAnchor(tourId, 'header')} className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="font-display text-2xl font-semibold tracking-tight">{title}</h1>
          {description ? (
            <p className="text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {actions ? (
          <div data-tour={moduleAnchor(tourId, 'actions')} className="flex shrink-0 flex-wrap items-center gap-2">
            {actions}
          </div>
        ) : null}
      </header>

      {/* Only wrapped when the page opted in: a bare fragment toolbar would
          otherwise lose the parent's `gap-6` between its children. */}
      {tourId && toolbar ? (
        <div data-tour={moduleAnchor(tourId, 'toolbar')}>{toolbar}</div>
      ) : (
        toolbar
      )}

      <div data-tour={moduleAnchor(tourId, 'content')} className="flex flex-col gap-6">
        {children}
      </div>
    </div>
  );
}
