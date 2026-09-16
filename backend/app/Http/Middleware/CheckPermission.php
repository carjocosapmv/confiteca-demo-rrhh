<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckPermission
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string $moduleKey, string $ability = 'view'): Response
    {
        $user = $request->user();

        if (! $user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        // Superadmin bypasses all permission checks
        if ($user->hasRole('superadmin')) {
            return $next($request);
        }

        if (! $user->canAccessModule($moduleKey, $ability)) {
            return response()->json(['message' => "Unauthorized. Required: {$ability} on {$moduleKey}"], 403);
        }

        return $next($request);
    }
}
