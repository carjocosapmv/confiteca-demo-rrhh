<?php

use App\Http\Middleware\SecurityHeaders;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Http\Request;
use Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\HttpKernel\Exception\UnauthorizedHttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // API-only backend: guests must never be redirected to a `login` route.
        // Laravel defaults to `redirectGuestsTo(fn () => route('login'))`, but
        // routes/web.php is intentionally empty, so any unauthenticated request
        // that did not send `Accept: application/json` blew up with a 500
        // RouteNotFoundException inside Authenticate::redirectTo() -- before an
        // AuthenticationException was ever thrown, which is why the render
        // callback below never fired. Returning null keeps the exception as an
        // AuthenticationException and yields a clean JSON 401 for every client.
        $middleware->redirectGuestsTo(null);

        $middleware->api(prepend: [
            EnsureFrontendRequestsAreStateful::class,
            SecurityHeaders::class,
        ]);

        $middleware->statefulApi();

        $middleware->alias([
            'role' => \App\Http\Middleware\CheckRole::class,
            'permission' => \App\Http\Middleware\CheckPermission::class,
            'throttle:api' => \Illuminate\Routing\Middleware\ThrottleRequests::class.':api',
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Don't expose stack traces in production
        $exceptions->dontReportDuplicates(true);

        // Custom error responses
        $exceptions->render(function (NotFoundHttpException $e, Request $request) {
            if ($request->is('api/*')) {
                return response()->json([
                    'message' => 'Resource not found',
                    'error' => 'not_found',
                ], 404);
            }
        });

        $exceptions->render(function (AuthenticationException $e, Request $request) {
            if ($request->is('api/*')) {
                return response()->json([
                    'message' => 'Unauthenticated',
                    'error' => 'unauthenticated',
                ], 401);
            }
        });

        $exceptions->render(function (UnauthorizedHttpException $e, Request $request) {
            if ($request->is('api/*')) {
                return response()->json([
                    'message' => 'Unauthenticated',
                    'error' => 'unauthenticated',
                ], 401);
            }
        });

        $exceptions->render(function (\Illuminate\Auth\Access\AuthorizationException $e, Request $request) {
            if ($request->is('api/*')) {
                return response()->json([
                    'message' => 'Unauthorized',
                    'error' => 'forbidden',
                ], 403);
            }
        });

        $exceptions->render(function (\Illuminate\Validation\ValidationException $e, Request $request) {
            if ($request->is('api/*')) {
                return response()->json([
                    'message' => 'Validation failed',
                    'errors' => $e->errors(),
                ], 422);
            }
        });
    })->create();
