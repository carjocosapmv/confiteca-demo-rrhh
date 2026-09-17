import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { driver, type Driver, type DriveStep } from 'driver.js';
import 'driver.js/dist/driver.css';

import { useSidebar } from '@/components/ui/sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/contexts/PermissionsContext';
import { filterStepsByPermissions } from '@/lib/tour/filterSteps';
import { waitForElement } from '@/lib/tour/waitForElement';
import { hasSeenTour, markTourSeen, resetAllTours } from '@/lib/tour/tourStorage';
import { getTour } from '@/lib/tour/tours';
import type { TourStep } from '@/lib/tour/types';

/** How long we wait for a step anchor to show up after navigating. */
const STEP_TIMEOUT_MS = 3000;

interface TourContextValue {
  startTour: (tourId: string) => Promise<void>;
  stopTour: () => void;
  isRunning: boolean;
  hasSeen: (tourId: string) => boolean;
  /** Marks a tour as seen without running it (e.g. dismissing the first-run prompt). */
  markSeen: (tourId: string) => void;
  resetAll: () => void;
}

const TourContext = createContext<TourContextValue | null>(null);

function toDriveStep(step: TourStep): DriveStep {
  return {
    element: step.target,
    popover: {
      title: step.title,
      description: step.body,
      side: step.placement ?? 'bottom',
      align: step.align ?? 'start',
    },
  };
}

export function TourProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const { isMobile, setOpen, setOpenMobile } = useSidebar();
  const { user } = useAuth();
  const { canView } = usePermissions();

  const driverRef = useRef<Driver | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const userId = user?.id;

  /**
   * Every nav anchor lives inside the sidebar, so it must be expanded before a
   * step can be highlighted. On mobile the sidebar is a Radix Sheet.
   */
  const openSidebar = useCallback(() => {
    if (isMobile) setOpenMobile(true);
    else setOpen(true);
  }, [isMobile, setOpen, setOpenMobile]);

  /**
   * Navigate (if needed), reveal the sidebar, run the step's own hook, then
   * wait for the anchor to exist. Returns false when the anchor never appears
   * so the caller can skip the step instead of highlighting nothing.
   */
  const prepareStep = useCallback(
    async (step: TourStep): Promise<boolean> => {
      if (step.route && step.route !== window.location.pathname) {
        navigate(step.route);
      }
      openSidebar();
      await step.onBeforeStep?.();
      const element = await waitForElement(step.target, { timeoutMs: STEP_TIMEOUT_MS });
      if (!element) {
        console.warn(`[tour] anchor not found for step "${step.id}": ${step.target}`);
      }
      return element !== null;
    },
    [navigate, openSidebar],
  );

  const stopTour = useCallback(() => {
    driverRef.current?.destroy();
  }, []);

  const startTour = useCallback(
    async (tourId: string) => {
      const definition = getTour(tourId);
      if (!definition) {
        console.warn(`[tour] unknown tour "${tourId}"`);
        return;
      }

      const steps = filterStepsByPermissions(definition.steps, canView);
      if (steps.length === 0) {
        console.warn(`[tour] "${tourId}" has no visible steps for this user`);
        return;
      }

      // Never let two tours run at once.
      driverRef.current?.destroy();

      const instance = driver({
        steps: steps.map(toDriveStep),
        animate: true,
        allowClose: true,
        showProgress: true,
        overlayOpacity: 0.55,
        stagePadding: 6,
        stageRadius: 8,
        popoverClass: 'confiteca-tour-popover',
        nextBtnText: 'Siguiente',
        prevBtnText: 'Anterior',
        doneBtnText: 'Listo',
        progressText: '{{current}} de {{total}}',
        onNextClick: () => {
          const active = driverRef.current;
          if (!active) return;
          const index = active.getActiveIndex();
          if (index === undefined) return;
          const next = steps[index + 1];
          if (!next) {
            active.destroy();
            return;
          }
          // driver.js hooks are synchronous; do the async prep then advance.
          void prepareStep(next).then(() => active.moveNext());
        },
        onPrevClick: () => {
          const active = driverRef.current;
          if (!active) return;
          const index = active.getActiveIndex();
          if (index === undefined || index === 0) return;
          const previous = steps[index - 1];
          void prepareStep(previous).then(() => active.movePrevious());
        },
        onDestroyed: () => {
          markTourSeen(userId, definition.id);
          driverRef.current = null;
          setIsRunning(false);
        },
      });

      driverRef.current = instance;
      await prepareStep(steps[0]);
      setIsRunning(true);
      instance.drive();
    },
    [canView, prepareStep, userId],
  );

  const hasSeen = useCallback((tourId: string) => hasSeenTour(userId, tourId), [userId]);
  const markSeen = useCallback((tourId: string) => markTourSeen(userId, tourId), [userId]);
  const resetAll = useCallback(() => resetAllTours(userId), [userId]);

  // Never leave an overlay behind on unmount (logout, route teardown).
  useEffect(() => () => driverRef.current?.destroy(), []);

  // Dev-only console shortcut. The Help menu is the user-facing entry point;
  // this stays because it is the fastest way to replay one specific tour while
  // working on its content. Stripped from production builds by `import.meta.env.DEV`.
  // Usage in the browser console: __tour.start('rotacion')
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    (window as unknown as Record<string, unknown>).__tour = {
      start: startTour,
      stop: stopTour,
      reset: resetAll,
    };
    return () => {
      delete (window as unknown as Record<string, unknown>).__tour;
    };
  }, [startTour, stopTour, resetAll]);

  const value = useMemo<TourContextValue>(
    () => ({ startTour, stopTour, isRunning, hasSeen, markSeen, resetAll }),
    [startTour, stopTour, isRunning, hasSeen, markSeen, resetAll],
  );

  return <TourContext.Provider value={value}>{children}</TourContext.Provider>;
}

export function useTour() {
  const ctx = useContext(TourContext);
  if (!ctx) throw new Error('useTour must be used within TourProvider');
  return ctx;
}
