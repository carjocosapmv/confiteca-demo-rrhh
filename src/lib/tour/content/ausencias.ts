import type { GuideSection } from './types';

/**
 * Every screen in this group is gated by the single `vacaciones` module, so the
 * whole tour appears or disappears together.
 */
export const ausenciasSection: GuideSection = {
  id: 'ausencias',
  label: 'Ausencias',
  description: 'Solicitudes de vacaciones, saldos, aprobaciones y calendario del equipo.',
  topics: [
    {
      id: 'inicio',
      title: 'Inicio de Ausencias',
      summary: 'El resumen de tu situación: saldo de días disponibles y solicitudes en curso.',
      details: [
        'Es la portada del módulo. Muestra cuántos días de vacaciones tienes disponibles, cuántos ya usaste y qué solicitudes siguen esperando respuesta.',
        'La usa todo colaborador antes de pedir vacaciones, para confirmar el saldo con el que cuenta y evitar pedidos que serían rechazados por falta de días.',
      ],
      anchor: 'nav:/vacaciones',
      route: '/vacaciones',
      moduleKey: 'vacaciones',
      placement: 'right',
    },
    {
      id: 'nueva-solicitud',
      title: 'Nueva Solicitud',
      summary: 'El formulario para pedir vacaciones o un permiso: eliges fechas, tipo y motivo.',
      details: [
        'Acá se origina todo el circuito. Seleccionas el rango de fechas, el tipo de ausencia y el motivo; el sistema calcula los días hábiles involucrados y valida que tengas saldo suficiente.',
        'Al enviarla, la solicitud queda en estado pendiente y se notifica automáticamente a quien debe aprobarla. No hace falta avisar por correo.',
      ],
      anchor: 'nav:/vacaciones/nueva',
      route: '/vacaciones/nueva',
      moduleKey: 'vacaciones',
      placement: 'right',
    },
    {
      id: 'solicitudes',
      title: 'Solicitudes',
      summary: 'El historial de pedidos con su estado: pendiente, aprobado o rechazado.',
      details: [
        'Lista todas las solicitudes con su estado actual y la trazabilidad de quién las revisó y cuándo.',
        'Para un colaborador es la vista de seguimiento de sus propios pedidos. Para una jefatura o para Talento Humano es además la bandeja de aprobación, donde se autoriza o se rechaza con un comentario.',
      ],
      anchor: 'nav:/vacaciones/solicitudes',
      route: '/vacaciones/solicitudes',
      moduleKey: 'vacaciones',
      placement: 'right',
    },
    {
      id: 'calendario',
      title: 'Calendario',
      summary: 'La vista mensual de ausencias del equipo, para no dejar un área sin cobertura.',
      details: [
        'Muestra en un calendario quién está ausente cada día, cruzando las solicitudes aprobadas de todo el equipo.',
        'Sirve para planificar: antes de aprobar unas vacaciones conviene mirar acá si ya hay otras personas del área fuera en esas mismas fechas.',
      ],
      anchor: 'nav:/vacaciones/calendario',
      route: '/vacaciones/calendario',
      moduleKey: 'vacaciones',
      placement: 'right',
    },
    {
      id: 'dashboard-rrhh',
      title: 'Dashboard RRHH',
      summary: 'El tablero agregado de ausencias: volumen de pedidos, aprobaciones y días acumulados.',
      details: [
        'Consolida la información de ausencias de toda la organización en indicadores: solicitudes por período, tiempos de respuesta y días de vacaciones acumulados sin usar.',
        'Es la vista de gestión de Talento Humano. Los días acumulados sin gozar son un pasivo para la empresa, y este tablero es el que permite detectarlos a tiempo.',
      ],
      anchor: 'nav:/vacaciones/rrhh-dashboard',
      route: '/vacaciones/rrhh-dashboard',
      moduleKey: 'vacaciones',
      placement: 'right',
    },
    {
      id: 'notificaciones',
      title: 'Notificaciones de ausencias',
      summary: 'Los avisos del circuito: cuando alguien pide, aprueba o rechaza una ausencia.',
      details: [
        'Cada cambio de estado de una solicitud genera una notificación para las personas involucradas.',
        'Revisarlas es la forma de enterarte de que tu pedido fue resuelto sin tener que entrar a consultarlo.',
      ],
      anchor: 'nav:/vacaciones/notificaciones',
      route: '/vacaciones/notificaciones',
      moduleKey: 'vacaciones',
      placement: 'right',
    },
    {
      // Guide-only: a policy concept, not a screen. The written guide explains
      // it; the tour has nothing to point at.
      id: 'saldos',
      title: 'Cómo se calculan los saldos',
      summary: 'Los días disponibles surgen de lo acumulado por antigüedad menos lo ya gozado o aprobado.',
      details: [
        'El saldo que ves no es un número cargado a mano: se calcula como los días que te corresponden por antigüedad, menos los días ya gozados y menos los que están comprometidos en solicitudes aprobadas a futuro.',
        'Por eso el saldo baja apenas se aprueba una solicitud, aunque las fechas todavía no hayan llegado. Si notas una diferencia con tu propio cálculo, lo habitual es que haya una solicitud aprobada pendiente de gozar.',
      ],
      moduleKey: 'vacaciones',
    },
  ],
};
