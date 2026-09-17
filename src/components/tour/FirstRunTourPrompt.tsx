import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/contexts/PermissionsContext';
import { useTour } from '@/contexts/TourContext';
import { shouldOfferOverviewTour } from '@/lib/tour/firstRun';
import { startAfterOverlay } from '@/lib/tour/startAfterOverlay';

const OVERVIEW_TOUR_ID = 'overview';

/**
 * Offers the overview tour once, on the first load after signing in.
 *
 * Both buttons mark the tour as seen: accepting starts it (and the provider
 * marks it on finish), declining marks it explicitly. Either way the dialog
 * never shows twice, which is the difference between an onboarding aid and a
 * nag.
 */
export function FirstRunTourPrompt() {
  const { user, loading: authLoading, role } = useAuth();
  const { loading: permissionsLoading } = usePermissions();
  const { startTour, hasSeen, markSeen, isRunning } = useTour();
  const [open, setOpen] = useState(false);
  const [resolved, setResolved] = useState(false);

  useEffect(() => {
    if (resolved) return;
    const shouldOffer = shouldOfferOverviewTour({
      authLoading,
      permissionsLoading,
      userId: user?.id,
      role,
      hasSeenOverview: hasSeen(OVERVIEW_TOUR_ID),
      isTourRunning: isRunning,
    });
    if (shouldOffer) {
      setOpen(true);
      setResolved(true);
    }
  }, [authLoading, permissionsLoading, user?.id, role, hasSeen, isRunning, resolved]);

  const dismiss = () => {
    markSeen(OVERVIEW_TOUR_ID);
    setOpen(false);
  };

  const accept = () => {
    markSeen(OVERVIEW_TOUR_ID);
    setOpen(false);
    startAfterOverlay(() => void startTour(OVERVIEW_TOUR_ID));
  };

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? setOpen(true) : dismiss())}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>¿Te mostramos el portal?</DialogTitle>
          <DialogDescription>
            Un recorrido de un minuto por el menú y las secciones principales. Puedes salir
            en cualquier momento y volver a verlo desde el botón de ayuda.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" onClick={dismiss}>
            Ahora no
          </Button>
          <Button onClick={accept}>Empezar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
