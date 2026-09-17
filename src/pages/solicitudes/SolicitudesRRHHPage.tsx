import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Clock, Inbox, ShieldAlert, XCircle } from 'lucide-react';
import { get, post } from '@/lib/api-client';
import {
  ApprovalBar, DataTable, DetailDrawer, ModulePage, StatCard,
  type DataTableColumn, type DataTableFilter, type DetailSection,
} from '@/components/module';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import type { Solicitud } from '@/types/solicitudes';
import {
  TIPOS_SOLICITUD, admiteResolucion, etiquetaEstado, etiquetaTipo, fechaCorta, varianteEstado,
} from './solicitudes-utils';

/**
 * Bandeja de solicitudes del personal para Talento Humano.
 *
 * Reutiliza el ApprovalBar del resto de flujos de aprobación: la regla de que
 * un rechazo exige motivo ya vive ahí y no se vuelve a escribir. La barra solo
 * aparece sobre solicitudes pendientes; el servidor devuelve 409 igual si dos
 * personas resuelven la misma a la vez.
 */
export default function SolicitudesRRHHPage() {
  const { toast } = useToast();
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [seleccionada, setSeleccionada] = useState<Solicitud | null>(null);

  const { data: solicitudes = [], isLoading } = useQuery({
    queryKey: ['solicitudes-rrhh'],
    queryFn: async () => {
      const response = await get<{ data: Solicitud[] }>('/api/solicitudes/todas');
      return response.data.data;
    },
    enabled: isAdmin,
  });

  const resolver = useMutation({
    mutationFn: async ({ id, accion, respuesta }: { id: string; accion: 'aprobar' | 'rechazar'; respuesta?: string }) => {
      await post(`/api/solicitudes/${id}/${accion}`, { respuesta_rrhh: respuesta });
    },
    onSuccess: async (_data, variables) => {
      setSeleccionada(null);
      toast({
        title: variables.accion === 'aprobar' ? 'Solicitud aprobada' : 'Solicitud rechazada',
        description: 'Se notificó al colaborador con tu respuesta.',
      });
      await queryClient.invalidateQueries({ queryKey: ['solicitudes-rrhh'] });
    },
    onError: (error: { message?: string }) => {
      toast({
        variant: 'destructive',
        title: 'No se pudo resolver la solicitud',
        description: error?.message ?? 'Vuelve a intentarlo en unos minutos.',
      });
    },
  });

  if (!isAdmin) {
    return (
      <ModulePage title="Solicitudes del personal">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldAlert className="size-4 text-destructive" />
              Acceso restringido
            </CardTitle>
            <CardDescription>
              Solo Talento Humano puede administrar las solicitudes del personal. Tus propias
              solicitudes están en "Mis Solicitudes".
            </CardDescription>
          </CardHeader>
        </Card>
      </ModulePage>
    );
  }

  const columnas: DataTableColumn<Solicitud>[] = [
    { key: 'created_at', header: 'Recibida', sortable: true, render: (row) => fechaCorta(row.created_at) },
    {
      key: 'colaborador',
      header: 'Colaborador',
      sortable: true,
      sortValue: (row) => row.user?.display_name ?? '',
      render: (row) => row.user?.display_name ?? 'Sin nombre',
    },
    { key: 'tipo', header: 'Tipo', sortable: true, render: (row) => etiquetaTipo(row.tipo) },
    {
      key: 'descripcion',
      header: 'Detalle',
      render: (row) => <span className="line-clamp-1 max-w-[320px]">{row.descripcion}</span>,
    },
    {
      key: 'estado',
      header: 'Estado',
      sortable: true,
      render: (row) => <Badge variant={varianteEstado(row.estado)}>{etiquetaEstado(row.estado)}</Badge>,
    },
  ];

  const filtros: DataTableFilter<Solicitud>[] = [
    {
      key: 'estado',
      label: 'Estado',
      options: ['pendiente', 'aprobado', 'rechazado'],
      accessor: (row) => row.estado,
    },
    {
      key: 'tipo',
      label: 'Tipo',
      options: TIPOS_SOLICITUD.map((opcion) => opcion.valor),
      accessor: (row) => row.tipo,
    },
  ];

  const pendientes = solicitudes.filter((s) => s.estado === 'pendiente').length;
  const aprobadas = solicitudes.filter((s) => s.estado === 'aprobado').length;
  const rechazadas = solicitudes.filter((s) => s.estado === 'rechazado').length;

  const secciones: DetailSection[] = seleccionada
    ? [
        {
          fields: [
            { label: 'Colaborador', value: seleccionada.user?.display_name ?? 'Sin nombre' },
            { label: 'Tipo', value: etiquetaTipo(seleccionada.tipo) },
            { label: 'Recibida', value: fechaCorta(seleccionada.created_at) },
            {
              label: 'Estado',
              value: (
                <Badge variant={varianteEstado(seleccionada.estado)}>
                  {etiquetaEstado(seleccionada.estado)}
                </Badge>
              ),
            },
            { label: 'Detalle', value: seleccionada.descripcion, wide: true },
          ],
        },
        ...(admiteResolucion(seleccionada.estado)
          ? []
          : [
              {
                title: 'Resolución',
                fields: [
                  { label: 'Resuelta por', value: seleccionada.resolutor?.display_name ?? '—' },
                  { label: 'Fecha', value: fechaCorta(seleccionada.resuelto_at) },
                  {
                    label: 'Respuesta enviada',
                    value: seleccionada.respuesta_rrhh ?? 'Sin comentario.',
                    wide: true,
                  },
                ],
              },
            ]),
      ]
    : [];

  return (
    <ModulePage
      title="Solicitudes del personal"
      description="Bandeja de consultas de nómina, certificados y pedidos generales enviados por los colaboradores."
      toolbar={
        <div className="grid gap-3 sm:grid-cols-4">
          <StatCard label="Total recibidas" value={solicitudes.length} icon={Inbox} />
          <StatCard label="Pendientes" value={pendientes} hint="Esperan tu resolución" icon={Clock} tone="warning" />
          <StatCard label="Aprobadas" value={aprobadas} icon={CheckCircle2} tone="positive" />
          <StatCard label="Rechazadas" value={rechazadas} icon={XCircle} />
        </div>
      }
    >
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Bandeja</CardTitle>
          <CardDescription>
            Selecciona una solicitud para leer el detalle y responder.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columnas}
            rows={solicitudes}
            rowKey={(row) => row.id}
            loading={isLoading}
            filters={filtros}
            searchAccessor={(row) => `${row.user?.display_name ?? ''} ${etiquetaTipo(row.tipo)} ${row.descripcion}`}
            searchPlaceholder="Buscar por colaborador o detalle..."
            onRowClick={setSeleccionada}
            emptyMessage="No hay solicitudes registradas."
          />
        </CardContent>
      </Card>

      <DetailDrawer
        open={seleccionada !== null}
        onOpenChange={(abierto) => !abierto && setSeleccionada(null)}
        title={seleccionada?.user?.display_name ?? ''}
        description={seleccionada ? etiquetaTipo(seleccionada.tipo) : ''}
        sections={secciones}
        footer={
          seleccionada && admiteResolucion(seleccionada.estado) ? (
            <ApprovalBar
              approveLabel="Aprobar"
              rejectLabel="Rechazar"
              noteOnApprove
              pending={resolver.isPending}
              onApprove={(nota) =>
                resolver.mutate({ id: seleccionada.id, accion: 'aprobar', respuesta: nota })
              }
              onReject={(nota) =>
                resolver.mutate({ id: seleccionada.id, accion: 'rechazar', respuesta: nota })
              }
            />
          ) : null
        }
      />
    </ModulePage>
  );
}
