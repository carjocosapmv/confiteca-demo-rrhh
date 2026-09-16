<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SanitizeInput
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $input = $request->all();

        if (is_array($input)) {
            $request->merge($this->sanitizeArray($input));
        }

        return $next($request);
    }

    /**
     * Recursively sanitize array values.
     */
    private function sanitizeArray(array $input): array
    {
        foreach ($input as $key => $value) {
            if (is_array($value)) {
                $input[$key] = $this->sanitizeArray($value);
            } elseif (is_string($value)) {
                // Remove null bytes and control characters
                $input[$key] = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $value);

                // Trim whitespace
                $input[$key] = trim($input[$key]);
            }
        }

        return $input;
    }
}
