<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

abstract class ApiController extends Controller
{
    abstract protected function model(): string;

    protected string $abilityPrefix = '';

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', $this->model());

        $query = $this->model()::query();

        if (method_exists($this, 'applyFilters')) {
            $query = $this->applyFilters($query, $request);
        }

        if (method_exists($this, 'applySearch') && $request->filled('search')) {
            $query = $this->applySearch($query, $request->input('search'));
        }

        if ($request->filled('sort_by')) {
            $direction = $request->input('sort_direction', 'asc');
            $query->orderBy($request->input('sort_by'), $direction);
        } elseif (method_exists($this, 'defaultSort')) {
            $query->orderBy(...$this->defaultSort());
        } else {
            $query->latest();
        }

        $loads = $this->defaultLoads();
        if (!empty($loads)) {
            $query->with($loads);
        }

        $results = $query->get();

        return response()->json($results);
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorize('create', $this->model());

        $validated = $request->validate($this->rules());

        if (method_exists($this, 'beforeCreate')) {
            $validated = $this->beforeCreate($validated, $request);
        }

        $model = $this->model()::create($validated);

        if (method_exists($this, 'afterCreate')) {
            $this->afterCreate($model, $request);
        }

        return response()->json($model->fresh()->load($this->defaultLoads()), 201);
    }

    public function show(string $id): JsonResponse
    {
        $model = $this->model()::findOrFail($id);
        $this->authorize('view', $model);

        return response()->json($model->load($this->defaultLoads()));
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $model = $this->model()::findOrFail($id);
        $this->authorize('update', $model);

        $validated = $request->validate($this->updateRules($model));

        if (method_exists($this, 'beforeUpdate')) {
            $validated = $this->beforeUpdate($validated, $request, $model);
        }

        $model->update($validated);

        if (method_exists($this, 'afterUpdate')) {
            $this->afterUpdate($model, $request);
        }

        return response()->json($model->fresh()->load($this->defaultLoads()));
    }

    public function destroy(string $id): JsonResponse
    {
        $model = $this->model()::findOrFail($id);
        $this->authorize('delete', $model);

        if (method_exists($this, 'beforeDelete')) {
            $this->beforeDelete($model);
        }

        $model->delete();

        return response()->json(['message' => 'Deleted successfully']);
    }

    protected function rules(): array
    {
        return [];
    }

    protected function updateRules($model): array
    {
        return $this->rules();
    }

    protected function defaultLoads(): array
    {
        return [];
    }
}
