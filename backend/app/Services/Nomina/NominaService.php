<?php

namespace App\Services\Nomina;

use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Nómina — cálculo bajo demanda.
 *
 * SCOPE, deliberately narrow: this is a READ-ONLY projection. It computes an
 * estimated payslip from data that already exists (compensations +
 * commission_records) and persists NOTHING. There is no payroll run, no
 * payslip storage, no bank file export and no IESS filing here — those need
 * client-provided specifications we do not have.
 *
 * Follows RotacionService: pull a denormalised roster once and aggregate in
 * PHP. The workforce is in the hundreds, so this is faster to read and easier
 * to extend than a pile of GROUP BY variants.
 */
class NominaService
{
    /** @var array<string,Collection> roster cache keyed by periodo */
    private array $rosterPorPeriodo = [];

    public function __construct(private readonly NominaCalculadora $calculadora) {}

    // ────────────────────────────────────────────────────────────────
    // Public API
    // ────────────────────────────────────────────────────────────────

    /** Periods that actually have commission data, newest first. */
    public function periodosDisponibles(): array
    {
        $periodos = DB::table('commission_records')
            ->distinct()
            ->orderByDesc('periodo')
            ->pluck('periodo')
            ->all();

        $actual = Carbon::now()->format('Y-m');

        if (! in_array($actual, $periodos, true)) {
            array_unshift($periodos, $actual);
        }

        return $periodos;
    }

    public function periodoPorDefecto(): string
    {
        return $this->periodosDisponibles()[0] ?? Carbon::now()->format('Y-m');
    }

    public function esPeriodoValido(string $periodo): bool
    {
        return (bool) preg_match('/^\d{4}-(0[1-9]|1[0-2])$/', $periodo);
    }

    /** Company-level KPIs for the period. Every figure is an estimate. */
    public function resumen(string $periodo): array
    {
        $filas = $this->roster($periodo);

        return [
            'periodo' => $periodo,
            'colaboradores' => $filas->count(),
            'total_ingresos' => $this->sumar($filas, 'total_ingresos'),
            'total_comisiones' => $this->sumar($filas, 'total_comisiones'),
            'total_iess_personal' => $this->sumar($filas, 'iess_personal'),
            'total_neto' => $this->sumar($filas, 'neto_a_pagar'),
            'total_iess_patronal' => $this->sumar($filas, 'iess_patronal'),
            'total_provisiones' => round($filas->sum(fn ($f) => $f['provision_decimo_tercero']
                + $f['provision_decimo_cuarto']
                + $f['provision_fondos_reserva']), 2),
            'costo_total_empleador' => $this->sumar($filas, 'costo_total_empleador'),
            'con_fondos_reserva' => $filas->where('fondos_reserva_aplica', true)->count(),
            'con_comisiones' => $filas->where('total_comisiones', '>', 0)->count(),
        ];
    }

    /** Flat list for the data table. */
    public function colaboradores(string $periodo, array $filtros = []): array
    {
        $filas = $this->roster($periodo);

        foreach (['area', 'esquema', 'tipo_contrato'] as $campo) {
            if (! empty($filtros[$campo])) {
                $filas = $filas->where($campo, $filtros[$campo]);
            }
        }

        if (! empty($filtros['buscar'])) {
            $q = mb_strtolower($filtros['buscar']);
            $filas = $filas->filter(fn ($f) => str_contains(mb_strtolower($f['nombre']), $q)
                || str_contains(mb_strtolower((string) $f['employee_code']), $q)
                || str_contains(mb_strtolower((string) $f['cedula']), $q));
        }

        return $filas->sortBy('nombre', SORT_NATURAL | SORT_FLAG_CASE)->values()->all();
    }

    /** Full breakdown for one person. Null when they are not in the period. */
    public function detalle(string $userId, string $periodo): ?array
    {
        return $this->roster($periodo)->firstWhere('user_id', $userId);
    }

    /** Distinct values for the table filters. */
    public function catalogos(string $periodo): array
    {
        $filas = $this->roster($periodo);

        return [
            'areas' => $filas->pluck('area')->unique()->filter()->sort()->values()->all(),
            'esquemas' => $filas->pluck('esquema')->unique()->filter()->sort()->values()->all(),
            'tipos_contrato' => $filas->pluck('tipo_contrato')->unique()->filter()->sort()->values()->all(),
            'periodos' => $this->periodosDisponibles(),
        ];
    }

