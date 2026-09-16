<?php

namespace Database\Seeders;

use App\Models\EmploymentRecord;
use App\Support\ConfitecaOrg;
use App\Support\DemoNames;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Operational demo data that later slices consume:
 *  · dispensario médico  → medical_visits
 *  · nómina              → commission_records
 *  · cartera / antifraude → daily_sales + bank_deposits
 *
 * The cartera dataset deliberately contains three sales reps who under-deposit
 * cash in a detectable pattern. Without planted anomalies the antifraud screen
 * has nothing to show.
 */
class ConfitecaOperationsSeeder extends Seeder
{
    private const SEED = 776611;

    /** Months of sales/deposit history (kept short: it is daily granularity) */
    private const MESES_VENTAS = 6;

    private const MESES_COMISIONES = 12;

    public function run(): void
    {
        mt_srand(self::SEED);

        $this->command->info('  · Dispensario médico...');
        $this->seedDispensario();

        $this->command->info('  · Comisiones...');
        $this->seedComisiones();

        $this->command->info('  · Ventas diarias y depósitos bancarios...');
        $this->seedCartera();
    }

    // ────────────────────────────────────────────────────────────────

    private function seedDispensario(): void
    {
        $hoy = Carbon::now()->startOfDay();
        $desde = $hoy->copy()->subMonths(24);

        $medicos = EmploymentRecord::whereIn('nivel', ['profesional', 'tecnico'])
            ->where('area', 'Dispensario Médico')
            ->pluck('user_id')
            ->all();

        $empleados = EmploymentRecord::query()
            ->select('user_id', 'fecha_ingreso', 'fecha_salida', 'area', 'business_unit_id')
            ->get();

        if (empty($medicos)) {
            $medicos = [$empleados->first()->user_id];
        }

        $filas = [];
        $ahora = now();

        foreach ($empleados as $emp) {
            // Plant workers visit the dispensary far more often than office staff
            $esPlanta = str_starts_with($emp->area, 'Producción')
                || in_array($emp->area, ['Empaque', 'Mantenimiento', 'Bodega Materia Prima'], true);

            $visitas = $esPlanta ? mt_rand(0, 9) : mt_rand(0, 4);

            for ($i = 0; $i < $visitas; $i++) {
                $fecha = $desde->copy()->addDays(mt_rand(0, $desde->diffInDays($hoy)));

                if ($fecha->lt(Carbon::parse($emp->fecha_ingreso))) {
                    continue;
                }
                if ($emp->fecha_salida && $fecha->gt(Carbon::parse($emp->fecha_salida))) {
                    continue;
                }

                $relacionado = $esPlanta && mt_rand(1, 100) <= 30;
                $motivo = $relacionado
                    ? DemoNames::MOTIVOS_CONSULTA_LABORAL[mt_rand(0, count(DemoNames::MOTIVOS_CONSULTA_LABORAL) - 1)]
                    : DemoNames::MOTIVOS_CONSULTA[mt_rand(0, count(DemoNames::MOTIVOS_CONSULTA) - 1)];

                $tipo = match (true) {
                    $relacionado && mt_rand(1, 100) <= 35 => 'emergencia',
                    mt_rand(1, 100) <= 18 => 'control',
                    mt_rand(1, 100) <= 12 => 'ocupacional',
                    default => 'consulta',
                };

                $reposo = match (true) {
                    $tipo === 'emergencia' => mt_rand(0, 5),
                    mt_rand(1, 100) <= 22 => mt_rand(1, 3),
                    default => 0,
                };

                $filas[] = [
                    'id' => (string) Str::uuid(),
                    'user_id' => $emp->user_id,
                    'atendido_por' => $medicos[mt_rand(0, count($medicos) - 1)],
                    'fecha' => $fecha->format('Y-m-d'),
                    'tipo' => $tipo,
                    'motivo' => $motivo,
                    'diagnostico' => $motivo,
                    'cie10' => DemoNames::CIE10[$motivo] ?? null,
                    'reposo_dias' => $reposo,
                    'relacionado_trabajo' => $relacionado,
                    'derivado' => mt_rand(1, 100) <= 9,
                    'observaciones' => null,
                    'created_at' => $ahora,
                    'updated_at' => $ahora,
                ];
            }
        }

        foreach (array_chunk($filas, 500) as $chunk) {
            DB::table('medical_visits')->insert($chunk);
        }

        $this->command->info('    '.count($filas).' atenciones médicas');
    }

    // ────────────────────────────────────────────────────────────────

