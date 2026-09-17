import type { GuideSection } from './types';

/**
 * Deliberately short. The overview answers "where am I and how do I move
 * around", nothing else — the per-domain tours go deep. A single 20-step tour
 * is the fastest way to get every user to press Escape.
 */
export const overviewSection: GuideSection = {
  id: 'overview',
  label: 'Recorrido general',
  description: 'Conoce la navegación y las secciones principales del portal.',
  topics: [
    {
      id: 'bienvenida',
      title: 'Bienvenido al portal de Talento Humano',
      summary:
        'En un minuto te mostramos cómo moverte por el sistema. Puedes salir cuando quieras con la tecla Escape.',
      details: [
        'El portal de Talento Humano reúne en un solo lugar los trámites y la información que antes vivían repartidos entre correos, planillas y llamadas a Recursos Humanos.',
        'La pantalla se divide en dos zonas: el menú lateral izquierdo, que agrupa todas las secciones disponibles, y el área de trabajo a la derecha, donde se abre la sección que elijas.',
        'El menú lateral es el índice del portal y se puede contraer para dejar solo los íconos cuando necesitas pantalla completa, por ejemplo al revisar un calendario o una tabla ancha.',
        'Las secciones que ves en el menú dependen de tu rol. Si un compañero ve una opción que tú no tienes, es porque su perfil incluye permisos sobre ese módulo.',
      ],
      anchor: 'chrome:sidebar-trigger',
      placement: 'bottom',
      align: 'start',
    },
    {
      id: 'grupo-general',
      title: 'General',
      summary: 'Tu punto de partida: el dashboard con los indicadores del día y tus notificaciones.',
      details: [
        'El grupo General concentra la vista de arranque. El Dashboard resume los indicadores relevantes para tu rol y funciona como tablero de control diario.',
        'Notificaciones acumula los avisos del sistema: aprobaciones pendientes, cambios de estado en tus solicitudes y recordatorios de tareas asignadas.',
      ],
      anchor: 'navgroup:General',
      placement: 'right',
      moduleKey: 'dashboard',
    },
    {
      id: 'grupo-ausencias',
      title: 'Ausencias',
      summary: 'Solicita vacaciones, revisa el estado de tus pedidos y consulta el calendario del equipo.',
      details: [
        'Ausencias cubre el ciclo completo de vacaciones y permisos: pedir, aprobar y consultar.',
        'Todo colaborador usa este grupo. Los jefes y el equipo de Talento Humano suman además la vista de aprobación y el tablero de Recursos Humanos.',
      ],
      anchor: 'navgroup:Ausencias',
      placement: 'right',
      moduleKey: 'vacaciones',
    },
    {
      id: 'grupo-analitica',
      title: 'Analítica',
      summary: 'Indicadores de rotación para entender cómo evoluciona la plantilla.',
      details: [
        'Analítica agrupa los tableros de lectura: no se cargan datos acá, se interpretan.',
        'Hoy contiene Rotación, el análisis de salidas de personal. Está pensado para jefaturas y Talento Humano, que lo usan para anticipar riesgos de desvinculación.',
      ],
      anchor: 'navgroup:Analítica',
      placement: 'right',
      moduleKey: 'rotacion',
    },
    {
      id: 'grupo-talento',
      title: 'Talento',
      summary: 'Vacantes, descriptivos de puesto e inducción de nuevos colaboradores.',
      details: [
        'Talento acompaña el ingreso de una persona a la empresa: se abre una vacante, se define el descriptivo del puesto y, una vez contratada, se la induce.',
        'La inducción tiene dos formatos complementarios: un plan de actividades con facilitadores y una ruta de videos de autoaprendizaje.',
      ],
      anchor: 'navgroup:Talento',
      placement: 'right',
      // The step describes the whole group. Gated on `onboarding` because it is
      // the module every role that can see this group has access to; gating on
      // `vacantes` would hide the step from roles that do see the group.
      moduleKey: 'onboarding',
    },
    {
      id: 'grupo-administracion',
      title: 'Administración',
      summary: 'Gestión de usuarios y permisos por rol. Solo visible para perfiles administradores.',
      details: [
        'Administración es la consola del portal: define quién entra y qué puede ver cada rol.',
        'Está reservada al perfil superadministrador. Ni siquiera el rol de administrador de Recursos Humanos puede modificar permisos, para que nadie se otorgue privilegios a sí mismo.',
      ],
      anchor: 'navgroup:Administración',
      placement: 'right',
      moduleKey: 'admin_usuarios',
    },
    {
      id: 'notificaciones',
      title: 'Notificaciones',
      summary: 'El indicador muestra cuántas novedades tienes sin leer. Haz clic para verlas todas.',
      details: [
        'La campana del encabezado te acompaña en todas las pantallas y se actualiza sola cada pocos segundos.',
        'El número rojo cuenta los avisos sin leer. Al hacer clic se abre el listado completo, donde puedes marcarlos como leídos.',
      ],
      anchor: 'chrome:notifications',
      placement: 'bottom',
      align: 'end',
    },
    {
      id: 'ayuda',
      title: 'Ayuda y recorridos',
      summary:
        'Desde acá puedes repetir este recorrido cuando quieras o lanzar el de una sección puntual.',
      details: [
        'El botón de ayuda abre el menú de recorridos guiados. Lista solo los recorridos de las secciones a las que tienes acceso, así que lo que ves ahí es exactamente lo que puedes usar.',
        'La opción "Reiniciar recorridos" borra la marca de visto de todos los recorridos: útil si quieres volver a verlos desde cero o si acompañas a un compañero que recién ingresa.',
      ],
      anchor: 'chrome:help',
      placement: 'bottom',
      align: 'end',
    },
  ],
};