    /**
     * The assumptions panel. The UI is REQUIRED to render this so no figure in
     * the module is ever read as a confirmed, compliance-grade number.
     */
    public function supuestos(): array
    {
        $tarifas = $this->calculadora->tarifas();

        return [
            'tarifas' => $tarifas->aArray(),
            'conceptos_comision' => array_map(
                fn (string $c) => ['concepto' => $c, 'etiqueta' => NominaCalculadora::ETIQUETAS_COMISION[$c]],
                NominaCalculadora::CONCEPTOS_COMISION,
            ),
            'advertencias' => array_values(array_filter([
                ! $tarifas->confirmado
                    ? 'Las tarifas usadas son referencias públicas '.$tarifas->anioReferencia.' sin confirmar por el cliente ni por un contador. Todos los montos son estimados.'
                    : null,
                $tarifas->patronalEsAmbiguo()
                    ? 'La aportación patronal varía según la fuente consultada ('
                        .number_format($tarifas->iessPatronalRango[0], 2).'% a '
                        .number_format($tarifas->iessPatronalRango[1], 2).'%). Se usa '
                        .number_format($tarifas->iessPatronalPct, 2).'% como base y requiere confirmación contable.'
                    : null,
                'La regla de combinación de las 4 variables de comisión no está definida por el cliente. Por ahora se suman de forma independiente; es un supuesto provisional.',
                'El variable objetivo es una meta contractual, no un valor devengado: no se suma al ingreso bruto.',
                'Este módulo calcula proyecciones bajo demanda. No genera roles de pago, no archiva histórico y no produce archivos bancarios ni declaraciones al IESS.',
            ])),
        ];
    }

    // ────────────────────────────────────────────────────────────────
    // Roster construction
    // ────────────────────────────────────────────────────────────────

    private function roster(string $periodo): Collection
    {
        if (isset($this->rosterPorPeriodo[$periodo])) {
            return $this->rosterPorPeriodo[$periodo];
        }

        $finPeriodo = Carbon::createFromFormat('Y-m', $periodo)->endOfMonth();

        // Latest compensation effective on or before the end of the period —
        // compensations are historised by vigente_desde, so picking "the last
        // row" blindly would leak a future raise into a past period.
        $compensaciones = DB::table('compensations')
            ->whereDate('vigente_desde', '<=', $finPeriodo)
            ->orderBy('vigente_desde')
            ->get()
            ->groupBy('user_id')
            ->map(fn ($c) => $c->last());

        $comisiones = DB::table('commission_records')
            ->where('periodo', $periodo)
            ->get()
            ->groupBy('user_id');

        $personas = DB::table('employment_records as e')
            ->join('users as u', 'u.id', '=', 'e.user_id')
            ->leftJoin('puestos as p', 'p.id', '=', 'e.puesto_id')
            ->leftJoin('business_units as b', 'b.id', '=', 'e.business_unit_id')
            ->where('e.estado', 'activo')
            ->select([
                'e.user_id', 'e.employee_code', 'e.cedula', 'e.area', 'e.nivel',
                'e.tipo_contrato', 'e.fecha_ingreso',
                'u.display_name as nombre',
                'p.nombre as puesto',
                'b.nombre as business_unit',
            ])
            ->get();

        $this->rosterPorPeriodo[$periodo] = $personas
            // No compensation on record means no salary to project from.
            // Guessing one would be fabricating payroll data.
            ->filter(fn ($p) => $compensaciones->has($p->user_id))
            ->map(function ($p) use ($compensaciones, $comisiones, $finPeriodo) {
                $comp = $compensaciones->get($p->user_id);

                $montos = ($comisiones->get($p->user_id) ?? collect())
                    ->groupBy('concepto')
                    ->map(fn ($registros) => (float) $registros->sum('monto'))
                    ->all();

                $ingreso = Carbon::parse($p->fecha_ingreso);
                $mesesAntiguedad = $ingreso->gt($finPeriodo)
                    ? null
                    : (int) $ingreso->diffInMonths($finPeriodo);

                $calculo = $this->calculadora->calcular(
                    salarioBase: (float) $comp->salario_base,
                    comisiones: $montos,
                    variableObjetivo: (float) $comp->variable_objetivo,
                    mesesAntiguedad: $mesesAntiguedad,
                );

                return array_merge([
                    'user_id' => $p->user_id,
                    'employee_code' => $p->employee_code,
                    'cedula' => $p->cedula,
                    'nombre' => $p->nombre,
                    'puesto' => $p->puesto,
                    'area' => $p->area,
                    'nivel' => $p->nivel,
                    'business_unit' => $p->business_unit,
                    'tipo_contrato' => $p->tipo_contrato,
                    'fecha_ingreso' => $p->fecha_ingreso,
                    'esquema' => $comp->esquema,
                    'moneda' => $comp->moneda,
                    'vigente_desde' => $comp->vigente_desde,
                ], $calculo);
            })
            ->values();

        return $this->rosterPorPeriodo[$periodo];
    }

    private function sumar(Collection $filas, string $campo): float
    {
        return round($filas->sum($campo), 2);
    }
}
