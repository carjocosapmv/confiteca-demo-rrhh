<?php

namespace App\Services;

use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Turnover analytics.
 *
 * The workforce is small enough (hundreds, not millions) that pulling a single
 * denormalised roster and aggregating in PHP is both faster to read and easier
 * to extend than a pile of GROUP BY variants. If this ever grows past tens of
 * thousands of employees, move the aggregation into SQL views.
 */
class RotacionService
{
    private const MESES_VENTANA = 12;

    private ?Collection $roster = null;

    // ────────────────────────────────────────────────────────────────
    // Public API
    // ────────────────────────────────────────────────────────────────

    public function resumen(): array
    {
        $roster = $this->roster();
        $activos = $roster->where('estado', 'activo');
        $bajas12 = $this->bajasEnVentana($roster);

        $headcountPromedio = $this->headcountPromedio($activos->count(), $bajas12->count());

        $voluntarias = $bajas12->where('tipo', 'voluntaria')->count();
        $lamentables = $bajas12->where('es_lamentable', true)->count();

        $antiguedades = $activos->pluck('antiguedad_meses')->filter()->values();

        return [
            'headcount' => $activos->count(),
            'bajas_12m' => $bajas12->count(),
            'tasa_rotacion_12m' => $this->pct($bajas12->count(), $headcountPromedio),
            'tasa_voluntaria_12m' => $this->pct($voluntarias, $headcountPromedio),
            'tasa_involuntaria_12m' => $this->pct($bajas12->count() - $voluntarias, $headcountPromedio),
            'tasa_lamentable_12m' => $this->pct($lamentables, $headcountPromedio),
            'antiguedad_promedio_meses' => round($antiguedades->avg() ?? 0, 1),
            'antiguedad_mediana_meses' => round($antiguedades->median() ?? 0, 1),
            'ausentismo_pct' => round($activos->avg('ausentismo_pct') ?? 0, 2),
            'horas_extra_promedio_mes' => round($activos->avg('horas_extra_prom') ?? 0, 1),
            'desempeno_promedio' => round($activos->avg('desempeno') ?? 0, 1),
            'clima_promedio' => round($activos->avg('clima_satisfaccion') ?? 0, 2),
            'enps' => $this->enps($activos),
            'costo_estimado_rotacion' => $this->costoEstimadoRotacion($bajas12),
            'ventana_meses' => self::MESES_VENTANA,
        ];
    }

    /** Monthly headcount / exits / annualised rate */
    public function tendencia(int $meses = 24): array
    {
        $roster = $this->roster();
        $serie = [];

        for ($i = $meses - 1; $i >= 0; $i--) {
            $mes = Carbon::now()->startOfMonth()->subMonths($i);
            $fin = $mes->copy()->endOfMonth();

            $headcount = $roster->filter(function ($p) use ($mes, $fin) {
                if (Carbon::parse($p->fecha_ingreso)->gt($fin)) {
                    return false;
                }

                return ! $p->fecha_salida || Carbon::parse($p->fecha_salida)->gte($mes);
            })->count();

            $bajas = $roster->filter(function ($p) use ($mes, $fin) {
                return $p->fecha_salida
                    && Carbon::parse($p->fecha_salida)->between($mes, $fin);
            });

            $serie[] = [
                'periodo' => $mes->format('Y-m'),
                'etiqueta' => $mes->locale('es')->isoFormat('MMM YY'),
                'headcount' => $headcount,
                'bajas' => $bajas->count(),
                'bajas_voluntarias' => $bajas->where('tipo', 'voluntaria')->count(),
                'tasa_anualizada' => $headcount > 0
                    ? round($bajas->count() / $headcount * 12 * 100, 2)
                    : 0,
            ];
        }

        return $serie;
    }

    /** Available breakdowns for the dimension selector */
    public function dimensiones(): array
    {
        return [
            'area' => 'Área',
            'business_unit' => 'Unidad de negocio',
            'supervisor' => 'Jefe directo',
            'pais' => 'País',
            'tipo_contrato' => 'Tipo de contrato',
            'antiguedad' => 'Antigüedad',
            'rango_salarial' => 'Rango salarial',
            'desempeno' => 'Desempeño',
            'clima' => 'Clima laboral',
            'nivel' => 'Nivel',
            'modalidad' => 'Modalidad',
            'genero' => 'Género',
            'ausentismo' => 'Ausentismo',
            'horas_extra' => 'Horas extra',
        ];
    }

