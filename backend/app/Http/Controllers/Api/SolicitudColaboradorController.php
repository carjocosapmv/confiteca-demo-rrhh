<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\EmployeeRequest;
use App\Models\Notification;
use App\Models\User;
use App\Models\UserRole;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * Solicitudes genéricas del colaborador.
 *
 * Dos audiencias, un recurso:
 *
 *  - El colaborador crea y consulta LAS PROPIAS. El identificador del autor
 *    sale siempre de la sesión; ninguna ruta de esta clase acepta un `user_id`
 *    del cliente, ni siquiera para filtrar.
 *  - Talento Humano (rol admin o superadmin, el mismo criterio que ya aprueba
 *    permisos y vacaciones en PermisoVacacionController) ve la bandeja completa
 *    y resuelve.
 *
 * El módulo no tiene `moduleKey` propio a propósito: consultar lo propio no es
 * un permiso de módulo, es una consecuencia de estar autenticado.
 */
class SolicitudColaboradorController extends Controller
{
    private const RELACIONES = ['resolutor:id,display_name'];

    /** Bandeja del colaborador: siempre y únicamente sus propias solicitudes. */
    public function index(Request $request): JsonResponse
    {
        $solicitudes = EmployeeRequest::with(self::RELACIONES)
            ->where('user_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->get();

        return response()->json(['data' => $solicitudes]);
    }

    public function store(Request $request): JsonResponse
    {
        $validado = $request->validate([
            'tipo' => ['required', Rule::in(EmployeeRequest::TIPOS)],
            'descripcion' => ['required', 'string', 'min:10', 'max:1000'],
        ]);

        $solicitud = EmployeeRequest::create([
            // De la sesión, nunca del payload.
            'user_id' => $request->user()->id,
            'tipo' => $validado['tipo'],
            'descripcion' => $validado['descripcion'],
            'estado' => EmployeeRequest::ESTADO_PENDIENTE,
        ]);

        $this->notificarTalentoHumano($solicitud, $request->user());

        return response()->json(['data' => $solicitud->load(self::RELACIONES)], 201);
    }

    /** El autor ve la suya; Talento Humano ve cualquiera. Nadie más. */
    public function show(Request $request, EmployeeRequest $employeeRequest): JsonResponse
    {
        $this->asegurarLectura($request, $employeeRequest);

        return response()->json([
            'data' => $employeeRequest->load([...self::RELACIONES, 'user:id,display_name']),
        ]);
    }

    // ── Talento Humano ─────────────────────────────────────────────

    /** Bandeja completa. Filtro opcional por estado. */
    public function todas(Request $request): JsonResponse
    {
        $this->asegurarTalentoHumano($request);

        $request->validate([
            'estado' => ['nullable', Rule::in(EmployeeRequest::ESTADOS)],
            'tipo' => ['nullable', Rule::in(EmployeeRequest::TIPOS)],
        ]);

        $solicitudes = EmployeeRequest::with([...self::RELACIONES, 'user:id,display_name'])
            ->when($request->filled('estado'), fn ($q) => $q->where('estado', $request->string('estado')))
            ->when($request->filled('tipo'), fn ($q) => $q->where('tipo', $request->string('tipo')))
            ->orderByDesc('created_at')
            ->get();

        return response()->json([
            'data' => $solicitudes,
            'meta' => ['pendientes' => EmployeeRequest::where('estado', EmployeeRequest::ESTADO_PENDIENTE)->count()],
        ]);
    }

    public function aprobar(Request $request, EmployeeRequest $employeeRequest): JsonResponse
    {
        $this->asegurarTalentoHumano($request);

        $validado = $request->validate([
            'respuesta_rrhh' => ['nullable', 'string', 'max:1000'],
        ]);

        // Una transición inválida lanza TransicionSolicitudInvalida (409).
        $employeeRequest->marcarAprobada($request->user()->id, $validado['respuesta_rrhh'] ?? null);
        $employeeRequest->save();

        $this->notificarResolucion($employeeRequest, 'aprobada', 'success');

        return $this->respuestaResuelta($employeeRequest, 'Solicitud aprobada.');
    }

    public function rechazar(Request $request, EmployeeRequest $employeeRequest): JsonResponse
    {
        $this->asegurarTalentoHumano($request);

        // El motivo es obligatorio al rechazar: es la misma regla que ya rige
        // el rechazo de permisos y vacaciones.
        $validado = $request->validate([
            'respuesta_rrhh' => ['required', 'string', 'min:5', 'max:1000'],
        ]);

        $employeeRequest->marcarRechazada($request->user()->id, $validado['respuesta_rrhh']);
        $employeeRequest->save();

        $this->notificarResolucion($employeeRequest, 'rechazada', 'error');

        return $this->respuestaResuelta($employeeRequest, 'Solicitud rechazada.');
    }

    // ── Autorización ───────────────────────────────────────────────

    private function asegurarTalentoHumano(Request $request): void
    {
        abort_unless(
            $request->user()->isAdmin(),
            403,
            'Solo Talento Humano puede administrar las solicitudes del personal.'
        );
    }

    private function asegurarLectura(Request $request, EmployeeRequest $solicitud): void
    {
        $usuario = $request->user();

        abort_unless(
            $solicitud->esDe($usuario->id) || $usuario->isAdmin(),
            403,
            'Esta solicitud pertenece a otro colaborador.'
        );
    }

    // ── Notificaciones ─────────────────────────────────────────────

    private function respuestaResuelta(EmployeeRequest $solicitud, string $mensaje): JsonResponse
    {
        return response()->json([
            'message' => $mensaje,
            'data' => $solicitud->load([...self::RELACIONES, 'user:id,display_name']),
        ]);
    }

    private function notificarTalentoHumano(EmployeeRequest $solicitud, User $autor): void
    {
        $destinatarios = UserRole::whereIn('role', ['admin', 'superadmin'])
            ->pluck('user_id')
            ->unique();

        foreach ($destinatarios as $destinatario) {
            Notification::create([
                'user_id' => $destinatario,
                'title' => 'Nueva solicitud del personal',
                'message' => ($autor->display_name ?? 'Un colaborador')
                    .' envió una solicitud de tipo "'.self::etiquetaTipo($solicitud->tipo).'".',
                'type' => 'info',
                'reference_id' => $solicitud->id,
                'reference_type' => 'employee_request',
            ]);
        }
    }

    private function notificarResolucion(EmployeeRequest $solicitud, string $resultado, string $tipo): void
    {
        Notification::create([
            'user_id' => $solicitud->user_id,
            'title' => 'Solicitud '.$resultado,
            'message' => 'Tu solicitud de tipo "'.self::etiquetaTipo($solicitud->tipo).'" fue '.$resultado.'.'
                .($solicitud->respuesta_rrhh ? ' Respuesta: '.$solicitud->respuesta_rrhh : ''),
            'type' => $tipo,
            'reference_id' => $solicitud->id,
            'reference_type' => 'employee_request',
        ]);
    }

    private static function etiquetaTipo(string $tipo): string
    {
        return match ($tipo) {
            EmployeeRequest::TIPO_NOMINA => 'Consulta de nómina',
            EmployeeRequest::TIPO_CERTIFICADO => 'Certificado o documento',
            default => 'Otro',
        };
    }
}
