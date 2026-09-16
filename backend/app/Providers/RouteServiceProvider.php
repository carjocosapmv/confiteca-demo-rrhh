<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class RouteServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        $this->configureRateLimiting();
    }

    /**
     * Configure the rate limiters for the application.
     */
    protected function configureRateLimiting(): void
    {
        // General API rate limiting
        RateLimiter::for('api', function (Request $request) {
            return $request->user()
                ? Limit::perMinute(120)->by($request->user()->id)
                : Limit::perMinute(30)->by($request->ip());
        });

        // Login endpoint - stricter to prevent brute force
        RateLimiter::for('login', function (Request $request) {
            return Limit::perMinute(10)->by($request->ip().$request->input('email'));
        });

        // Admin endpoints - moderate limit
        RateLimiter::for('admin', function (Request $request) {
            return $request->user()?->isSuperAdmin()
                ? Limit::none()
                : Limit::perMinute(60)->by($request->user()?->id ?? $request->ip());
        });
    }
}
