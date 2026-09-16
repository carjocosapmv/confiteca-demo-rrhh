<?php

namespace App\Http\Controllers\Api;

use App\Models\VacancyRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class VacancyRequestController extends ApiController
{
    protected function model(): string
    {
        return VacancyRequest::class;
    }

    protected function rules(): array
    {
        return [
            'cargo_solicitado' => 'required|string|max:255',
            'departamento' => 'required|string|max:255',
            'motivo' => 'required|string',
            'nivel_urgencia' => 'required|in:baja,media,alta',
            'fecha_estimada_ingreso' => 'nullable|date',
        ];
    }

    protected function updateRules($model): array
    {
        return [
            'cargo_solicitado' => 'sometimes|required|string|max:255',
            'departamento' => 'sometimes|required|string|max:255',
            'motivo' => 'sometimes|required|string',
            'nivel_urgencia' => 'sometimes|required|in:baja,media,alta',
            'fecha_estimada_ingreso' => 'nullable|date',
            'status' => 'sometimes|required|in:pendiente,aprobada,rechazada',
            'nota_revision' => 'required_if:status,rechazada|nullable|string',
        ];
    }

    protected function defaultLoads(): array
    {
        return ['user', 'reviewer'];
    }

    protected function defaultSort(): array
    {
        return ['created_at', 'desc'];
    }

    public function index(Request $request): JsonResponse
    {
        $user = auth()->user();
        $query = VacancyRequest::query()->with($this->defaultLoads());

        if (!$user->isSuperAdmin() && !$user->isAdmin()) {
            $query->where('user_id', $user->id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('departamento')) {
            $query->where('departamento', $request->input('departamento'));
        }

        if ($request->filled('nivel_urgencia')) {
            $query->where('nivel_urgencia', $request->input('nivel_urgencia'));
        }

        $sortBy = $request->input('sort_by', 'created_at');
        $sortDir = $request->input('sort_direction', 'desc');
        $query->orderBy($sortBy, $sortDir);

        $results = $query->get();

        return response()->json($results);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate($this->rules());
        $validated['user_id'] = auth()->id();
        $validated['status'] = 'pendiente';

        $model = VacancyRequest::create($validated);

        return response()->json($model->fresh()->load($this->defaultLoads()), 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $model = VacancyRequest::findOrFail($id);

        $validated = $request->validate($this->updateRules($model));

        DB::beginTransaction();
        try {
            if (in_array($validated['status'] ?? null, ['aprobada', 'rechazada'])) {
                $validated['reviewed_by'] = auth()->id();
                $validated['reviewed_at'] = now();
            }

            if ($validated['status'] ?? null === 'rechazada' && empty($validated['nota_revision'])) {
                DB::rollBack();
                return response()->json(['message' => 'La nota es obligatoria para rechazar.'], 422);
            }

            $model->update($validated);
            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }

        return response()->json($model->fresh()->load($this->defaultLoads()));
    }

    public function review(Request $request, string $id): JsonResponse
    {
        $model = VacancyRequest::findOrFail($id);

        $validated = $request->validate([
            'status' => 'required|in:aprobada,rechazada',
            'nota_revision' => 'required|string',
        ]);

        $model->update([
            'status' => $validated['status'],
            'nota_revision' => $validated['nota_revision'],
            'reviewed_by' => auth()->id(),
            'reviewed_at' => now(),
        ]);

        return response()->json($model->fresh()->load($this->defaultLoads()));
    }

    public function destroy(string $id): JsonResponse
    {
        $model = VacancyRequest::findOrFail($id);
        $model->delete();

        return response()->json(['message' => 'Eliminado']);
    }
}
