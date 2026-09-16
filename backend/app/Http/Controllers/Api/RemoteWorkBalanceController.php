<?php

namespace App\Http\Controllers\Api;

use App\Models\RemoteWorkBalance;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;

class RemoteWorkBalanceController extends ApiController
{
    protected function model(): string
    {
        return RemoteWorkBalance::class;
    }

    protected function rules(): array
    {
        return [
            'user_id' => ['required', 'uuid', 'exists:users,id'],
            'total_days' => ['required', 'integer', 'min:0'],
            'used_days' => ['required', 'integer', 'min:0'],
            'renewal_date' => ['nullable', 'date'],
            'period_start' => ['nullable', 'date'],
            'period_end' => ['nullable', 'date'],
        ];
    }

    protected function updateRules($model): array
    {
        return [
            'total_days' => ['required', 'integer', 'min:0'],
            'used_days' => ['required', 'integer', 'min:0'],
            'renewal_date' => ['nullable', 'date'],
            'period_start' => ['nullable', 'date'],
            'period_end' => ['nullable', 'date'],
        ];
    }

    protected function defaultLoads(): array
    {
        return ['user'];
    }

    protected function applyFilters(Builder $query, Request $request): Builder
    {
        if ($request->filled('user_id')) {
            $query->where('user_id', $request->input('user_id'));
        }

        // Non-admins can only see their own balances
        $user = auth()->user();
        if (!$user->isAdmin() && !$user->isSuperAdmin()) {
            $query->where('user_id', $user->id);
        }

        return $query;
    }
}
