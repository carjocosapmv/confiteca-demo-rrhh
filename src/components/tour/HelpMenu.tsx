import { useMemo } from 'react';
import { HelpCircle, RotateCcw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { usePermissions } from '@/contexts/PermissionsContext';
import { useTour } from '@/contexts/TourContext';
import { getAvailableTours } from '@/lib/tour/availableTours';
import { TOURS } from '@/lib/tour/content';
import { startAfterOverlay } from '@/lib/tour/startAfterOverlay';

/**
 * Permanent entry point to the guided tours, in the app header.
 *
 * Only lists tours the user can actually complete: a tour whose every step is
 * gated behind modules the role cannot view is dropped entirely, so the menu
 * never advertises a walkthrough that would abort on its first step.
 */
export function HelpMenu() {
  const { canView } = usePermissions();
  const { startTour, resetAll } = useTour();

  const tours = useMemo(() => getAvailableTours(TOURS, canView), [canView]);

  return (
    // `modal={false}`: a modal dropdown locks <body> pointer events, which
    // would fight the tour overlay we are about to open.
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          data-tour="chrome:help"
          variant="ghost"
          size="icon"
          aria-label="Ayuda y recorridos guiados"
        >
          <HelpCircle className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel>Recorridos guiados</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {tours.map((tour) => (
          <DropdownMenuItem
            key={tour.id}
            className="flex flex-col items-start gap-0.5"
            onSelect={() => startAfterOverlay(() => void startTour(tour.id))}
          >
            <span className="font-medium">{tour.label}</span>
            <span className="text-xs text-muted-foreground">{tour.description}</span>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        {/* TODO(PR3): add "Abrir guía completa" pointing at /ayuda once the
            written guide page exists. */}
        <DropdownMenuItem onSelect={() => resetAll()}>
          <RotateCcw className="mr-2 h-4 w-4" />
          Reiniciar recorridos
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
