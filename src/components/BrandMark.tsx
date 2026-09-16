import { cn } from '@/lib/utils';

interface BrandMarkProps {
  /** Render only the square icon (collapsed sidebar) */
  iconOnly?: boolean;
  /** Optional tagline under the wordmark */
  tagline?: string;
  className?: string;
  invert?: boolean;
}

/**
 * Text-based brand mark for the Confiteca demo.
 *
 * Intentionally typographic: the real logo asset has not been provided by the
 * client yet. Swapping this for an <img> later touches exactly one file.
 */
export function BrandMark({ iconOnly = false, tagline, className, invert = false }: BrandMarkProps) {
  const tone = invert ? 'text-white' : 'text-foreground';

  if (iconOnly) {
    return (
      <div
        className={cn(
          'flex size-8 shrink-0 items-center justify-center rounded-md bg-primary font-display text-sm font-bold text-primary-foreground',
          className,
        )}
        aria-label="Confiteca"
      >
        C
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col leading-none', className)}>
      <span className={cn('font-display text-lg font-semibold tracking-tight', tone)}>
        Confiteca
      </span>
      {tagline ? (
        <span className={cn('text-[10px] leading-tight', invert ? 'text-white/70' : 'text-muted-foreground')}>
          {tagline}
        </span>
      ) : null}
    </div>
  );
}
