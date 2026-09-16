<?php

namespace App\Http\Controllers\Api;

use App\Models\Puesto;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PuestoController extends ApiController
{
    protected function model(): string
    {
        return Puesto::class;
    }

    protected function rules(): array
    {
        return [
            'nombre' => ['required', 'string', 'max:255', Rule::unique('puestos', 'nombre')],
            'descripcion' => ['nullable', 'string'],
            'activo' => ['boolean'],
        ];
    }

    protected function updateRules($model): array
    {
        return [
            'nombre' => ['required', 'string', 'max:255', Rule::unique('puestos', 'nombre')->ignore($model->id)],
            'descripcion' => ['nullable', 'string'],
            'activo' => ['boolean'],
        ];
    }

    protected function defaultLoads(): array
    {
        return ['users', 'collaborators'];
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
        return $query->where('nombre', 'like', "%{$search}%")
            ->orWhere('descripcion', 'like', "%{$search}%");
    }

    protected function defaultSort(): array
    {
        return ['nombre', 'asc'];
    }
}
