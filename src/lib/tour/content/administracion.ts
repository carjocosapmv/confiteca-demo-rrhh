import type { GuideSection } from './types';

/**
 * Reserved for the superadmin profile: the seeded matrix denies
 * `admin_usuarios` and `admin_permisos` even to the `admin` role, so that an HR
 * administrator cannot grant privileges to itself.
 */
export const administracionSection: GuideSection = {
  id: 'administracion',
  label: 'Administración',
  description: 'Gestión de usuarios y permisos por rol del portal.',
  topics: [
    {
      id: 'usuarios',
      title: 'Usuarios',
      summary: 'El alta, baja y asignación de rol de las personas que acceden al portal.',
      details: [
        'Lista las cuentas habilitadas y permite crear nuevas, desactivar las de quienes dejaron la empresa y cambiar el rol asignado.',
        'El rol es lo que determina qué ve cada persona. Cambiarlo aquí tiene efecto inmediato sobre el menú y los permisos de esa cuenta.',
      ],
      anchor: 'nav:/admin/usuarios',
      route: '/admin/usuarios',
      moduleKey: 'admin_usuarios',
      placement: 'right',
    },
    {
      id: 'permisos',
      title: 'Permisos',
      summary: 'La matriz que define, por rol y por módulo, quién puede ver y quién puede editar.',
      details: [
        'Es una grilla de roles por módulos con dos casilleros por celda: ver y editar. Lo que se configura aquí es exactamente lo que el portal aplica, tanto en el menú lateral como en cada pantalla.',
        'Los permisos son por rol, no por persona: al modificar una fila, el cambio alcanza a todos los usuarios que tengan ese rol. Quitar el permiso de ver también quita el de editar, porque no se puede modificar lo que no se puede abrir.',
      ],
      anchor: 'nav:/admin/permisos',
      route: '/admin/permisos',
      moduleKey: 'admin_permisos',
      placement: 'right',
    },
    {
      // Guide-only: the role model behind every permission decision.
      id: 'roles',
      title: 'Los cuatro roles del portal',
      summary: 'Superadministrador, administrador, colaborador y consulta, en orden de alcance.',
      details: [
        'Superadministrador tiene acceso total, incluida esta sección de Administración. Administrador gestiona Talento Humano por completo pero no puede tocar usuarios ni permisos, justamente para que no pueda ampliarse el propio alcance.',
        'Colaborador es el rol de la persona que usa el portal para sus propios trámites: sus vacaciones, su inducción, sus documentos. Consulta es un perfil de solo lectura, pensado para quien necesita mirar indicadores sin intervenir en ningún circuito.',
      ],
      moduleKey: 'admin_usuarios',
    },
  ],
};
