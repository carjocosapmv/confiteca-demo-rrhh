<?php

namespace App\Providers;

use App\Services\Nomina\NominaCalculadora;
use App\Services\Nomina\TarifasNomina;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        // Payroll rates are read from config exactly once, here. The calculator
        // itself stays pure and framework-free so the maths can be unit-tested
        // without booting the application.
        $this->app->singleton(
            TarifasNomina::class,
            fn () => TarifasNomina::desdeArray(config('payroll'))
        );

        $this->app->singleton(
            NominaCalculadora::class,
            fn ($app) => new NominaCalculadora($app->make(TarifasNomina::class))
        );
    }

    public function boot(): void
    {
        //
    }
}
