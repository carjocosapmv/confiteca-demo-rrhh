<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LeaveRequest;
use App\Models\Notification;
use App\Models\VacationBalance;
use App\Models\User;
use App\Models\UserRelationship;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class PermisoVacacionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = LeaveRequest::with([
            'user', 'user.puesto', 'user.businessUnit',
            'aprobadoPorJefe', 'aprobadoPorTh', 'reviewer',
        ]);

        if ($request->filled('tipo')) {
            if ($request->tipo === 'permiso') {
                $query->where('request_type', 'permiso');
            } elseif ($request->tipo === 'vacacion') {
                $query->where('request_type', 'vacation');
            }
        }

        if ($request->filled('etapa')) {
            $query->where('etapa_aprobacion', $request->etapa);
        }

        if ($request->filled('area')) {
            $query->whereHas('user.businessUnit', fn($q) => $q->where('nombre', $request->area));
        }

        if ($request->filled('empresa')) {
            $query->whereHas('user.businessUnit', fn($q) => $q->where('codigo', $request->empresa));
        }

        if ($request->filled('colaborador_id')) {
            $query->where('user_id', $request->colaborador_id);
        }

        $isTH = $user->hasRole('superadmin') || $user->hasRole('admin');

        if (!$isTH) {
            $relationship = $user->relationships;
            $isJefe = $relationship && $relationship->supervisor_id;
            $isJefeDe = UserRelationship::where('supervisor_id', $user->id)->exists();

            if ($isJefeDe) {
                $teamIds = UserRelationship::where('supervisor_id', $user->id)->pluck('user_id');
                $query->where(function ($q) use ($user, $teamIds) {
                    $q->whereIn('user_id', $teamIds)
                      ->orWhere('user_id', $user->id);
                });
            } else {
                $query->where('user_id', $user->id);
            }
        }

        $sortBy = $request->input('sort_by', 'created_at');
        $sortDir = $request->input('sort_direction', 'desc');
        $perPage = $request->input('per_page', 20);

        $results = $query->orderBy($sortBy, $sortDir)->paginate($perPage);

        return response()->json($results);
    }

    public function storePermiso(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'tipo_permiso' => ['required', 'in:paternidad,maternidad,lactancia,permiso_medico,cursos_empresarial,calamidad'],
            'razon' => ['required', 'string', 'max:500'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
            'days_requested' => ['required', 'integer', 'min:1'],
            'attachment' => ['nullable', 'file', 'max:10240', 'mimes:pdf,jpg,jpeg,png'],
        ]);

        $attachmentPath = null;
        if ($request->hasFile('attachment')) {
            $attachmentPath = $request->file('attachment')->store('permisos', 'public');
        }

        $leaveRequest = LeaveRequest::create([
            'user_id' => $request->user()->id,
            'request_type' => 'permiso',
            'tipo_permiso' => $validated['tipo_permiso'],
            'razon' => $validated['razon'],
            'start_date' => $validated['start_date'],
            'end_date' => $validated['end_date'],
            'days_requested' => $validated['days_requested'],
            'days_charged' => $validated['days_requested'],
            'attachment_path' => $attachmentPath,
            'status' => 'pending',
            'etapa_aprobacion' => 'enviado',
        ]);

        $leaveRequest->load(['user', 'user.puesto', 'user.businessUnit']);

        $this->notificarJefeInmediato($leaveRequest);

        return response()->json(['data' => $leaveRequest], 201);
    }

    public function storeVacacion(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'dias_solicitados' => ['required', 'integer', 'min:1'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
            'fecha_reintegro' => ['required', 'date', 'after:end_date'],
            'razon' => ['required', 'string', 'max:500'],
            'saldo_disponible' => ['nullable', 'integer'],
        ]);

        $leaveRequest = LeaveRequest::create([
            'user_id' => $request->user()->id,
            'request_type' => 'vacation',
            'dias_solicitados' => $validated['dias_solicitados'],
            'days_requested' => $validated['dias_solicitados'],
            'days_charged' => $validated['dias_solicitados'],
            'start_date' => $validated['start_date'],
            'end_date' => $validated['end_date'],
            'fecha_reintegro' => $validated['fecha_reintegro'],
            'razon' => $validated['razon'],
            'saldo_vacaciones_disponible' => $validated['saldo_disponible'],
            'status' => 'pending',
            'etapa_aprobacion' => 'enviado',
        ]);

        $leaveRequest->load(['user', 'user.puesto', 'user.businessUnit']);

        $this->notificarJefeInmediato($leaveRequest);

        return response()->json(['data' => $leaveRequest], 201);
    }

    public function aprobarJefe(Request $request, LeaveRequest $leaveRequest): JsonResponse
    {
        $user = $request->user();

        if ($leaveRequest->etapa_aprobacion !== 'enviado') {
            return response()->json(['message' => 'Esta solicitud no está en etapa de aprobación de jefe'], 400);
        }

        $esJefe = UserRelationship::where('supervisor_id', $user->id)
            ->where('user_id', $leaveRequest->user_id)
            ->exists();

        if (!$esJefe && !$user->isAdmin() && !$user->isSuperAdmin()) {
            return response()->json(['message' => 'No eres el jefe inmediato de este colaborador'], 403);
        }

        $leaveRequest->update([
            'etapa_aprobacion' => 'aprobado_jefe',
            'aprobado_por_jefe_id' => $user->id,
            'aprobado_por_jefe_at' => now(),
            'status' => 'pending',
        ]);

        $this->notificarTH($leaveRequest, 'aprobado por jefe inmediato');

        return response()->json([
            'message' => 'Solicitud aprobada por jefe inmediato',
            'data' => $leaveRequest->load(['user', 'aprobadoPorJefe']),
        ]);
    }

    public function aprobarTH(Request $request, LeaveRequest $leaveRequest): JsonResponse
    {
        $user = $request->user();

        if ($leaveRequest->etapa_aprobacion !== 'aprobado_jefe') {
            return response()->json(['message' => 'Esta solicitud no ha sido aprobada por el jefe aún'], 400);
        }

        $leaveRequest->update([
            'etapa_aprobacion' => 'aprobado_th',
            'aprobado_por_th_id' => $user->id,
            'aprobado_por_th_at' => now(),
            'status' => 'approved',
        ]);

        $this->actualizarSaldo($leaveRequest);

        Notification::create([
            'user_id' => $leaveRequest->user_id,
            'title' => 'Solicitud aprobada',
            'message' => 'Tu solicitud ha sido aprobada por Talento Humano.',
            'type' => 'success',
            'reference_id' => $leaveRequest->id,
            'reference_type' => 'leave_request',
        ]);

        return response()->json([
            'message' => 'Solicitud aprobada por Talento Humano',
            'data' => $leaveRequest->load(['user', 'aprobadoPorJefe', 'aprobadoPorTh']),
        ]);
    }

    public function rechazar(Request $request, LeaveRequest $leaveRequest): JsonResponse
    {
        $validated = $request->validate([
            'nota_rechazo' => ['required', 'string', 'max:500'],
        ]);

        $user = $request->user();
        $esJefe = UserRelationship::where('supervisor_id', $user->id)
            ->where('user_id', $leaveRequest->user_id)
            ->exists();
        $esTH = $user->isAdmin() || $user->isSuperAdmin();

        if (!$esJefe && !$esTH) {
            return response()->json(['message' => 'No tienes permiso para rechazar esta solicitud'], 403);
        }

        $rechazadoPor = $esTH ? 'th' : 'jefe';

        $leaveRequest->update([
            'etapa_aprobacion' => 'rechazado',
            'status' => 'rejected',
            'nota_rechazo' => $validated['nota_rechazo'],
            'rechazado_por' => $rechazadoPor,
            'reviewed_by' => $user->id,
            'reviewed_at' => now(),
        ]);

        Notification::create([
            'user_id' => $leaveRequest->user_id,
            'title' => 'Solicitud rechazada',
            'message' => 'Tu solicitud fue rechazada. Motivo: ' . $validated['nota_rechazo'],
            'type' => 'error',
            'reference_id' => $leaveRequest->id,
            'reference_type' => 'leave_request',
        ]);

        return response()->json([
            'message' => 'Solicitud rechazada',
            'data' => $leaveRequest->load(['user', 'reviewer']),
        ]);
    }

    public function misSolicitudes(Request $request): JsonResponse
    {
        $user = $request->user();
        $requests = LeaveRequest::with(['user.puesto', 'user.businessUnit', 'aprobadoPorJefe', 'aprobadoPorTh'])
            ->where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        $historial = LeaveRequest::where('user_id', $user->id)
            ->whereIn('etapa_aprobacion', ['aprobado_th', 'rechazado'])
            ->orderBy('created_at', 'desc')
            ->take(10)
            ->get();

        return response()->json([
            'solicitudes' => $requests,
            'historial' => $historial,
        ]);
    }

    public function pendientesJefe(Request $request): JsonResponse
    {
        $user = $request->user();
        $teamIds = UserRelationship::where('supervisor_id', $user->id)->pluck('user_id');

        $pendientes = LeaveRequest::with(['user.puesto', 'user.businessUnit'])
            ->whereIn('user_id', $teamIds)
            ->where('etapa_aprobacion', 'enviado')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json(['data' => $pendientes]);
    }

    public function pendientesTH(Request $request): JsonResponse
    {
        $pendientes = LeaveRequest::with(['user.puesto', 'user.businessUnit', 'aprobadoPorJefe'])
            ->where('etapa_aprobacion', 'aprobado_jefe')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json(['data' => $pendientes]);
    }

    public function calendario(Request $request): JsonResponse
    {
        $request->validate(['mes' => ['required', 'date_format:Y-m']]);
        $mes = $request->input('mes');
        $anio = substr($mes, 0, 4);
        $mesNum = substr($mes, 5, 2);

        $ausencias = LeaveRequest::with(['user.puesto', 'user.businessUnit'])
            ->whereIn('etapa_aprobacion', ['aprobado_th', 'aprobado_jefe'])
            ->whereYear('start_date', $anio)
            ->whereMonth('start_date', $mesNum)
            ->orderBy('start_date')
            ->get()
            ->map(function ($item) {
                $color = match (true) {
                    $item->request_type === 'vacation' => '#3B82F6',
                    $item->tipo_permiso === 'permiso_medico' => '#22C55E',
                    in_array($item->tipo_permiso, ['maternidad', 'paternidad', 'lactancia']) => '#A855F7',
                    $item->tipo_permiso === 'calamidad' => '#F97316',
                    default => '#6B7280',
                };
                return [
                    'id' => $item->id,
                    'user_id' => $item->user_id,
                    'colaborador' => $item->user?->display_name ?? 'N/A',
                    'area' => $item->user?->businessUnit?->nombre ?? 'N/A',
                    'tipo' => $item->request_type === 'vacation' ? 'Vacaciones' : ($item->tipo_permiso ?? $item->request_type),
                    'start_date' => $item->start_date->format('Y-m-d'),
                    'end_date' => $item->end_date->format('Y-m-d'),
                    'color' => $color,
                    'etapa' => $item->etapa_aprobacion,
                ];
            });

        return response()->json(['data' => $ausencias]);
    }

    public function saldoMockeado(Request $request): JsonResponse
    {
        $saldos = [
            'total_days' => 15,
            'used_days' => random_int(0, 5),
            'available_days' => random_int(10, 15),
        ];

        $userId = $request->input('user_id', $request->user()?->id);
        $saldosPorColaborador = [
            '3' => ['total_days' => 15, 'used_days' => 3, 'available_days' => 12],
            '4' => ['total_days' => 15, 'used_days' => 12, 'available_days' => 3],
            '5' => ['total_days' => 15, 'used_days' => 0, 'available_days' => 20],
        ];

        return response()->json($saldosPorColaborador[$userId] ?? $saldos);
    }

    private function notificarJefeInmediato(LeaveRequest $leaveRequest): void
    {
        $relationship = UserRelationship::where('user_id', $leaveRequest->user_id)->first();
        if ($relationship && $relationship->supervisor_id) {
            Notification::create([
                'user_id' => $relationship->supervisor_id,
                'title' => 'Nueva solicitud pendiente',
                'message' => $leaveRequest->user?->display_name . ' ha enviado una solicitud de ' .
                    ($leaveRequest->request_type === 'vacation' ? 'vacaciones' : 'permiso') .
                    ' que requiere tu aprobación.',
                'type' => 'info',
                'reference_id' => $leaveRequest->id,
                'reference_type' => 'leave_request',
            ]);
        }
    }

    private function notificarTH(LeaveRequest $leaveRequest, string $mensaje): void
    {
        $ths = UserRelationship::whereNotNull('authorizer_id')->pluck('authorizer_id')->unique();
        foreach ($ths as $thId) {
            Notification::create([
                'user_id' => $thId,
                'title' => 'Solicitud pendiente de TH',
                'message' => $leaveRequest->user?->display_name . ' - ' . $mensaje,
                'type' => 'info',
                'reference_id' => $leaveRequest->id,
                'reference_type' => 'leave_request',
            ]);
        }
    }

    private function actualizarSaldo(LeaveRequest $leaveRequest): void
    {
        if ($leaveRequest->request_type !== 'vacation') return;

        $balance = VacationBalance::where('user_id', $leaveRequest->user_id)
            ->where('year', now()->year)
            ->first();

        if ($balance) {
            $balance->increment('used_days', $leaveRequest->days_charged);
        }
    }
}
