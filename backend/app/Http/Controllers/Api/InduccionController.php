<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\InductionActivity;
use App\Models\InductionProgram;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use App\Support\ConfitecaOrg;
use Illuminate\Http\Request;

class InduccionController extends Controller
{
    // ─── Colaborador ─────────────────────────────────────────────────

    public function miPrograma(Request $request): JsonResponse
    {
        $program = InductionProgram::where('user_id', $request->user()->id)
            ->with(['activities' => function ($q) {
                $q->orderBy('dia')->orderBy('horario');
            }])
            ->first();

        if (!$program) {
            return response()->json(['data' => null, 'message' => 'No tienes un programa de inducción asignado.']);
        }

        return response()->json(['data' => $program]);
    }

    public function guardarEncuesta(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'survey_rating' => ['required', 'in:excelente,bueno,malo'],
            'survey_feedback' => ['nullable', 'string', 'max:1000'],
            'survey_commitment' => ['required', 'accepted'],
        ]);

        $program = InductionProgram::where('user_id', $request->user()->id)->firstOrFail();

        $program->update([
            'survey_rating' => $validated['survey_rating'],
            'survey_feedback' => $validated['survey_feedback'] ?? null,
            'survey_commitment' => true,
        ]);

        return response()->json(['message' => 'Encuesta guardada correctamente.', 'data' => $program->fresh()]);
    }

    public function generarCertificado(Request $request): JsonResponse
    {
        $program = InductionProgram::where('user_id', $request->user()->id)->firstOrFail();

        if ($program->progreso < 100) {
            return response()->json(['message' => 'Debes completar todas las actividades para generar el certificado.'], 400);
        }

        $program->update(['certificate_generated_at' => now()]);

        $user = $request->user();

        $certificate = [
            'colaborador' => $user->display_name,
            'cargo' => $user->puesto?->nombre ?? '—',
            'empresa' => $program->empresa,
            'fecha_ingreso' => $program->fecha_ingreso->format('d/m/Y'),
            'fecha_completado' => now()->format('d/m/Y'),
            'firma_th' => 'Talento Humano - Confiteca',
            'program_id' => $program->id,
        ];

        return response()->json(['message' => 'Certificado generado.', 'data' => $certificate]);
    }

    // ─── Facilitador ─────────────────────────────────────────────────

    public function facilitadorColaboradores(Request $request): JsonResponse
    {
        $facilitadorName = $request->user()->display_name;

        $programIds = InductionActivity::where('facilitador', $facilitadorName)
            ->distinct()
            ->pluck('program_id');

        $programs = InductionProgram::whereIn('id', $programIds)
            ->with(['user', 'activities' => function ($q) use ($facilitadorName) {
                $q->where('facilitador', $facilitadorName)->orderBy('dia')->orderBy('horario');
            }])
            ->get()
            ->map(function ($p) {
                return [
                    'colaborador' => $p->user,
                    'empresa' => $p->empresa,
                    'area' => $p->area,
                    'fecha_ingreso' => $p->fecha_ingreso,
                    'progreso' => $p->progreso,
                    'actividades' => $p->activities,
                ];
            });

        return response()->json(['data' => $programs]);
    }

    public function updateActividad(Request $request, InductionActivity $inductionActivity): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['required', 'in:en_curso,aplazado,cancelado,finalizado'],
            'observaciones' => ['nullable', 'string', 'max:500'],
        ]);

        $inductionActivity->update($validated);

        $this->recalcularProgreso($inductionActivity->program_id);

        Notification::create([
            'user_id' => $inductionActivity->program->user_id,
            'title' => 'Actividad de inducción actualizada',
            'message' => "La actividad '{$inductionActivity->contenido}' fue marcada como {$validated['status']}.",
            'type' => 'info',
            'reference_id' => $inductionActivity->program_id,
            'reference_type' => 'induction',
        ]);

        return response()->json([
            'message' => 'Actividad actualizada.',
            'data' => $inductionActivity->fresh(),
        ]);
    }

    // ─── Talento Humano ──────────────────────────────────────────────

    public function thIndex(): JsonResponse
    {
        $programs = InductionProgram::with(['user', 'activities'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($p) {
                $diasSinAvance = $this->diasSinAvance($p);
                $ultimaActividad = $p->activities->sortByDesc('updated_at')->first();

                return [
                    'id' => $p->id,
                    'colaborador' => $p->user,
                    'empresa' => $p->empresa,
                    'area' => $p->area,
                    'fecha_ingreso' => $p->fecha_ingreso,
                    'progreso' => $p->progreso,
                    'total_actividades' => $p->total_actividades,
                    'completadas' => $p->completadas,
                    'dias_sin_avance' => $diasSinAvance,
                    'alerta_estancado' => $diasSinAvance > 5,
                    'ultima_actividad' => $ultimaActividad?->contenido,
                    'ultima_fecha' => $ultimaActividad?->updated_at,
                ];
            });

        return response()->json(['data' => $programs]);
    }

    public function thDetalle(string $id): JsonResponse
    {
        $program = InductionProgram::with([
            'user',
            'activities' => fn($q) => $q->orderBy('dia')->orderBy('horario'),
        ])->findOrFail($id);

        return response()->json(['data' => $program]);
    }

    public function thCrearPrograma(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'user_id' => ['required', 'uuid', 'exists:users,id'],
            'empresa' => ['required', 'string', 'max:255'],
            'area' => ['required', 'string', 'max:255'],
            'fecha_ingreso' => ['required', 'date'],
            'actividades' => ['required', 'array', 'min:1'],
            'actividades.*.dia' => ['required', 'integer', 'min:1'],
            'actividades.*.area_competencia' => ['required', 'string', 'max:255'],
            'actividades.*.contenido' => ['required', 'string', 'max:500'],
            'actividades.*.fecha' => ['required', 'date'],
            'actividades.*.lugar' => ['required', 'string', 'max:255'],
            'actividades.*.horario' => ['required', 'string', 'max:50'],
            'actividades.*.facilitador' => ['required', 'string', 'max:255'],
        ]);

        $program = InductionProgram::create([
            'user_id' => $validated['user_id'],
            'empresa' => $validated['empresa'],
            'area' => $validated['area'],
            'fecha_ingreso' => $validated['fecha_ingreso'],
            'total_actividades' => count($validated['actividades']),
        ]);

        foreach ($validated['actividades'] as $act) {
            InductionActivity::create(array_merge($act, ['program_id' => $program->id, 'status' => 'pendiente']));
        }

        Notification::create([
            'user_id' => $validated['user_id'],
            'title' => 'Programa de inducción asignado',
            'message' => "Se te ha asignado un programa de inducción para {$validated['empresa']} / {$validated['area']}.",
            'type' => 'info',
            'reference_id' => $program->id,
            'reference_type' => 'induction',
        ]);

        return response()->json(['message' => 'Programa de inducción creado.', 'data' => $program->load('activities')], 201);
    }

    public function thEmpresas(): JsonResponse
    {
        return response()->json(['data' => ConfitecaOrg::empresas()]);
    }

    public function thAreas(): JsonResponse
    {
        return response()->json(['data' => ConfitecaOrg::areas()]);
    }

    public function thFacilitadores(): JsonResponse
    {
        $names = User::whereHas('roles', fn($q) => $q->whereIn('role', ['admin', 'superadmin']))
            ->pluck('display_name');

        return response()->json(['data' => $names]);
    }

    public function thResumen(): JsonResponse
    {
        $total = InductionProgram::count();
        $activos = InductionProgram::where('progreso', '<', 100)->count();
        $completados = InductionProgram::where('progreso', 100)->count();
        $estancados = InductionProgram::where('progreso', '<', 100)->get()->filter(fn($p) => $this->diasSinAvance($p) > 5)->count();

        return response()->json([
            'data' => [
                'total' => $total,
                'activos' => $activos,
                'completados' => $completados,
                'estancados' => $estancados,
            ],
        ]);
    }

    // ─── Helpers ─────────────────────────────────────────────────────

    private function recalcularProgreso(string $programId): void
    {
        $program = InductionProgram::findOrFail($programId);
        $total = $program->activities()->count();
        $completadas = $program->activities()->where('status', 'finalizado')->count();
        $progreso = $total > 0 ? round(($completadas / $total) * 100) : 0;

        $data = [
            'progreso' => $progreso,
            'total_actividades' => $total,
            'completadas' => $completadas,
        ];

        if ($progreso === 100) {
            $data['completed_at'] = now();
        }

        $program->update($data);
    }

    private function diasSinAvance(InductionProgram $program): int
    {
        $ultima = $program->activities()->max('updated_at');
        if (!$ultima) {
            return $program->created_at->diffInDays(now());
        }
        return \Carbon\Carbon::parse($ultima)->diffInDays(now());
    }
}
