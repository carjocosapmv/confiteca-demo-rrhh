import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarDays, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { get, post } from '@/lib/api-client';
import { format, isWeekend, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import api from '@/lib/api-client';

const TIPO_PERMISO_OPTIONS = [
  { value: 'paternidad', label: 'Paternidad' },
  { value: 'maternidad', label: 'Maternidad' },
  { value: 'lactancia', label: 'Lactancia' },
  { value: 'permiso_medico', label: 'Permiso Médico' },
  { value: 'cursos', label: 'Cursos o Motivo Empresarial' },
  { value: 'calamidad', label: 'Calamidad Doméstica' },
];

const NuevoPermiso = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [tipoPermiso, setTipoPermiso] = useState('');
  const [razon, setRazon] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();

  const { data: userData } = useQuery({
    queryKey: ['me-profile'],
    queryFn: async () => {
      const res = await get<any>('/api/me');
      return res.data.user;
    },
    enabled: !!user,
  });

  const area = (profile as any)?.business_unit || userData?.business_unit || '—';
  const cargo = (profile as any)?.puesto || userData?.puesto || '—';
  const displayName = profile?.display_name || userData?.display_name || user?.email || '—';

  const daysRequested = useMemo(() => {
    if (!startDate || !endDate) return 0;
    let count = 0;
    let current = new Date(startDate);
    while (current <= endDate) {
      if (!isWeekend(current)) count++;
      current = addDays(current, 1);
    }
    return count;
  }, [startDate, endDate]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const createPermiso = useMutation({
    mutationFn: async () => {
      if (!startDate || !endDate) throw new Error('Selecciona las fechas');
      if (!tipoPermiso) throw new Error('Selecciona el tipo de licencia');

      const formData = new FormData();
      formData.append('tipo_permiso', tipoPermiso);
      formData.append('razon', razon);
      formData.append('start_date', format(startDate, 'yyyy-MM-dd'));
      formData.append('end_date', format(endDate, 'yyyy-MM-dd'));
      formData.append('days_requested', String(daysRequested));
      if (file) formData.append('attachment', file);

      await api.post('/api/permisos-vacaciones/permisos', formData);
    },
    onSuccess: () => {
      toast({ title: 'Permiso creado', description: 'Tu solicitud ha sido enviada para autorización.' });
      navigate('/vacaciones');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err.message || 'Error al crear el permiso';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    },
  });

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Nuevo Permiso</h1>
        <p className="text-muted-foreground">Formulario de solicitud de licencia</p>
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
          <CardTitle className="text-base">Detalles del permiso</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Tipo de licencia</Label>
            <Select value={tipoPermiso} onValueChange={setTipoPermiso}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar tipo de licencia" />
              </SelectTrigger>
              <SelectContent>
                {TIPO_PERMISO_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Especificar razón de licencia</Label>
            <Textarea
              value={razon}
              onChange={(e) => setRazon(e.target.value)}
              placeholder="Describir el motivo de la solicitud..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Adjuntar documento de respaldo</Label>
            <div className="flex items-center gap-3">
              <Input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                className="flex-1"
              />
              {file && (
                <span className="text-sm text-muted-foreground truncate max-w-[150px]">
                  {file.name}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">Formatos aceptados: PDF, JPG, PNG</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Fecha desde</Label>
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
                    onSelect={(d) => {
                      setStartDate(d);
                      if (d && endDate && d > endDate) setEndDate(undefined);
                    }}
                    disabled={(date) => date < new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Fecha hasta</Label>
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
                    onSelect={setEndDate}
                    disabled={(date) => date < (startDate || new Date())}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {startDate && endDate && (
            <div className="rounded-lg border bg-muted/30 p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Días solicitados:</span>
                <span className="font-medium">{daysRequested} día(s)</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Button
        className="w-full"
        size="lg"
        onClick={() => createPermiso.mutate()}
        disabled={createPermiso.isPending || !tipoPermiso || !startDate || !endDate}
      >
        {createPermiso.isPending ? 'Enviando...' : 'Enviar solicitud de permiso'}
      </Button>
    </div>
  );
};

export default NuevoPermiso;
