<?php

namespace App\Http\Controllers\Api;

use App\Models\BusinessUnit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Validation\Rule;

class BusinessUnitController extends ApiController
{
    protected function model(): string
    {
        return BusinessUnit::class;
    }

    protected function rules(): array
    {
        return [
            'nombre' => ['required', 'string', 'max:255', Rule::unique('business_units', 'nombre')],
            'codigo' => ['required', 'string', 'max:50', Rule::unique('business_units', 'codigo')],
            'descripcion' => ['nullable', 'string'],
            'responsable_id' => ['nullable', 'uuid', 'exists:users,id'],
            'activo' => ['boolean'],
        ];
    }

    protected function updateRules($model): array
    {
        return [
            'nombre' => ['required', 'string', 'max:255', Rule::unique('business_units', 'nombre')->ignore($model->id)],
            'codigo' => ['required', 'string', 'max:50', Rule::unique('business_units', 'codigo')->ignore($model->id)],
            'descripcion' => ['nullable', 'string'],
            'responsable_id' => ['nullable', 'uuid', 'exists:users,id'],
            'activo' => ['boolean'],
        ];
    }

    protected function defaultLoads(): array
    {
        return ['responsable', 'teams'];
    }

    protected function applyFilters(Builder $query, Request $request): Builder
    {
        if ($request->filled('activo')) {
            $query->where('activo', $request->boolean('activo'));
        }

        return $query;
    }

    protected function applySearch(Builder $query, string $search): Builder
    {
        return $query->where(function ($q) use ($search) {
            $q->where('nombre', 'like', "%{$search}%")
              ->orWhere('codigo', 'like', "%{$search}%")
              ->orWhere('descripcion', 'like', "%{$search}%");
        });
    }

    protected function defaultSort(): array
    {
        return ['nombre', 'asc'];
    }
}
