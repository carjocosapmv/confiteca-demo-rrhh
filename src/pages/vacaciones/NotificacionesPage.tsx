import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, CheckCheck } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { get, post } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

const REFERENCE_ROUTES: Record<string, string> = {
  leave_request: '/vacaciones/solicitudes',
  vacancy_request: '/vacantes',
  induction: '/induccion/th',
};

const NotificacionesPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      const res = await get<any[]>('/api/notifications', { user_id: user!.id, sort_by: 'created_at', sort_direction: 'desc' });
      return res.data || [];
    },
    enabled: !!user,
  });

  const markRead = useMutation({
    mutationFn: async (notificationId: string) => {
      await post(`/api/notifications/${notificationId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadNotifications'] });
    },
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      await post('/api/notifications/mark-all-read', { user_id: user!.id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadNotifications'] });
    },
  });

  const unreadCount = notifications.filter((n: any) => !n.read).length;

  const handleClick = (n: any) => {
    if (!n.read) markRead.mutate(n.id);
    const route = REFERENCE_ROUTES[n.reference_type];
    if (route) navigate(route);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notificaciones</h1>
          <p className="text-muted-foreground">{unreadCount} sin leer</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={() => markAllRead.mutate()}>
            <CheckCheck className="h-4 w-4 mr-1.5" /> Marcar todas como leídas
          </Button>
        )}
      </div>

      <div className="space-y-2">
        {notifications.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-3 opacity-50" />
              No tienes notificaciones.
            </CardContent>
          </Card>
        ) : (
          notifications.map((n: any) => (
            <Card key={n.id} className={cn('cursor-pointer transition-colors', !n.read && 'border-primary/30 bg-primary/5')}
              onClick={() => handleClick(n)}>
              <CardContent className="p-4 flex items-start gap-3">
                <div className={cn('mt-1 h-2 w-2 rounded-full shrink-0', !n.read ? 'bg-primary' : 'bg-transparent')} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{n.title}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">{n.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: es })}
                  </p>
                </div>
                <Badge variant="outline" className="shrink-0 text-[10px] capitalize">{n.type}</Badge>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificacionesPage;