    public function porDimension(string $dimension): array
    {
        $roster = $this->roster();
        $llave = $this->llaveDimension($dimension);

        $grupos = $roster->groupBy($llave);

        $filas = $grupos->map(function (Collection $grupo, $categoria) {
            $activos = $grupo->where('estado', 'activo');
            $bajas = $this->bajasEnVentana($grupo);
            $promedio = $this->headcountPromedio($activos->count(), $bajas->count());

            return [
                'categoria' => (string) ($categoria === '' ? 'Sin dato' : $categoria),
                'headcount' => $activos->count(),
                // Small groups produce wild rates. The UI uses this to avoid
                // presenting a 2-person team as the company's worst problem.
                'muestra' => $activos->count() + $bajas->count(),
                'muestra_suficiente' => ($activos->count() + $bajas->count()) >= 5,
                'bajas_12m' => $bajas->count(),
                'bajas_voluntarias_12m' => $bajas->where('tipo', 'voluntaria')->count(),
                'tasa_rotacion' => $this->pct($bajas->count(), $promedio),
                'antiguedad_promedio_meses' => round($activos->avg('antiguedad_meses') ?? 0, 1),
                'ausentismo_pct' => round($activos->avg('ausentismo_pct') ?? 0, 2),
                'horas_extra_promedio' => round($activos->avg('horas_extra_prom') ?? 0, 1),
                'salario_promedio' => round($activos->avg('salario') ?? 0, 2),
                'desempeno_promedio' => round($activos->avg('desempeno') ?? 0, 1),
                'clima_promedio' => round($activos->avg('clima_satisfaccion') ?? 0, 2),
            ];
        })
            ->values()
            ->filter(fn ($f) => $f['headcount'] > 0 || $f['bajas_12m'] > 0)
            ->sortByDesc('tasa_rotacion')
            ->values()
            ->all();

        return [
            'dimension' => $dimension,
            'etiqueta' => $this->dimensiones()[$dimension] ?? $dimension,
            'filas' => $filas,
        ];
    }

    public function motivos(): array
    {
        $bajas = $this->bajasEnVentana($this->roster());
        $total = max(1, $bajas->count());

        return $bajas
            ->groupBy('motivo')
            ->map(fn (Collection $g, $motivo) => [
                'motivo' => $motivo ?: 'Sin registrar',
                'tipo' => $g->first()->tipo,
                'cantidad' => $g->count(),
                'porcentaje' => round($g->count() / $total * 100, 1),
                'es_lamentable' => (bool) $g->first()->es_lamentable,
            ])
            ->values()
            ->sortByDesc('cantidad')
            ->values()
            ->all();
    }

