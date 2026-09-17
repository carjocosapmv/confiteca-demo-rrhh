import type { GuideSection } from './types';

/**
 * Rotación has a single nav entry today. The in-page anchors (KPI cards, tabs
 * of the dashboard) land with the scaffold migration, so for now the tour stays
 * at navigation level and the depth lives in the guide prose.
 */
export const rotacionSection: GuideSection = {
  id: 'rotacion',
  label: 'Rotación',
  description: 'Análisis de salidas de personal, causas y riesgo de desvinculación.',
  topics: [
    {
      id: 'grupo-analitica',
      title: 'Analítica',
      summary: 'El grupo que reúne los tableros de lectura y análisis de la plantilla.',
      details: [
        'Analítica no es un módulo de carga: acá no se ingresan datos, se interpretan los que el resto del portal ya generó.',
        'Su público son las jefaturas y el equipo de Talento Humano, que lo usan para tomar decisiones sobre la plantilla con evidencia en lugar de percepción.',
      ],
      anchor: 'navgroup:Analítica',
      moduleKey: 'rotacion',
      placement: 'right',
    },
    {
      id: 'dashboard',
      title: 'Dashboard de Rotación',
      summary: 'La tasa de rotación, su evolución, los motivos de salida y el personal en riesgo.',
      details: [
        'El tablero responde cuatro preguntas. Cuánta gente se va: la tasa de rotación de los últimos doce meses y su costo estimado. Cómo evoluciona: la tendencia mes a mes. Dónde se va: el corte por área, cargo o jefatura, para ubicar los focos. Y por qué se va: la distribución de motivos de salida.',
        'Suma además un listado de riesgo, que estima qué colaboradores tienen mayor probabilidad de desvincularse. Combina señales como horas extra sostenidas, antigüedad y la rotación histórica del equipo al que pertenecen.',
        'Se lee de arriba hacia abajo: primero el número general, después el corte que explica dónde está concentrado, y recién ahí el listado de personas sobre el que conviene actuar.',
      ],
      anchor: 'nav:/rotacion',
      route: '/rotacion',
      moduleKey: 'rotacion',
      placement: 'right',
    },
    {
      // Guide-only: how to read the number, not where to click.
      id: 'como-leer-la-tasa',
      title: 'Cómo leer la tasa de rotación',
      summary: 'Es el porcentaje de salidas sobre el headcount promedio del período, no sobre el actual.',
      details: [
        'La tasa divide la cantidad de bajas del período por el headcount promedio de ese mismo período. Usar el promedio y no la dotación de hoy evita que una contratación masiva reciente maquille el indicador.',
        'Un valor alto no es malo por sí solo: hay que mirarlo contra el corte por área y por motivo. Rotación concentrada en un área con salidas voluntarias señala un problema de gestión; rotación distribuida por fin de contrato puede ser simplemente la estacionalidad del negocio.',
      ],
      moduleKey: 'rotacion',
    },
  ],
};
