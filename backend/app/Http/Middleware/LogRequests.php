<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class LogRequests
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $start = microtime(true);

        $response = $next($request);

        $duration = round((microtime(true) - $start) * 1000, 2);

        // Log all API requests
        if ($request->is('api/*')) {
            $logData = [
                'method' => $request->method(),
                'url' => $request->fullUrl(),
                'ip' => $request->ip(),
                'user_id' => auth()->id(),
                'status' => $response->getStatusCode(),
                'duration_ms' => $duration,
                'user_agent' => $request->userAgent(),
            ];

            // Log errors at warning level
            if ($response->getStatusCode() >= 400) {
                Log::warning('API Request Failed', $logData);
            } else {
                Log::info('API Request', $logData);
            }
        }

        return $response;
    }
}
