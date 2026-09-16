<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use App\Models\VacancyRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RequisicionPersonalController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = VacancyRequest::with([
            'user', 'user.puesto', 'user.businessUnit',
            'aprobadoPorGerente', 'aprobadoPorTH',
            'recibidoSeleccion', 'revisionFinal', 'reviewer',
        ]);

        if (!$user->isSuperAdmin() && !$user->isAdmin()) {
            $query->where('user_id', $user->id);
        }

        foreach (['empresa', 'area_solicitante', 'grupo_ocupacional', 'status', 'etapa_aprobacion'] as $filter) {
            if ($request->filled($filter)) {
                $query->where($filter, $request->input($filter));
            }
        }

        $sortBy = $request->input('sort_by', 'created_at');
        $sortDir = $request->input('sort_direction', 'desc');
        $query->orderBy($sortBy, $sortDir);

        return response()->json($query->paginate($request->input('per_page', 20)));
    }

    public function store(Request $request): JsonResponse
    {
        $rules = $this->storeRules();
        $validated = $request->validate($rules);

        if (isset($validated['experiencia_sectores'])) {
            $validated['experiencia_sectores'] = $validated['experiencia_sectores'];
        }

        $validated['user_id'] = $request->user()->id;
        $validated['remuneracion_total'] = ($validated['remuneracion_base'] ?? 0) + ($validated['remuneracion_variable'] ?? 0);
        $validated['status'] = 'pendiente';
        $validated['etapa_aprobacion'] = 'borrador';

        if ($validated['tipo_contratacion'] === 'reemplazo' && empty($validated['motivo_salida'])) {
            $validated['motivo_salida'] = 'No especificado';
        }

        if (isset($validated['candidato_interno']) && $validated['candidato_interno']) {
            $validated['candidato_interno'] = true;
        } else {
            $validated['candidato_interno'] = false;
        }

        $requisicion = VacancyRequest::create($validated);
        $requisicion->load(['user', 'user.puesto', 'user.businessUnit']);

        return response()->json(['data' => $requisicion], 201);
    }

    public function show(string $id): JsonResponse
    {
        $requisicion = VacancyRequest::with([
            'user.puesto', 'user.businessUnit',
            'aprobadoPorGerente', 'aprobadoPorTH',
            'recibidoSeleccion', 'revisionFinal', 'reviewer',
        ])->findOrFail($id);

        return response()->json(['data' => $requisicion]);
    }

    public function enviar(Request $request, VacancyRequest $vacancyRequest): JsonResponse
    {
        if ($vacancyRequest->etapa_aprobacion !== 'borrador') {
            return response()->json(['message' => 'Solo se pueden enviar solicitudes en borrador'], 400);
        }

        $vacancyRequest->update([
            'etapa_aprobacion' => 'en_revision',
            'status' => 'pendiente',
        ]);

        $this->notificarGerenteArea($vacancyRequest);

        return response()->json(['message' => 'Solicitud enviada a revisión', 'data' => $vacancyRequest->fresh()->loadMissing(['user', 'user.puesto', 'user.businessUnit'])]);
    }

    public function aprobarGerente(Request $request, VacancyRequest $vacancyRequest): JsonResponse
    {
        if ($vacancyRequest->etapa_aprobacion !== 'en_revision') {
            return response()->json(['message' => 'Etapa incorrecta'], 400);
        }

        $validated = $request->validate(['nota' => ['nullable', 'string', 'max:500']]);

        $vacancyRequest->update([
            'etapa_aprobacion' => 'aprobado_gerente',
            'aprobado_por_gerente_id' => $request->user()->id,
            'aprobado_por_gerente_at' => now(),
            'nota_gerente' => $validated['nota'] ?? null,
        ]);

        $this->notificarTH($vacancyRequest, 'aprobado por gerente de área');

        return response()->json(['message' => 'Aprobado por Gerente de Área', 'data' => $vacancyRequest->fresh()->loadMissing(['aprobadoPorGerente'])]);
    }

    public function aprobarTH(Request $request, VacancyRequest $vacancyRequest): JsonResponse
    {
        if ($vacancyRequest->etapa_aprobacion !== 'aprobado_gerente') {
            return response()->json(['message' => 'Etapa incorrecta'], 400);
        }

        $validated = $request->validate(['nota' => ['nullable', 'string', 'max:500']]);

        $vacancyRequest->update([
            'etapa_aprobacion' => 'aprobado_th',
            'aprobado_por_th_id' => $request->user()->id,
            'aprobado_por_th_at' => now(),
            'nota_th' => $validated['nota'] ?? null,
        ]);

        $this->notificarSeleccion($vacancyRequest);

        return response()->json(['message' => 'Aprobado por Talento Humano', 'data' => $vacancyRequest->fresh()->loadMissing(['aprobadoPorTH'])]);
    }

    public function recibirSeleccion(Request $request, VacancyRequest $vacancyRequest): JsonResponse
    {
        if ($vacancyRequest->etapa_aprobacion !== 'aprobado_th') {
            return response()->json(['message' => 'Etapa incorrecta'], 400);
        }

        $validated = $request->validate(['nota' => ['nullable', 'string', 'max:500']]);

        $vacancyRequest->update([
            'etapa_aprobacion' => 'en_seleccion',
            'recibido_seleccion_id' => $request->user()->id,
            'recibido_seleccion_at' => now(),
            'nota_seleccion' => $validated['nota'] ?? null,
            'status' => 'en_proceso',
        ]);

        return response()->json(['message' => 'Recibido por Selección/Reclutamiento', 'data' => $vacancyRequest->fresh()->loadMissing(['recibidoSeleccion'])]);
    }

    public function revisionFinal(Request $request, VacancyRequest $vacancyRequest): JsonResponse
    {
        if ($vacancyRequest->etapa_aprobacion !== 'en_seleccion') {
            return response()->json(['message' => 'Etapa incorrecta'], 400);
        }

        $validated = $request->validate(['nota' => ['nullable', 'string', 'max:500']]);

        $vacancyRequest->update([
            'etapa_aprobacion' => 'aprobado',
            'revision_final_id' => $request->user()->id,
            'revision_final_at' => now(),
            'nota_revision_final' => $validated['nota'] ?? null,
            'status' => 'aprobada',
        ]);

        Notification::create([
            'user_id' => $vacancyRequest->user_id,
            'title' => 'Requisición aprobada',
            'message' => 'Tu requisición de ' . $vacancyRequest->cargo_requerimiento . ' ha sido aprobada completamente.',
            'type' => 'success',
            'reference_id' => $vacancyRequest->id,
            'reference_type' => 'vacancy_request',
        ]);

        return response()->json(['message' => 'Revisión final completada', 'data' => $vacancyRequest->fresh()->loadMissing(['revisionFinal'])]);
    }

    public function rechazar(Request $request, VacancyRequest $vacancyRequest): JsonResponse
    {
        $validated = $request->validate([
            'nota_rechazo' => ['required', 'string', 'max:500'],
            'etapa_origen' => ['required', 'string', 'in:en_revision,aprobado_gerente,aprobado_th,en_seleccion'],
        ]);

        $vacancyRequest->update([
            'etapa_aprobacion' => 'rechazado',
            'status' => 'rechazada',
            'nota_revision' => $validated['nota_rechazo'],
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
        ]);

        Notification::create([
            'user_id' => $vacancyRequest->user_id,
            'title' => 'Requisición rechazada',
            'message' => 'Tu requisición de ' . $vacancyRequest->cargo_requerimiento . ' fue rechazada. Motivo: ' . $validated['nota_rechazo'],
            'type' => 'error',
            'reference_id' => $vacancyRequest->id,
            'reference_type' => 'vacancy_request',
        ]);

        return response()->json(['message' => 'Solicitud rechazada', 'data' => $vacancyRequest->fresh()]);
    }

    public function destroy(string $id): JsonResponse
    {
        $model = VacancyRequest::findOrFail($id);
        $model->delete();
        return response()->json(['message' => 'Eliminado']);
    }

    private function storeRules(): array
    {
        return [
            'fecha_requerimiento' => 'required|date',
            'cargo_solicitante' => 'required|string|max:255',
            'area_solicitante' => 'required|string|max:255',
            'cargo_reporta' => 'required|string|max:255',
            'cargo_requerimiento' => 'required|string|max:255',
            'num_vacantes' => 'required|integer|min:1',
            'horario_trabajo' => 'required|string|max:255',
            'turno' => 'required|in:Mañana,Tarde,Noche,Rotativo',
            'disponibilidad_viajar' => 'boolean',
            'requiere_vehiculo' => 'boolean',
            'ciudad' => 'required|string|max:255',
            'fecha_tentativa_ingreso' => 'required|date',
            'empresa' => 'required|string|max:255',
            'grupo_ocupacional' => 'required|string|max:255',
            'rango_edad' => 'nullable|string|max:50',
            'nacionalidad' => 'nullable|string|max:100',
            'genero' => 'nullable|in:Indiferente,Masculino,Femenino',
            'estado_civil' => 'nullable|in:Indiferente,Soltero,Casado,Otro',
            'carga_familiar' => 'nullable|string|max:50',
            'discapacidad' => 'nullable|in:Sí,No,Indiferente',
            'caracteristicas_jefe' => 'nullable|string',
            'experiencia_requerida' => 'required|string',
            'experiencia_sectores' => 'nullable|array',
            'experiencia_sectores.*.sector' => 'required_with:experiencia_sectores|string',
            'experiencia_sectores.*.tiempo' => 'required_with:experiencia_sectores|string',
            'especificaciones_hunting' => 'nullable|string',
            'justificativo_contratacion' => 'required|string',
            'tipo_contratacion' => 'required|in:reemplazo,nuevo_cargo',
            'motivo_salida' => 'nullable|string',
            'tipo_contrato' => 'required|in:Indefinido,Plazo fijo,Por obra,Pasantía',
            'remuneracion_base' => 'required|numeric|min:0',
            'remuneracion_variable' => 'nullable|numeric|min:0',
            'modo_pago_variable' => 'nullable|string|max:255',
            'movilizacion' => 'boolean',
            'movilizacion_monto' => 'nullable|numeric|min:0',
            'otros_rubros' => 'nullable|string',
            'candidato_interno' => 'boolean',
            'candidato_nombre' => 'nullable|string|max:255',
            'candidato_area' => 'nullable|string|max:255',
            'candidato_cargo_actual' => 'nullable|string|max:255',
            'motivo' => 'nullable|string',
            'nivel_urgencia' => 'nullable|in:baja,media,alta',
        ];
    }

    private function notificarGerenteArea(VacancyRequest $req): void
    {
        $relationship = \App\Models\UserRelationship::where('user_id', $req->user_id)->first();
        if ($relationship && $relationship->supervisor_id) {
            Notification::create([
                'user_id' => $relationship->supervisor_id,
                'title' => 'Nueva requisición pendiente',
                'message' => ($req->user?->display_name ?? '—') . ' solicitó: ' . $req->cargo_requerimiento . ' (' . $req->empresa . ')',
                'type' => 'info',
                'reference_id' => $req->id,
                'reference_type' => 'vacancy_request',
            ]);
        }
    }

    private function notificarTH(VacancyRequest $req, string $mensaje): void
    {
        $ths = \App\Models\UserRelationship::whereNotNull('authorizer_id')->pluck('authorizer_id')->unique();
        foreach ($ths as $thId) {
            Notification::create([
                'user_id' => $thId,
                'title' => 'Requisición ' . $mensaje,
                'message' => $req->cargo_requerimiento . ' - ' . $req->empresa,
                'type' => 'info',
                'reference_id' => $req->id,
                'reference_type' => 'vacancy_request',
            ]);
        }
    }

    private function notificarSeleccion(VacancyRequest $req): void
    {
        $ths = \App\Models\UserRelationship::whereNotNull('authorizer_id')->pluck('authorizer_id')->unique();
        foreach ($ths as $thId) {
            Notification::create([
                'user_id' => $thId,
                'title' => 'Requisición lista para selección',
                'message' => $req->cargo_requerimiento . ' - ' . $req->empresa . ' - Iniciar proceso de reclutamiento',
                'type' => 'info',
                'reference_id' => $req->id,
                'reference_type' => 'vacancy_request',
            ]);
        }
    }
}
