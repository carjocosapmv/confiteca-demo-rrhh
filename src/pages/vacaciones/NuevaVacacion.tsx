import { useState, useMemo, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarDays, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { get } from '@/lib/api-client';
import api from '@/lib/api-client';
import { format, isWeekend, addDays, eachDayOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const NuevaVacacion = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [daysInput, setDaysInput] = useState('');
  const [razon, setRazon] = useState('');
  const isUpdating = useRef(false);

  const { data: userData } = useQuery({
    queryKey: ['me-profile-vac'],
    queryFn: async () => {
      const res = await get<any>('/api/me');
      return res.data.user;
    },
    enabled: !!user,
  });

  const { data: saldo } = useQuery({
    queryKey: ['permisos-saldo-vac', user?.id],
    queryFn: async () => {
      const res = await get<any>('/api/permisos-vacaciones/saldo', { user_id: user!.id });
      return res.data;
    },
    enabled: !!user,
  });

  const area = (profile as any)?.business_unit || userData?.business_unit || '—';
  const cargo = (profile as any)?.puesto || userData?.puesto || '—';
  const displayName = profile?.display_name || userData?.display_name || user?.email || '—';

  const availableDays = saldo?.available_days ?? 12;
  const totalDays = saldo?.total_days ?? 15;

  const handleDaysChange = (value: string) => {
    setDaysInput(value);
    const days = parseInt(value);
    if (startDate && !isNaN(days) && days > 0) {
      isUpdating.current = true;
      let businessDaysCounted = 0;
      let current = new Date(startDate);
      while (businessDaysCounted < days) {
        if (!isWeekend(current)) businessDaysCounted++;
        if (businessDaysCounted < days) current = addDays(current, 1);
      }
      setEndDate(current);
      setTimeout(() => { isUpdating.current = false; }, 0);
    }
  };

  const handleEndDateChange = (date: Date | undefined) => {
    setEndDate(date);
    if (startDate && date && !isUpdating.current) {
      const bd = eachDayOfInterval({ start: startDate, end: date }).filter((d) => !isWeekend(d)).length;
      setDaysInput(String(bd));
    }
  };

  const handleStartDateChange = (date: Date | undefined) => {
    setStartDate(date);
    if (date && endDate && date > endDate) {
      setEndDate(undefined);
      setDaysInput('');
      return;
    }
    if (date && endDate) {
      const bd = eachDayOfInterval({ start: date, end: endDate }).filter((d) => !isWeekend(d)).length;
      setDaysInput(String(bd));
    }
  };

  const fechaReintegro = useMemo(() => {
    if (!endDate) return null;
    let next = addDays(endDate, 1);
    while (isWeekend(next)) next = addDays(next, 1);
    return next;
  }, [endDate]);

  const daysNum = parseInt(daysInput);
  const hasEnoughDays = !isNaN(daysNum) ? daysNum <= availableDays : true;

  const createVacacion = useMutation({
    mutationFn: async () => {
      if (!startDate || !endDate) throw new Error('Selecciona las fechas');
      const payload: Record<string, any> = {
        dias_solicitados: parseInt(daysInput) || 0,
        start_date: format(startDate, 'yyyy-MM-dd'),
        end_date: format(endDate, 'yyyy-MM-dd'),
        fecha_reintegro: fechaReintegro ? format(fechaReintegro, 'yyyy-MM-dd') : null,
        razon,
        saldo_disponible: availableDays,
      };
      await api.post('/api/permisos-vacaciones/vacaciones', payload);
    },
    onSuccess: () => {
      toast({ title: 'Vacaciones solicitadas', description: 'Tu solicitud ha sido enviada para autorización.' });
      navigate('/vacaciones');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err.message || 'Error al solicitar vacaciones';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    },
  });

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Nueva Solicitud de Vacaciones</h1>
        <p className="text-muted-foreground">Formulario de solicitud de vacaciones</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Datos del colaborador</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Fecha de solicitud</Label>
            <p className="text-sm font-medium">{format(new Date(), 'dd/MM/yyyy', { locale: es })}</p>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Área</Label>
            <p className="text-sm font-medium">{area}</p>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Apellidos y Nombres</Label>
            <p className="text-sm font-medium">{displayName}</p>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Cargo</Label>
            <p className="text-sm font-medium">{cargo}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Detalles de las vacaciones</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>A partir del día</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn('w-full justify-start text-left', !startDate && 'text-muted-foreground')}>
                    <CalendarDays className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, 'PPP', { locale: es }) : 'Seleccionar fecha'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={handleStartDateChange}
                    disabled={(date) => date < new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Número de días solicitados</Label>
              <Input
                type="number"
                min="1"
                value={daysInput}
                onChange={(e) => handleDaysChange(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Hasta el día</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn('w-full justify-start text-left', !endDate && 'text-muted-foreground')}>
                    <CalendarDays className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, 'PPP', { locale: es }) : 'Seleccionar fecha'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={handleEndDateChange}
                    disabled={(date) => date < (startDate || new Date())}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Reintegrándose el día</Label>
              <div className={cn(
                'flex items-center h-10 px-3 rounded-md border bg-muted/30 text-sm',
                fechaReintegro ? 'font-medium' : 'text-muted-foreground',
              )}>
                {fechaReintegro ? format(fechaReintegro, 'PPP', { locale: es }) : '—'}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Especificar motivo</Label>
            <Textarea
              value={razon}
              onChange={(e) => setRazon(e.target.value)}
              placeholder="Motivo de la solicitud de vacaciones..."
              rows={3}
            />
          </div>

          <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <Info className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Saldo de vacaciones</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Disponibles:</span>
                <p className="font-bold text-lg">{availableDays}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Usados:</span>
                <p className="font-medium">{saldo?.used_days || 0}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Totales:</span>
                <p className="font-medium">{totalDays}</p>
              </div>
            </div>
            {!hasEnoughDays && daysInput && (
              <p className="text-sm text-destructive mt-1">
                No tienes suficientes días disponibles. Solicita hasta {availableDays} días.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Button
        className="w-full"
        size="lg"
        onClick={() => createVacacion.mutate()}
        disabled={
          createVacacion.isPending ||
          !startDate ||
          !endDate ||
          !daysInput ||
          isNaN(daysNum) ||
          daysNum < 1 ||
          !hasEnoughDays
        }
      >
        {createVacacion.isPending ? 'Enviando...' : 'Enviar solicitud de vacaciones'}
      </Button>
    </div>
  );
};

export default NuevaVacacion;