    /**
     * Flight-risk scoring.
     *
     * Deliberately a transparent rule engine, not a model: in a demo the client
     * must be able to ask "why is this person at risk" and get a straight answer.
     */
    public function riesgo(int $limite = 20): array
    {
        $roster = $this->roster()->where('estado', 'activo');

        $p75HorasExtra = $this->percentil($roster->pluck('horas_extra_prom')->filter()->values()->all(), 0.75);

        $rotacionPorJefe = collect($this->porDimension('supervisor')['filas'])
            ->keyBy('categoria');

        $evaluados = $roster->map(function ($p) use ($p75HorasExtra, $rotacionPorJefe) {
            $score = 0;
            $factores = [];

            if ($p->ausentismo_pct >= 6) {
                $score += 22;
                $factores[] = 'Ausentismo alto ('.round($p->ausentismo_pct, 1).'%)';
            } elseif ($p->ausentismo_pct >= 3) {
                $score += 10;
                $factores[] = 'Ausentismo por encima del promedio';
            }

            if ($p75HorasExtra > 0 && $p->horas_extra_prom > $p75HorasExtra) {
                $score += 15;
                $factores[] = 'Horas extra sostenidas ('.round($p->horas_extra_prom).' h/mes)';
            }

            if ($p->desempeno !== null && $p->desempeno < 60) {
                $score += 12;
                $factores[] = 'Desempeño bajo';
            }

            if ($p->clima_liderazgo !== null && $p->clima_liderazgo < 2.6) {
                $score += 20;
                $factores[] = 'Percepción negativa de su jefatura';
            }

            if ($p->clima_satisfaccion !== null && $p->clima_satisfaccion < 2.6) {
                $score += 12;
                $factores[] = 'Satisfacción baja';
            }

            if ($p->meses_sin_aumento !== null && $p->meses_sin_aumento >= 18) {
                $score += 14;
                $factores[] = 'Sin ajuste salarial hace '.$p->meses_sin_aumento.' meses';
            }

            if (in_array($p->tipo_contrato, ['temporal', 'aprendizaje'], true)) {
                $score += 8;
                $factores[] = 'Contrato '.$p->tipo_contrato;
            }

            if ($p->antiguedad_meses !== null && $p->antiguedad_meses <= 6) {
                $score += 10;
                $factores[] = 'Menos de 6 meses en la empresa';
            }

            $jefe = $rotacionPorJefe->get($p->supervisor_nombre);
            if ($jefe && $jefe['tasa_rotacion'] >= 30 && $jefe['headcount'] >= 4) {
                $score += 18;
                $factores[] = 'Su equipo rota al '.round($jefe['tasa_rotacion']).'%';
            }

            return [
                'user_id' => $p->user_id,
                'nombre' => $p->nombre,
                'employee_code' => $p->employee_code,
                'puesto' => $p->puesto,
                'area' => $p->area,
                'supervisor' => $p->supervisor_nombre,
                'antiguedad_meses' => $p->antiguedad_meses,
                'score' => min(100, $score),
                'nivel_riesgo' => match (true) {
                    $score >= 60 => 'alto',
                    $score >= 35 => 'medio',
                    default => 'bajo',
                },
                'factores' => $factores,
            ];
        });

        return $evaluados
            ->sortByDesc('score')
            ->take($limite)
            ->values()
            ->all();
    }

    /** Flat roster for the data table */
    public function colaboradores(array $filtros = []): array
    {
        $roster = $this->roster();

        if (($filtros['estado'] ?? 'activo') !== 'todos') {
            $roster = $roster->where('estado', $filtros['estado'] ?? 'activo');
        }

        foreach (['area', 'pais', 'tipo_contrato', 'nivel', 'business_unit'] as $campo) {
            if (! empty($filtros[$campo])) {
                $llave = $campo === 'business_unit' ? 'business_unit' : $campo;
                $roster = $roster->where($llave, $filtros[$campo]);
            }
        }

        if (! empty($filtros['buscar'])) {
            $q = mb_strtolower($filtros['buscar']);
            $roster = $roster->filter(fn ($p) => str_contains(mb_strtolower($p->nombre), $q)
                || str_contains(mb_strtolower($p->employee_code), $q)
                || str_contains(mb_strtolower((string) $p->puesto), $q));
        }

        return $roster->values()->map(fn ($p) => (array) $p)->all();
    }

    /** Distinct values for the table filters */
    public function catalogos(): array
    {
        $roster = $this->roster();

        return [
            'areas' => $roster->pluck('area')->unique()->filter()->sort()->values()->all(),
            'paises' => $roster->pluck('pais')->unique()->filter()->sort()->values()->all(),
            'tipos_contrato' => $roster->pluck('tipo_contrato')->unique()->filter()->sort()->values()->all(),
            'niveles' => $roster->pluck('nivel')->unique()->filter()->sort()->values()->all(),
            'unidades' => $roster->pluck('business_unit')->unique()->filter()->sort()->values()->all(),
            'dimensiones' => $this->dimensiones(),
        ];
    }

    // ────────────────────────────────────────────────────────────────
    // Roster construction
    // ────────────────────────────────────────────────────────────────

