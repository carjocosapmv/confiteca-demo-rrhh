<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\RolePermission;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RolePermissionController extends Controller
{
    /**
     * Get all permissions.
     */
    public function index(): JsonResponse
    {
        $permissions = RolePermission::all();

        return response()->json($permissions);
    }

    public function getByRole(string $role): JsonResponse
    {
        $permissions = RolePermission::where('role', $role)->get();

        return response()->json($permissions);
    }

    public function updateBulk(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'role' => ['required', 'in:superadmin,admin,user,viewer'],
            'permissions' => ['required', 'array'],
            'permissions.*.module_key' => ['required', 'string'],
            'permissions.*.can_view' => ['boolean'],
            'permissions.*.can_edit' => ['boolean'],
        ]);

        foreach ($validated['permissions'] as $perm) {
            RolePermission::updateOrCreate(
                [
                    'role' => $validated['role'],
                    'module_key' => $perm['module_key'],
                ],
                [
                    'can_view' => $perm['can_view'] ?? true,
                    'can_edit' => $perm['can_edit'] ?? false,
                ]
            );
        }

        return response()->json([
            'message' => 'Permissions updated successfully',
        ]);
    }

    public function updateSingle(Request $request, string $role, string $moduleKey): JsonResponse
    {
        $validated = $request->validate([
            'can_view' => ['boolean'],
            'can_edit' => ['boolean'],
        ]);

        $permission = RolePermission::updateOrCreate(
            ['role' => $role, 'module_key' => $moduleKey],
            $validated,
        );

        return response()->json($permission);
    }
}
