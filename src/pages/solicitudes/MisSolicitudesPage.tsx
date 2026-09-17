import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Clock, Send, XCircle } from 'lucide-react';
import { get, post } from '@/lib/api-client';
import {
  DataTable, DetailDrawer, ModulePage, StatCard,
  type DataTableColumn, type DetailSection,
} from '@/components/module';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import type { Solicitud, SolicitudTipo } from '@/types/solicitudes';
import {
  DESCRIPCION_MAXIMA, DESCRIPCION_MINIMA, TIPOS_SOLICITUD,
  descripcionValida, etiquetaEstado, etiquetaTipo, fechaCorta, varianteEstado,
} from './solicitudes-utils';

/**
 * Mis Solicitudes — el canal genérico del colaborador hacia Talento Humano.
 *
 * Existe para que un pedido nuevo (una duda sobre el rol de pago, un
 * certificado laboral) no requiera construir un módulo entero. El listado sale
 * de `/api/solicitudes`, que devuelve siempre y solo las propias: no hay filtro
 * por persona porque no hay nada que filtrar.
 */
export default function MisSolicitudesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [tipo, setTipo] = useState<SolicitudTipo | ''>('');
  const [descripcion, setDescripcion] = useState('');
  const [seleccionada, setSeleccionada] = useState<Solicitud | null>(null);

  const { data: solicitudes = [], isLoading } = useQuery({
    queryKey: ['mis-solicitudes'],
    queryFn: async () => {
      const response = await get<{ data: Solicitud[] }>('/api/solicitudes');
      return response.data.data;
    },
  });

  const crear = useMutation({
    mutationFn: async () => {
      await post('/api/solicitudes', { tipo, descripcion: descripcion.trim() });
    },
    onSuccess: async () => {
      setTipo('');
      setDescripcion('');
      toast({
        title: 'Solicitud enviada',
        description: 'Talento Humano recibió tu solicitud y responderá por este mismo canal.',
      });
      await queryClient.invalidateQueries({ queryKey: ['mis-solicitudes'] });
    },
    onError: (error: { message?: string }) => {
      toast({
        variant: 'destructive',
        title: 'No se pudo enviar la solicitud',
        description: error?.message ?? 'Vuelve a intentarlo en unos minutos.',
      });
    },
  });

  const textoLimpio = descripcion.trim();
  const puedeEnviar = tipo !== '' && descripcionValida(descripcion) && !crear.isPending;
  const ayudaTipo = TIPOS_SOLICITUD.find((opcion) => opcion.valor === tipo)?.ayuda;

  const columnas: DataTableColumn<Solicitud>[] = [
    { key: 'created_at', header: 'Enviada', sortable: true, render: (row) => fechaCorta(row.created_at) },
    { key: 'tipo', header: 'Tipo', sortable: true, render: (row) => etiquetaTipo(row.tipo) },
    {
      key: 'descripcion',
      header: 'Detalle',
      render: (row) => <span className="line-clamp-1 max-w-[380px]">{row.descripcion}</span>,
    },
    {
      key: 'estado',
      header: 'Estado',
      sortable: true,
      render: (row) => <Badge variant={varianteEstado(row.estado)}>{etiquetaEstado(row.estado)}</Badge>,
    },
    {
      key: 'resuelto_at',
      header: 'Resuelta',
      sortable: true,
      render: (row) => fechaCorta(row.resuelto_at),
    },
  ];

  const pendientes = solicitudes.filter((s) => s.estado === 'pendiente').length;
  const aprobadas = solicitudes.filter((s) => s.estado === 'aprobado').length;
  const rechazadas = solicitudes.filter((s) => s.estado === 'rechazado').length;

  const secciones: DetailSection[] = seleccionada
    ? [
        {
          fields: [
            { label: 'Tipo', value: etiquetaTipo(seleccionada.tipo) },
            {
              label: 'Estado',
              value: (
                <Badge variant={varianteEstado(seleccionada.estado)}>
                  {etiquetaEstado(seleccionada.estado)}
                </Badge>
              ),
            },
            { label: 'Enviada', value: fechaCorta(seleccionada.created_at) },
            { label: 'Resuelta', value: fechaCorta(seleccionada.resuelto_at) },
            { label: 'Tu detalle', value: seleccionada.descripcion, wide: true },
          ],
        },
        {
          title: 'Respuesta de Talento Humano',
          fields: [
            {
              label: seleccionada.resolutor?.display_name ?? 'Sin responder todavía',
              value: seleccionada.respuesta_rrhh ?? 'Tu solicitud sigue pendiente de revisión.',
              wide: true,
            },
          ],
        },
      ]
    : [];

  return (
    <ModulePage
      title="Mis Solicitudes"
      description="Canal directo con Talento Humano para consultas de nómina, certificados y cualquier otro pedido."
      toolbar={
        <div className="grid gap-3 sm:grid-cols-3">
          <StatCard label="Pendientes" value={pendientes} hint="En revisión de Talento Humano" icon={Clock} />
          <StatCard label="Aprobadas" value={aprobadas} icon={CheckCircle2} tone="positive" />
          <StatCard label="Rechazadas" value={rechazadas} icon={XCircle} tone="warning" />
        </div>
      }
    >
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Nueva solicitud</CardTitle>
          <CardDescription>
            Describe tu pedido con el mayor detalle posible. Recibirás la respuesta en esta misma
            pantalla y como notificación.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2 sm:max-w-sm">
            <Label htmlFor="solicitud-tipo">Tipo de solicitud</Label>
            <Select value={tipo} onValueChange={(valor) => setTipo(valor as SolicitudTipo)}>
              <SelectTrigger id="solicitud-tipo">
                <SelectValue placeholder="Selecciona un tipo" />
              </SelectTrigger>
              <SelectContent>
                {TIPOS_SOLICITUD.map((opcion) => (
                  <SelectItem key={opcion.valor} value={opcion.valor}>
                    {opcion.etiqueta}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {ayudaTipo ? <p className="text-xs text-muted-foreground">{ayudaTipo}</p> : null}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="solicitud-descripcion">Detalle</Label>
            <Textarea
              id="solicitud-descripcion"
              rows={4}
              value={descripcion}
              maxLength={DESCRIPCION_MAXIMA}
              onChange={(evento) => setDescripcion(evento.target.value)}
              placeholder="Ejemplo: en el período de marzo no aparece la comisión por cobranza."
            />
            <p className="text-xs text-muted-foreground">
              {textoLimpio.length < DESCRIPCION_MINIMA
                ? `Escribe al menos ${DESCRIPCION_MINIMA} caracteres.`
                : `${textoLimpio.length} de ${DESCRIPCION_MAXIMA} caracteres.`}
            </p>
          </div>

          <Button disabled={!puedeEnviar} onClick={() => crear.mutate()}>
            <Send className="mr-2 size-4" />
            {crear.isPending ? 'Enviando...' : 'Enviar solicitud'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Historial</CardTitle>
          <CardDescription>Selecciona una fila para ver la respuesta completa.</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columnas}
            rows={solicitudes}
            rowKey={(row) => row.id}
            loading={isLoading}
            searchAccessor={(row) => `${etiquetaTipo(row.tipo)} ${row.descripcion}`}
            searchPlaceholder="Buscar en tus solicitudes..."
            onRowClick={setSeleccionada}
            emptyMessage="Todavía no has enviado ninguna solicitud."
          />
        </CardContent>
      </Card>

      <DetailDrawer
        open={seleccionada !== null}
        onOpenChange={(abierto) => !abierto && setSeleccionada(null)}
        title={seleccionada ? etiquetaTipo(seleccionada.tipo) : ''}
        description={seleccionada ? `Enviada el ${fechaCorta(seleccionada.created_at)}` : ''}
        sections={secciones}
      />
    </ModulePage>
  );
}