    private function seedComisiones(): void
    {
        $conceptos = [
            'cumplimiento_cuota' => [3.0, 6.0],
            'cobranza' => [0.5, 2.0],
            'nuevos_clientes' => [1.0, 3.0],
            'mix_producto' => [0.5, 2.5],
        ];

        $variables = DB::table('compensations')
            ->select('user_id', 'esquema', 'salario_base', 'variable_objetivo')
            ->whereIn('esquema', ['comision', 'fijo_variable'])
            ->get()
            ->keyBy('user_id');

        $activos = EmploymentRecord::where('estado', 'activo')->pluck('user_id')->all();

        $filas = [];
        $ahora = now();
        $hoy = Carbon::now()->startOfMonth();

        foreach ($activos as $userId) {
            $comp = $variables->get($userId);
            if (! $comp) {
                continue;
            }

            // Up to four commission components per person — this is the payroll
            // complexity Confiteca called out.
            $misConceptos = array_slice(array_keys($conceptos), 0, $comp->esquema === 'comision' ? mt_rand(2, 4) : mt_rand(1, 2));

            for ($m = self::MESES_COMISIONES - 1; $m >= 0; $m--) {
                $periodo = $hoy->copy()->subMonths($m)->format('Y-m');

                foreach ($misConceptos as $concepto) {
                    [$pMin, $pMax] = $conceptos[$concepto];
                    $porcentaje = round(mt_rand((int) ($pMin * 100), (int) ($pMax * 100)) / 100, 2);
                    $base = round(mt_rand(1500, 28000) + mt_rand(0, 99) / 100, 2);

                    $filas[] = [
                        'id' => (string) Str::uuid(),
                        'user_id' => $userId,
                        'periodo' => $periodo,
                        'concepto' => $concepto,
                        'base_calculo' => $base,
                        'porcentaje' => $porcentaje,
                        'monto' => round($base * $porcentaje / 100, 2),
                        'created_at' => $ahora,
                        'updated_at' => $ahora,
                    ];
                }
            }
        }

        foreach (array_chunk($filas, 500) as $chunk) {
            DB::table('commission_records')->insert($chunk);
        }

        $this->command->info('    '.count($filas).' registros de comisión');
    }

    // ────────────────────────────────────────────────────────────────

    private function seedCartera(): void
    {
        $vendedores = EmploymentRecord::query()
            ->where('estado', 'activo')
            ->whereIn('area', ['Ventas Detalle', 'Ventas Autoservicios', 'Ventas Mayoreo'])
            ->where('nivel', 'operativo')
            ->pluck('user_id')
            ->all();

        if (empty($vendedores)) {
            return;
        }

        // Three reps systematically hold back cash. Two are blatant, one subtle.
        $defraudadores = array_slice($vendedores, 0, min(3, count($vendedores)));
        $perfilFraude = [];
        foreach ($defraudadores as $i => $id) {
            $perfilFraude[$id] = match ($i) {
                0 => ['retencion' => 0.22, 'frecuencia' => 55],  // blatant
                1 => ['retencion' => 0.14, 'frecuencia' => 40],  // moderate
                default => ['retencion' => 0.06, 'frecuencia' => 25], // subtle
            };
        }

        $hoy = Carbon::now()->startOfDay();
        $desde = $hoy->copy()->subMonths(self::MESES_VENTAS)->startOfMonth();

        $ventas = [];
        $depositos = [];
        $ahora = now();

        $cuentas = DB::table('bank_accounts')->pluck('banco', 'user_id');

        foreach ($vendedores as $idx => $vendedorId) {
            $ruta = sprintf('RUTA-%03d', ($idx % 24) + 1);
            $cursor = $desde->copy();

            while ($cursor->lte($hoy)) {
                // Field sales run Monday to Saturday
                if ($cursor->isSunday()) {
                    $cursor->addDay();

                    continue;
                }

                $totalVendido = round(mt_rand(35000, 210000) / 100, 2);
                $porcentajeEfectivo = mt_rand(45, 85) / 100;
                $efectivo = round($totalVendido * $porcentajeEfectivo, 2);
                $transferencia = round($totalVendido * (mt_rand(5, 25) / 100), 2);
                $credito = round(max(0, $totalVendido - $efectivo - $transferencia), 2);

                $ventas[] = [
                    'id' => (string) Str::uuid(),
                    'vendedor_id' => $vendedorId,
                    'fecha' => $cursor->format('Y-m-d'),
                    'ruta' => $ruta,
                    'total_vendido' => $totalVendido,
                    'cobrado_efectivo' => $efectivo,
                    'cobrado_transferencia' => $transferencia,
                    'credito_otorgado' => $credito,
                    'num_facturas' => mt_rand(8, 34),
                    'created_at' => $ahora,
                    'updated_at' => $ahora,
                ];

                // Deposit of the cash collected, normally next business day
                $perfil = $perfilFraude[$vendedorId] ?? null;
                $retiene = $perfil && mt_rand(1, 100) <= $perfil['frecuencia'];
                $factor = $retiene ? (1 - $perfil['retencion'] * (mt_rand(70, 130) / 100)) : (1 - mt_rand(0, 15) / 1000);

                $monto = round(max(0, $efectivo * $factor), 2);

                if ($monto > 0) {
                    $fechaDeposito = $cursor->copy()->addDay();
                    if ($fechaDeposito->isSunday()) {
                        $fechaDeposito->addDay();
                    }
                    if ($fechaDeposito->lte($hoy)) {
                        $depositos[] = [
                            'id' => (string) Str::uuid(),
                            'vendedor_id' => $vendedorId,
                            'fecha_deposito' => $fechaDeposito->format('Y-m-d'),
                            'fecha_venta_referencia' => $cursor->format('Y-m-d'),
                            'banco' => $cuentas[$vendedorId] ?? ConfitecaOrg::BANCOS[0],
                            'numero_documento' => 'DEP-'.mt_rand(100000, 999999),
                            'monto' => $monto,
                            'estado' => 'registrado',
                            'created_at' => $ahora,
                            'updated_at' => $ahora,
                        ];
                    }
                }

                $cursor->addDay();
            }
        }

        foreach (array_chunk($ventas, 500) as $chunk) {
            DB::table('daily_sales')->insert($chunk);
        }
        foreach (array_chunk($depositos, 500) as $chunk) {
            DB::table('bank_deposits')->insert($chunk);
        }

        $this->command->info('    '.count($ventas).' días de venta · '.count($depositos).' depósitos · '.count($defraudadores).' vendedores con patrón anómalo');
    }
}
