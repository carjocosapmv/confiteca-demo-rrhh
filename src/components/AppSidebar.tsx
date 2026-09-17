import {
  LayoutDashboard, BarChart3, ShieldCheck, LogOut,
  CalendarDays, Plus, FileText, Bell, Settings, KeyRound,
  Users2, ClipboardCheck, UserPlus, Play, GraduationCap, UserCheck, Building2, TrendingDown, Calculator,
  Wallet, Inbox, MessageSquarePlus
} from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/contexts/PermissionsContext';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ClearCacheButton } from '@/components/ClearCacheButton';
import { useQuery } from '@tanstack/react-query';
import { get } from '@/lib/api-client';
import { BrandMark } from '@/components/BrandMark';

interface MenuItem {
  title: string;
  url: string;
  icon: typeof LayoutDashboard;
  moduleKey?: string;
}

const mainItems: MenuItem[] = [
  { title: 'Dashboard', url: '/', icon: LayoutDashboard, moduleKey: 'dashboard' },
  { title: 'Notificaciones', url: '/vacaciones/notificaciones', icon: Bell, moduleKey: 'vacaciones' },
];

const vacacionesItems: MenuItem[] = [
  { title: 'Inicio', url: '/vacaciones', icon: BarChart3, moduleKey: 'vacaciones' },
  { title: 'Nueva Solicitud', url: '/vacaciones/nueva', icon: Plus, moduleKey: 'vacaciones' },
  { title: 'Solicitudes', url: '/vacaciones/solicitudes', icon: FileText, moduleKey: 'vacaciones' },
  { title: 'Calendario', url: '/vacaciones/calendario', icon: CalendarDays, moduleKey: 'vacaciones' },
];

const vacacionesAdminItems: MenuItem[] = [
  { title: 'Dashboard RRHH', url: '/vacaciones/rrhh-dashboard', icon: BarChart3, moduleKey: 'vacaciones' },
];

const analiticaItems: MenuItem[] = [
  { title: 'Rotación', url: '/rotacion', icon: TrendingDown, moduleKey: 'rotacion' },
];

// Grupo propio y no dentro de Talento: expone salarios individuales, así que se
// separa visualmente del resto. El moduleKey `nomina` solo está habilitado para
// admin/superadmin, por lo que el grupo desaparece para los demás roles.
const nominaItems: MenuItem[] = [
  { title: 'Nómina', url: '/nomina', icon: Calculator, moduleKey: 'nomina' },
];

// Autoservicio: sin moduleKey a propósito. Estas pantallas solo muestran los
// datos de quien las abre, así que están disponibles para todo rol autenticado.
const autoservicioItems: MenuItem[] = [
  { title: 'Mi Nómina', url: '/mi-nomina', icon: Wallet },
  { title: 'Mis Solicitudes', url: '/mis-solicitudes', icon: MessageSquarePlus },
];

// Bandeja de Talento Humano para las solicitudes genéricas. Se muestra con el
// mismo criterio que la resuelve en el servidor: rol admin o superadmin.
const solicitudesAdminItems: MenuItem[] = [
  { title: 'Solicitudes del personal', url: '/solicitudes/rrhh', icon: Inbox },
];

const talentoItems: MenuItem[] = [
  { title: 'Vacantes', url: '/vacantes', icon: ClipboardCheck, moduleKey: 'vacantes' },
  { title: 'Descriptivos', url: '/descriptivos', icon: FileText, moduleKey: 'vacantes' },
  { title: 'Mi Inducción', url: '/induccion', icon: GraduationCap, moduleKey: 'induccion' },
  { title: 'Facilitador', url: '/induccion/facilitador', icon: UserCheck, moduleKey: 'induccion' },
  { title: 'Gestión Inducción', url: '/induccion/th', icon: Building2, moduleKey: 'induccion' },
  { title: 'Inducción (videos)', url: '/onboarding', icon: Play, moduleKey: 'onboarding' },
  { title: 'Gestión Videos', url: '/onboarding/rrhh', icon: Users2, moduleKey: 'onboarding' },
];

const adminItems: MenuItem[] = [
  { title: 'Usuarios', url: '/admin/usuarios', icon: ShieldCheck, moduleKey: 'admin_usuarios' },
  { title: 'Permisos', url: '/admin/permisos', icon: KeyRound, moduleKey: 'admin_permisos' },
];

function MenuGroup({ label, items, badgeCounts }: { label: string; items: MenuItem[]; badgeCounts?: Record<string, number> }) {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const { canView } = usePermissions();

  const visibleItems = items.filter(item => !item.moduleKey || canView(item.moduleKey));
  if (visibleItems.length === 0) return null;

  return (
    <SidebarGroup data-tour={`navgroup:${label}`}>
      <SidebarGroupLabel className="text-sidebar-muted text-[10px] tracking-[0.1em] uppercase font-semibold">
        {label}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {visibleItems.map((item) => {
            const isActive = location.pathname === item.url;
            const count = badgeCounts?.[item.title];
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild>
                  <NavLink
                    data-tour={`nav:${item.url}`}
                    to={item.url}
                    end
                    className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                      isActive
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                        : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
                    }`}
                    activeClassName=""
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    {!collapsed && <span className="flex-1">{item.title}</span>}
                    {!collapsed && count !== undefined && count > 0 && (
                      <Badge className="h-5 min-w-5 px-1.5 text-[10px] bg-primary text-primary-foreground">{count > 99 ? '99+' : count}</Badge>
                    )}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const { profile, signOut, role, isAdmin } = useAuth();
  const { canView } = usePermissions();

  const { data: unreadData } = useQuery({
    queryKey: ['unreadNotifications'],
    queryFn: async () => {
      const res = await get<any>('/api/notifications/unread-count');
      return res.data?.count ?? 0;
    },
    refetchInterval: 15_000,
  });
  const unreadCount = unreadData ?? 0;

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <div className="px-4 py-5 flex items-center gap-3">
        {collapsed ? (
          <BrandMark iconOnly />
        ) : (
          <div className="flex flex-col gap-0.5">
            <BrandMark invert tagline="Talento Humano" />
          </div>
        )}
      </div>
      <SidebarContent>
        <MenuGroup label="General" items={mainItems} badgeCounts={{ Notificaciones: unreadCount }} />
        <MenuGroup label="Autoservicio" items={autoservicioItems} />
        <MenuGroup label="Ausencias" items={vacacionesItems} />
        {(canView('vacaciones')) && <MenuGroup label="Ausencias Admin" items={vacacionesAdminItems} />}
        <MenuGroup label="Analítica" items={analiticaItems} />
        <MenuGroup label="Talento" items={talentoItems} />
        <MenuGroup label="Nómina" items={nominaItems} />
        {isAdmin && <MenuGroup label="Talento Humano" items={solicitudesAdminItems} />}
        <MenuGroup label="Administración" items={adminItems} />
      </SidebarContent>
      <div className="mt-auto p-4 border-t border-sidebar-border">
        {!collapsed && profile && (
          <div className="mb-2">
            <p className="text-xs font-medium text-sidebar-accent-foreground truncate">{profile.display_name || profile.email}</p>
            <p className="text-[10px] text-sidebar-muted capitalize">{role}</p>
          </div>
        )}
        <ClearCacheButton collapsed={collapsed} />
        <Button
          variant="ghost"
          size={collapsed ? 'icon' : 'sm'}
          className="w-full text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent/50 mt-1"
          onClick={signOut}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span className="ml-2">Cerrar Sesión</span>}
        </Button>
      </div>
    </Sidebar>
  );
}