    private function roster(): Collection
    {
        if ($this->roster !== null) {
            return $this->roster;
        }

        $hoy = Carbon::now();
        $desde = $hoy->copy()->subMonths(self::MESES_VENTANA)->format('Y-m');

        $asistencia = DB::table('attendance_months')
            ->where('periodo', '>=', $desde)
            ->groupBy('user_id')
            ->selectRaw('user_id,
                AVG(horas_extra) as horas_extra_prom,
                SUM(dias_ausencia_justificada + dias_ausencia_injustificada) as dias_ausencia,
                SUM(dias_laborables) as dias_laborables')
            ->get()
            ->keyBy('user_id');

        $desempeno = DB::table('performance_reviews')
            ->groupBy('user_id')
            ->selectRaw('user_id, AVG(score) as score, MAX(periodo) as ultimo')
            ->get()
            ->keyBy('user_id');

        $clima = DB::table('climate_responses')
            ->groupBy('user_id')
            ->selectRaw('user_id, AVG(satisfaccion) as satisfaccion, AVG(liderazgo) as liderazgo, AVG(enps) as enps')
            ->get()
            ->keyBy('user_id');

        $compensacion = DB::table('compensations')
            ->orderBy('vigente_desde')
            ->get()
            ->groupBy('user_id')
            ->map(fn ($c) => $c->last());

        $bajas = DB::table('terminations')->get()->keyBy('user_id');

        $filas = DB::table('employment_records as e')
            ->join('users as u', 'u.id', '=', 'e.user_id')
            ->leftJoin('users as s', 's.id', '=', 'e.supervisor_id')
            ->leftJoin('puestos as p', 'p.id', '=', 'e.puesto_id')
            ->leftJoin('business_units as b', 'b.id', '=', 'e.business_unit_id')
            ->select([
                'e.user_id', 'e.employee_code', 'e.area', 'e.pais', 'e.ciudad', 'e.nivel',
                'e.tipo_contrato', 'e.modalidad', 'e.genero', 'e.fecha_ingreso', 'e.fecha_salida',
                'e.estado', 'e.supervisor_id',
                'u.display_name as nombre', 'u.email',
                's.display_name as supervisor_nombre',
                'p.nombre as puesto',
                'b.nombre as business_unit',
            ])
            ->get();

        $this->roster = $filas->map(function ($r) use ($asistencia, $desempeno, $clima, $compensacion, $bajas, $hoy) {
            $a = $asistencia->get($r->user_id);
            $d = $desempeno->get($r->user_id);
            $c = $clima->get($r->user_id);
            $comp = $compensacion->get($r->user_id);
            $baja = $bajas->get($r->user_id);

            $ingreso = Carbon::parse($r->fecha_ingreso);
            $corte = $r->fecha_salida ? Carbon::parse($r->fecha_salida) : $hoy;

            $r->antiguedad_meses = (int) $ingreso->diffInMonths($corte);
            $r->horas_extra_prom = $a ? round((float) $a->horas_extra_prom, 1) : 0.0;
            $r->ausentismo_pct = ($a && $a->dias_laborables > 0)
                ? round($a->dias_ausencia / $a->dias_laborables * 100, 2)
                : 0.0;
            $r->desempeno = $d ? round((float) $d->score, 1) : null;
            $r->clima_satisfaccion = $c ? round((float) $c->satisfaccion, 2) : null;
            $r->clima_liderazgo = $c ? round((float) $c->liderazgo, 2) : null;
            $r->enps_individual = $c ? round((float) $c->enps, 1) : null;
            $r->salario = $comp ? (float) $comp->salario_base : null;
            $r->esquema = $comp->esquema ?? null;
            $r->meses_sin_aumento = $comp
                ? (int) Carbon::parse($comp->vigente_desde)->diffInMonths($hoy)
                : null;
            $r->tipo = $baja->tipo ?? null;
            $r->motivo = $baja->motivo ?? null;
            $r->es_lamentable = $baja->es_lamentable ?? null;

            // Pre-computed buckets so grouping never re-derives them
            $r->bucket_antiguedad = $this->bucketAntiguedad($r->antiguedad_meses);
            $r->bucket_salario = $this->bucketSalario($r->salario);
            $r->bucket_desempeno = $this->bucketDesempeno($r->desempeno);
            $r->bucket_clima = $this->bucketClima($r->clima_satisfaccion);
            $r->bucket_ausentismo = $this->bucketAusentismo($r->ausentismo_pct);
            $r->bucket_horas_extra = $this->bucketHorasExtra($r->horas_extra_prom);

            return $r;
        });

        return $this->roster;
    }

    // ────────────────────────────────────────────────────────────────
    // Helpers
    // ────────────────────────────────────────────────────────────────

    private function bajasEnVentana(Collection $roster): Collection
    {
        $limite = Carbon::now()->subMonths(self::MESES_VENTANA);

        return $roster->filter(fn ($p) => $p->fecha_salida
            && Carbon::parse($p->fecha_salida)->gte($limite));
    }

    private function headcountPromedio(int $activos, int $bajas): float
    {
        return max(1, $activos + $bajas / 2);
    }

    private function pct(int $parte, float $total): float
    {
        return $total > 0 ? round($parte / $total * 100, 2) : 0.0;
    }

    private function enps(Collection $activos): ?int
    {
        $valores = $activos->pluck('enps_individual')->filter()->values();

        if ($valores->isEmpty()) {
            return null;
        }

        $promotores = $valores->filter(fn ($v) => $v >= 9)->count();
        $detractores = $valores->filter(fn ($v) => $v <= 6)->count();

        return (int) round(($promotores - $detractores) / $valores->count() * 100);
    }

    /** Rough replacement cost: 3 monthly salaries per exit. Demo heuristic. */
    private function costoEstimadoRotacion(Collection $bajas): float
    {
        return round($bajas->sum(fn ($p) => ($p->salario ?? 0) * 3), 2);
    }

    private function llaveDimension(string $dimension): string
    {
        return match ($dimension) {
            'supervisor' => 'supervisor_nombre',
            'antiguedad' => 'bucket_antiguedad',
            'rango_salarial' => 'bucket_salario',
            'desempeno' => 'bucket_desempeno',
            'clima' => 'bucket_clima',
            'ausentismo' => 'bucket_ausentismo',
            'horas_extra' => 'bucket_horas_extra',
            'business_unit' => 'business_unit',
            default => $dimension,
        };
    }

    private function bucketAntiguedad(?int $meses): string
    {
        return match (true) {
            $meses === null => 'Sin dato',
            $meses < 6 => '0-6 meses',
            $meses < 12 => '6-12 meses',
            $meses < 24 => '1-2 años',
            $meses < 60 => '2-5 años',
            default => '5+ años',
        };
    }

    private function bucketSalario(?float $salario): string
    {
        return match (true) {
            $salario === null => 'Sin dato',
            $salario < 600 => 'Hasta 600',
            $salario < 900 => '600 - 900',
            $salario < 1500 => '900 - 1.500',
            $salario < 2500 => '1.500 - 2.500',
            default => '2.500+',
        };
    }

    private function bucketDesempeno(?float $score): string
    {
        return match (true) {
            $score === null => 'Sin evaluar',
            $score < 50 => 'Bajo',
            $score < 65 => 'En desarrollo',
            $score < 80 => 'Cumple',
            $score < 92 => 'Supera',
            default => 'Destacado',
        };
    }

    private function bucketClima(?float $satisfaccion): string
    {
        return match (true) {
            $satisfaccion === null => 'Sin encuesta',
            $satisfaccion < 2.5 => 'Crítico',
            $satisfaccion < 3.5 => 'Bajo',
            $satisfaccion < 4.5 => 'Bueno',
            default => 'Alto',
        };
    }

    private function bucketAusentismo(float $pct): string
    {
        return match (true) {
            $pct < 1 => 'Sin ausentismo',
            $pct < 3 => 'Bajo (<3%)',
            $pct < 6 => 'Medio (3-6%)',
            default => 'Alto (6%+)',
        };
    }

    private function bucketHorasExtra(float $horas): string
    {
        return match (true) {
            $horas < 1 => 'Sin horas extra',
            $horas < 10 => 'Hasta 10 h/mes',
            $horas < 25 => '10 - 25 h/mes',
            default => '25+ h/mes',
        };
    }

    private function percentil(array $valores, float $p): float
    {
        if (empty($valores)) {
            return 0.0;
        }

        sort($valores);
        $indice = (int) floor($p * (count($valores) - 1));

        return (float) $valores[$indice];
    }
}
