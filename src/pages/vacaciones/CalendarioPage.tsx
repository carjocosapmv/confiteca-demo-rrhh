import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { get } from '@/lib/api-client';
import {
  startOfMonth, endOfMonth, eachDayOfInterval, format, addMonths, subMonths,
  getDay, isToday, isWeekend,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const COLOR_MAP: Record<string, string> = {
  '#3B82F6': 'bg-blue-500',
  '#22C55E': 'bg-green-500',
  '#A855F7': 'bg-purple-500',
  '#F97316': 'bg-orange-500',
  '#6B7280': 'bg-gray-500',
};

const COLOR_LABELS: Record<string, string> = {
  '#3B82F6': 'Vacaciones',
  '#22C55E': 'Permiso médico',
  '#A855F7': 'Maternidad/Paternidad/Lactancia',
  '#F97316': 'Calamidad',
  '#6B7280': 'Otros',
};

const TIPO_COLOR: Record<string, string> = {
  vacacion: '#3B82F6',
  permiso_medico: '#22C55E',
  maternidad: '#A855F7',
  paternidad: '#A855F7',
  lactancia: '#A855F7',
  calamidad: '#F97316',
  permiso: '#6B7280',
  cursos: '#6B7280',
};

const CalendarioPage = () => {
  const { user } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const mesParam = format(currentMonth, 'yyyy-MM');

  const { data: calendarData } = useQuery({
    queryKey: ['calendario', mesParam],
    queryFn: async () => {
      const res = await get<any>('/api/permisos-vacaciones/calendario', { mes: mesParam });
      return res.data?.data || [];
    },
    enabled: !!user,
  });

  const days = useMemo(() => {
    return eachDayOfInterval({ start: monthStart, end: monthEnd });
  }, [monthStart, monthEnd]);

  const groupedByUser = useMemo(() => {
    const groups: Record<string, any[]> = {};
    if (!calendarData) return groups;
    for (const item of calendarData) {
      const name = item.colaborador || '—';
      if (!groups[name]) groups[name] = [];
      groups[name].push(item);
    }
    return groups;
  }, [calendarData]);

  const getAbsenceForDay = (colaborador: string, date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const items = groupedByUser[colaborador] || [];
    return items.find((a: any) =>
      a.start_date <= dateStr && a.end_date >= dateStr
    );
  };

  const getColor = (item: any) => {
    if (item.color) return item.color;
    return TIPO_COLOR[item.tipo] || '#6B7280';
  };

  const dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  const startDayOfWeek = getDay(monthStart);
  const paddingDays = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Calendario de Ausencias</h1>
        <p className="text-muted-foreground">Vista mensual de permisos y vacaciones del equipo</p>
      </div>

      <div className="flex items-center justify-between">
        <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-lg font-semibold capitalize">
          {format(currentMonth, 'MMMM yyyy', { locale: es })}
        </h2>
        <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex flex-wrap gap-4 text-xs">
        {Object.entries(COLOR_LABELS).map(([color, label]) => (
          <div key={color} className="flex items-center gap-1.5">
            <div className={cn('w-3 h-3 rounded', COLOR_MAP[color])} />
            <span>{label}</span>
          </div>
        ))}
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <div className="min-w-[800px]">
            <div className="grid grid-cols-[180px_repeat(31,1fr)] border-b">
              <div className="p-2 text-xs font-medium text-muted-foreground border-r bg-muted/50 sticky left-0">
                Colaborador
              </div>
              {days.map((day) => (
                <div
                  key={day.toISOString()}
                  className={cn(
                    'p-1 text-center text-[10px] font-medium border-r',
                    isWeekend(day) && 'bg-muted/30 text-muted-foreground',
                    isToday(day) && 'bg-primary/10 text-primary font-bold',
                  )}
                >
                  {format(day, 'd')}
                </div>
              ))}
            </div>

            {Object.keys(groupedByUser).length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">
                No hay ausencias registradas para este mes.
              </div>
            ) : (
              Object.entries(groupedByUser).map(([name]) => (
                <div key={name} className="grid grid-cols-[180px_repeat(31,1fr)] border-b last:border-b-0">
                  <div className="p-2 text-xs font-medium border-r bg-card sticky left-0 truncate">
                    {name}
                  </div>
                  {days.map((day) => {
                    const absence = getAbsenceForDay(name, day);
                    const color = absence ? getColor(absence) : null;
                    const isFirstDay = absence && absence.start_date === format(day, 'yyyy-MM-dd');
                    const isLastDay = absence && absence.end_date === format(day, 'yyyy-MM-dd');

                    return (
                      <div
                        key={day.toISOString()}
                        className={cn(
                          'p-1 border-r text-center relative',
                          isWeekend(day) && !absence && 'bg-muted/20',
                        )}
                      >
                        {absence && (
                          <div
                            className={cn(
                              'h-5 w-full rounded-sm',
                              COLOR_MAP[color!] || 'bg-gray-500',
                              isFirstDay && 'rounded-l-sm',
                              isLastDay && 'rounded-r-sm',
                            )}
                            title={`${name}: ${COLOR_LABELS[color!] || absence.tipo || 'Ausencia'}`}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CalendarioPage;
