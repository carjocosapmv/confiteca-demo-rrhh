import { Outlet, useNavigate } from 'react-router-dom';
import { AppSidebar } from '@/components/AppSidebar';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { get } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';

export default function AppLayout() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: unreadData } = useQuery({
    queryKey: ['unreadNotifications'],
    queryFn: async () => {
      const res = await get<any>('/api/notifications/unread-count');
      return res.data?.count ?? 0;
    },
    refetchInterval: 15_000,
    enabled: !!user,
  });
  const unreadCount = unreadData ?? 0;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full relative">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center justify-between border-b border-border px-4 bg-card">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
            <Button variant="ghost" size="icon" className="relative" onClick={() => navigate('/vacaciones/notificaciones')}>
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-4 min-w-4 px-1 text-[9px] bg-primary text-primary-foreground rounded-full">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Badge>
              )}
            </Button>
          </header>
          <main className="flex-1 p-6 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
