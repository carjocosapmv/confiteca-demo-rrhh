<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\UserRole;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class AuthController extends Controller
{
    /**
     * Handle an incoming authentication request.
     */
    public function login(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        if (! Auth::attempt($request->only('email', 'password'), $request->boolean('remember'))) {
            return response()->json(['message' => 'Invalid credentials'], 401);
        }

        $request->session()->regenerate();

        $user = Auth::user()->load(['roles', 'unitAssignments', 'businessUnit', 'puesto']);

        return response()->json([
            'user' => $this->formatUserResponse($user),
        ]);
    }

    /**
     * Destroy an authenticated session.
     */
    public function logout(Request $request): JsonResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['message' => 'Logged out successfully']);
    }

    /**
     * Get the authenticated user.
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user()->load([
            'roles',
            'unitAssignments',
            'businessUnit',
            'puesto',
        ]);

        return response()->json([
            'user' => $this->formatUserResponse($user),
        ]);
    }

    /**
     * Create a new user (admin only).
     */
    public function register(Request $request): JsonResponse
    {
        /** @var \App\Models\User $authUser */
        $authUser = $request->user();

        if (! $authUser->isAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validator = Validator::make($request->all(), [
            'email' => ['required', 'email', 'unique:users,email'],
            'password' => ['required', 'min:8', 'confirmed'],
            'display_name' => ['nullable', 'string', 'max:255'],
            'role' => ['required', 'in:superadmin,admin,user,viewer'],
            'hire_date' => ['nullable', 'date'],
            'is_financial_admin' => ['boolean'],
            'business_unit_id' => ['nullable', 'uuid', 'exists:business_units,id'],
            'puesto_id' => ['nullable', 'uuid', 'exists:puestos,id'],
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = User::create([
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'display_name' => $request->display_name,
            'hire_date' => $request->hire_date,
            'is_financial_admin' => $request->boolean('is_financial_admin', false),
            'business_unit_id' => $request->business_unit_id,
            'puesto_id' => $request->puesto_id,
        ]);

        UserRole::create([
            'user_id' => $user->id,
            'role' => $request->role,
        ]);

        return response()->json([
            'message' => 'User created successfully',
            'user' => $this->formatUserResponse($user->load(['roles', 'unitAssignments', 'businessUnit', 'puesto'])),
        ], 201);
    }

    /**
     * Format user response for the frontend.
     */
    private function formatUserResponse(User $user): array
    {
        return [
            'id' => $user->id,
            'email' => $user->email,
            'display_name' => $user->display_name,
            'avatar_url' => $user->avatar_url,
            'hire_date' => $user->hire_date?->format('Y-m-d'),
            'is_financial_admin' => $user->is_financial_admin,
            'security_watermark_enabled' => $user->security_watermark_enabled,
            'business_unit_id' => $user->business_unit_id,
            'puesto_id' => $user->puesto_id,
            'roles' => $user->roles->pluck('role'),
            'assigned_units' => $user->unitAssignments->pluck('unidad_negocio_id'),
            'business_unit' => $user->businessUnit?->nombre,
            'puesto' => $user->puesto?->nombre,
        ];
    }
}
