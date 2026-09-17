import { ReactNode } from 'react';
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

export interface DetailField {
  label: string;
  value: ReactNode;
  /** Span the full width instead of half */
  wide?: boolean;
}

export interface DetailSection {
  title?: string;
  fields: DetailField[];
}

interface DetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  sections?: DetailSection[];
  /** Free-form content rendered after the sections */
  children?: ReactNode;
  /** Sticky action bar at the bottom (e.g. ApprovalBar) */
  footer?: ReactNode;
  className?: string;
}

/**
 * Section renderer, split out of the drawer so the same breakdown can be shown
 * inline on a page.
 *
 * "Mi Nómina" shows a colaborador the exact figures the admin module shows in
 * its drawer; keeping one renderer is what stops the two views from drifting
 * into two different payslips.
 */
export function DetailSections({ sections, className }: { sections: DetailSection[]; className?: string }) {
  return (
    <div className={cn('space-y-5', className)}>
      {sections.map((section, index) => (
        <section key={section.title ?? `section-${index}`} className="space-y-3">
          {section.title ? (
            <>
              <Separator />
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {section.title}
              </h3>
            </>
          ) : null}
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
            {section.fields.map((field) => (
              <div key={field.label} className={cn('space-y-0.5', field.wide && 'col-span-2')}>
                <dt className="text-xs text-muted-foreground">{field.label}</dt>
                <dd className="text-sm font-medium">{field.value ?? '—'}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </div>
  );
}

/** Side panel used by every module to show a record without leaving the list. */
export function DetailDrawer({
  open, onOpenChange, title, description, sections = [], children, footer, className,
}: DetailDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className={cn('flex w-full flex-col gap-0 sm:max-w-lg', className)}>
        <SheetHeader className="pb-4">
          <SheetTitle>{title}</SheetTitle>
          {description ? <SheetDescription>{description}</SheetDescription> : null}
        </SheetHeader>

        <div className="flex-1 space-y-5 overflow-y-auto pb-4">
          <DetailSections sections={sections} />
          {children}
        </div>

        {footer ? <div className="border-t pt-4">{footer}</div> : null}
      </SheetContent>
    </Sheet>
  );
}
