import type { TourDefinition } from './types';

/**
 * Proof-of-life tour shipped with the tour infrastructure (PR1).
 * Domain tours (Ausencias, Rotación, Talento, Administración) land in PR3.
 *
 * Targets are `data-tour` anchors so the tour never couples to CSS classes
 * or DOM structure.
 */
export const overviewTour: TourDefinition = {
  id: 'overview',
  label: 'Recorrido general',
  description: 'Conocé la navegación y las secciones principales del portal.',
  steps: [
    {
      id: 'welcome',
      target: '[data-tour="chrome:sidebar-trigger"]',
      title: 'Bienvenido al portal de Talento Humano',
      body: 'Te mostramos en un minuto cómo moverte por el sistema. Podés salir cuando quieras con la tecla Escape.',
      placement: 'bottom',
      align: 'start',
    },
    {
      id: 'sidebar-trigger',
      target: '[data-tour="chrome:sidebar-trigger"]',
      title: 'Menú lateral',
      body: 'Este botón contrae o expande el menú para darte más espacio de trabajo.',
      placement: 'bottom',
      align: 'start',
    },
    {
      id: 'nav-general',
      target: '[data-tour="navgroup:General"]',
      title: 'General',
      body: 'Tu punto de partida: el dashboard con los indicadores del día y tus notificaciones.',
      placement: 'right',
    },
    {
      id: 'nav-ausencias',
      target: '[data-tour="navgroup:Ausencias"]',
      title: 'Ausencias',
      body: 'Solicitá vacaciones, revisá el estado de tus pedidos y consultá el calendario del equipo.',
      placement: 'right',
      moduleKey: 'vacaciones',
    },
    {
      id: 'nav-analitica',
      target: '[data-tour="navgroup:Analítica"]',
      title: 'Analítica',
      body: 'Indicadores de rotación para entender cómo evoluciona la plantilla.',
      placement: 'right',
      moduleKey: 'rotacion',
    },
    {
      id: 'nav-talento',
      target: '[data-tour="navgroup:Talento"]',
      title: 'Talento',
      body: 'Vacantes, descriptivos de puesto e inducción de nuevos colaboradores.',
      placement: 'right',
      moduleKey: 'vacantes',
    },
    {
      id: 'nav-administracion',
      target: '[data-tour="navgroup:Administración"]',
      title: 'Administración',
      body: 'Gestión de usuarios y permisos por rol. Solo visible para perfiles administradores.',
      placement: 'right',
      moduleKey: 'admin_usuarios',
    },
    {
      id: 'notifications',
      target: '[data-tour="chrome:notifications"]',
      title: 'Notificaciones',
      body: 'El indicador muestra cuántas novedades tenés sin leer. Hacé clic para verlas todas.',
      placement: 'bottom',
      align: 'end',
    },
  ],
};

export const TOURS: TourDefinition[] = [overviewTour];

export function getTour(tourId: string): TourDefinition | undefined {
  return TOURS.find((tour) => tour.id === tourId);
}
