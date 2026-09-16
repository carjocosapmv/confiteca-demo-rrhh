<?php

namespace App\Http\Controllers\Api;

use App\Models\User;
use App\Models\UserRole;
use App\Models\UserUnitAssignment;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class AdminUserController extends ApiController
{
    protected function model(): string
    {
        return User::class;
    }

    protected function rules(): array
    {
        return [
            'email' => ['required', 'email', 'unique:users,email'],
            'password' => ['required', 'min:6'],
            'display_name' => ['nullable', 'string', 'max:255'],
            'hire_date' => ['nullable', 'date'],
            'is_financial_admin' => ['boolean'],
            'business_unit_id' => ['nullable', 'uuid', 'exists:business_units,id'],
            'puesto_id' => ['nullable', 'uuid', 'exists:puestos,id'],
            'role' => ['required', 'in:superadmin,admin,user,viewer'],
            'assigned_units' => ['nullable', 'array'],
            'assigned_units.*' => ['string'],
        ];
    }

    protected function updateRules($model): array
    {
        return [
            'email' => ['required', 'email', Rule::unique('users', 'email')->ignore($model->id)],
            'password' => ['nullable', 'min:8', 'confirmed'],
            'display_name' => ['nullable', 'string', 'max:255'],
            'hire_date' => ['nullable', 'date'],
            'is_financial_admin' => ['boolean'],
            'business_unit_id' => ['nullable', 'uuid', 'exists:business_units,id'],
            'puesto_id' => ['nullable', 'uuid', 'exists:puestos,id'],
            'role' => ['required', 'in:superadmin,admin,user,viewer'],
            'assigned_units' => ['nullable', 'array'],
            'assigned_units.*' => ['string'],
        ];
    }

    protected function defaultLoads(): array
    {
        return ['roles', 'unitAssignments', 'businessUnit', 'puesto'];
    }

    protected function applyFilters(Builder $query, Request $request): Builder
    {
        if ($request->filled('role')) {
            $query->whereHas('roles', function ($q) use ($request) {
                $q->where('role', $request->input('role'));
            });
        }

        if ($request->filled('business_unit_id')) {
            $query->where('business_unit_id', $request->input('business_unit_id'));
        }

        if ($request->filled('is_financial_admin')) {
            $query->where('is_financial_admin', $request->boolean('is_financial_admin'));
        }

        return $query;
    }

    protected function applySearch(Builder $query, string $search): Builder
    {
        return $query->where(function ($q) use ($search) {
            $q->where('email', 'like', "%{$search}%")
              ->orWhere('display_name', 'like', "%{$search}%");
        });
    }

    protected function defaultSort(): array
    {
        return ['email', 'asc'];
    }

    protected function beforeCreate(array $validated, Request $request): array
    {
        $validated['password'] = Hash::make($validated['password']);
        $validated['is_financial_admin'] = $request->boolean('is_financial_admin', false);

        return $validated;
    }

    protected function afterCreate($model, Request $request): void
    {
        // Create role
        UserRole::create([
            'user_id' => $model->id,
            'role' => $request->input('role'),
        ]);

        // Create unit assignments
        if ($request->filled('assigned_units')) {
            foreach ($request->input('assigned_units') as $unitId) {
                UserUnitAssignment::create([
                    'user_id' => $model->id,
                    'unidad_negocio_id' => $unitId,
                    'assigned_by' => auth()->id(),
                ]);
            }
        }
    }

    protected function afterUpdate($model, Request $request): void
    {
        // Update password if provided
        if ($request->filled('password')) {
            $model->update(['password' => Hash::make($request->password)]);
        }

        // Update role
        if ($request->filled('role')) {
            UserRole::updateOrCreate(
                ['user_id' => $model->id],
                ['role' => $request->input('role')]
            );
        }

        // Update unit assignments
        if ($request->filled('assigned_units')) {
            $model->unitAssignments()->delete();

            foreach ($request->input('assigned_units') as $unitId) {
                UserUnitAssignment::create([
                    'user_id' => $model->id,
                    'unidad_negocio_id' => $unitId,
                    'assigned_by' => auth()->id(),
                ]);
            }
        }
    }

    /**
     * Assign units to a user.
     */
    public function assignUnits(Request $request, User $user): JsonResponse
    {
        $validated = $request->validate([
            'units' => ['required', 'array'],
            'units.*' => ['required', 'string'],
        ]);

        // Delete existing assignments
        $user->unitAssignments()->delete();

        // Create new assignments
        foreach ($validated['units'] as $unitId) {
            UserUnitAssignment::create([
                'user_id' => $user->id,
                'unidad_negocio_id' => $unitId,
                'assigned_by' => auth()->id(),
            ]);
        }

        return response()->json([
            'message' => 'Units assigned successfully',
            'assigned_units' => $user->unitAssignments()->pluck('unidad_negocio_id'),
        ]);
    }

    /**
     * Change user role.
     */
    public function changeRole(Request $request, User $user): JsonResponse
    {
        $validated = $request->validate([
            'role' => ['required', 'in:superadmin,admin,user,viewer'],
        ]);

        UserRole::updateOrCreate(
            ['user_id' => $user->id],
            ['role' => $validated['role']]
        );

        return response()->json([
            'message' => 'Role updated successfully',
            'role' => $validated['role'],
        ]);
    }

    /**
     * Get all user roles (for admin panel).
     */
    public function getUserRoles(): JsonResponse
    {
        $roles = UserRole::all();
        return response()->json($roles);
    }

    /**
     * Get all user unit assignments (for admin panel).
     */
    public function getUserUnitAssignments(): JsonResponse
    {
        $assignments = UserUnitAssignment::all();
        return response()->json($assignments);
    }

    /**
     * Toggle financial admin status.
     */
    public function toggleFinancialAdmin(Request $request, User $user): JsonResponse
    {
        $validated = $request->validate([
            'is_financial_admin' => ['required', 'boolean'],
        ]);

        $user->update(['is_financial_admin' => $validated['is_financial_admin']]);

        return response()->json([
            'message' => 'Financial admin status updated',
            'is_financial_admin' => $user->is_financial_admin,
        ]);
    }

    /**
     * Remove a unit assignment from a user.
     */
    public function removeUnit(User $user, string $unitId): JsonResponse
    {
        $deleted = UserUnitAssignment::where('user_id', $user->id)
            ->where('unidad_negocio_id', $unitId)
            ->delete();

        if ($deleted === 0) {
            return response()->json(['message' => 'Assignment not found'], 404);
        }

        return response()->json(['message' => 'Unit removed successfully']);
    }

    public function toggleSecurityWatermark(Request $request, User $user): JsonResponse
    {
        $validated = $request->validate([
            'security_watermark_enabled' => ['required', 'boolean'],
        ]);

        $user->update(['security_watermark_enabled' => $validated['security_watermark_enabled']]);

        return response()->json([
            'message' => 'Security watermark updated',
            'security_watermark_enabled' => $user->security_watermark_enabled,
        ]);
    }
}
