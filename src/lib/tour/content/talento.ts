import type { GuideSection } from './types';

/**
 * Three modules share this group (`vacantes`, `induccion`, `onboarding`), so a
 * user typically sees only part of the tour. Each topic carries its own
 * moduleKey rather than the group's, which is what makes that trimming correct.
 */
export const talentoSection: GuideSection = {
  id: 'talento',
  label: 'Talento',
  description: 'Vacantes, descriptivos de puesto e inducción de nuevos colaboradores.',
  topics: [
    {
      id: 'vacantes',
      title: 'Vacantes',
      summary: 'Las solicitudes de personal: qué puesto se necesita, por qué y en qué estado está.',
      details: [
        'Una vacante nace cuando un área necesita cubrir un puesto, sea por reemplazo o por creación. Desde aquí se solicita formalmente y queda registro del pedido, su justificación y su aprobación.',
        'Reemplaza el pedido informal por correo: el área solicitante carga la necesidad, Talento Humano la revisa y el estado de cada búsqueda queda visible para ambos.',
      ],
      anchor: 'nav:/vacantes',
      route: '/vacantes',
      moduleKey: 'vacantes',
      placement: 'right',
    },
    {
      id: 'descriptivos',
      title: 'Descriptivos',
      summary: 'La definición de cada puesto: responsabilidades, requisitos y competencias.',
      details: [
        'El descriptivo es el documento que define qué hace un puesto, qué se le exige y de quién depende. Es la base sobre la que se publica una vacante, se evalúa a un candidato y se mide el desempeño.',
        'Tenerlos centralizados y versionados evita el problema clásico de buscar un perfil con un documento desactualizado de hace años.',
      ],
      anchor: 'nav:/descriptivos',
      route: '/descriptivos',
      moduleKey: 'vacantes',
      placement: 'right',
    },
    {
      id: 'mi-induccion',
      title: 'Mi Inducción',
      summary: 'Tu plan de inducción personal: las actividades asignadas y su avance.',
      details: [
        'Es la vista del colaborador que está ingresando. Lista las actividades de inducción que le fueron asignadas, con su responsable y su estado de avance.',
        'Da respuesta a la pregunta más frecuente de una primera semana: qué tengo que hacer, con quién y hasta cuándo.',
      ],
      anchor: 'nav:/induccion',
      route: '/induccion',
      moduleKey: 'induccion',
      placement: 'right',
    },
    {
      id: 'facilitador',
      title: 'Facilitador',
      summary: 'La vista de quien dicta una actividad de inducción y confirma su cumplimiento.',
      details: [
        'Un facilitador es la persona responsable de dictar una actividad de inducción: una charla de seguridad, una capacitación de sistema o la presentación de un área.',
        'Desde esta pantalla ve las actividades a su cargo y marca cuáles ya cumplió cada ingresante, alimentando el avance que el colaborador ve en Mi Inducción.',
      ],
      anchor: 'nav:/induccion/facilitador',
      route: '/induccion/facilitador',
      moduleKey: 'induccion',
      placement: 'right',
    },
    {
      id: 'gestion-induccion',
      title: 'Gestión Inducción',
      summary: 'La administración del programa: plantillas de actividades y seguimiento global.',
      details: [
        'Es la vista de Talento Humano sobre el programa de inducción completo: qué actividades componen el plan, a quién se le asignan y cómo avanza cada ingresante.',
        'Permite detectar inducciones estancadas antes de que el período de prueba termine sin que la persona haya recibido lo que correspondía.',
      ],
      anchor: 'nav:/induccion/th',
      route: '/induccion/th',
      moduleKey: 'induccion',
      placement: 'right',
    },
    {
      id: 'induccion-videos',
      title: 'Inducción (videos)',
      summary: 'La ruta de videos de autoaprendizaje que cada ingresante completa a su ritmo.',
      details: [
        'Complementa la inducción presencial con contenido audiovisual: cultura de la empresa, políticas internas, seguridad e higiene.',
        'A diferencia de las actividades con facilitador, el colaborador los recorre cuando puede. El sistema registra el avance para que quede constancia de que el contenido fue visto.',
      ],
      anchor: 'nav:/onboarding',
      route: '/onboarding',
      moduleKey: 'onboarding',
      placement: 'right',
    },
    {
      id: 'gestion-videos',
      title: 'Gestión Videos',
      summary: 'La administración del contenido audiovisual y el avance de cada colaborador.',
      details: [
        'Desde aquí Talento Humano publica y ordena los videos de la ruta de inducción, y define cuáles son obligatorios.',
        'Muestra además el avance por colaborador, que es la evidencia que suele pedirse en auditorías de capacitación.',
      ],
      anchor: 'nav:/onboarding/rrhh',
      route: '/onboarding/rrhh',
      moduleKey: 'onboarding',
      placement: 'right',
    },
  ],
};
