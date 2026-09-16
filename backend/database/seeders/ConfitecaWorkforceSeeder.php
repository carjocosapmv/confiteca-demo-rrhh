<?php

namespace Database\Seeders;

use App\Models\AttendanceMonth;
use App\Models\BankAccount;
use App\Models\BusinessUnit;
use App\Models\ClimateResponse;
use App\Models\Compensation;
use App\Models\EmploymentRecord;
use App\Models\PerformanceReview;
use App\Models\Puesto;
use App\Models\Termination;
use App\Models\User;
use App\Models\UserRelationship;
use App\Models\UserRole;
use App\Models\VacationBalance;
use App\Support\ConfitecaOrg;
use App\Support\DemoNames;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * Master workforce seeder for the Confiteca demo.
 *
 * Generates a synthetic but internally coherent workforce: ~320 people, 36 months
 * of history, hierarchy, salaries, attendance, performance, climate and exits.
 *
 * Determinism: the random stream is seeded with a fixed value, so a given
 * calendar day always produces the same dataset. The calendar anchor is the real
 * "today" on purpose — a sales demo must always look current.
 *
 * The data is not noise: it encodes a story the rotation dashboard is meant to
 * surface (two problem supervisors, a high-attrition production line, temporary
 * contracts churning, and field sales bleeding people).
 */
class ConfitecaWorkforceSeeder extends Seeder
{
    private const SEED = 20260916;

    private const TOTAL_HEADCOUNT = 320;

    private const MESES_HISTORIA = 36;

    private const PASSWORD = 'demo123';

    private Carbon $hoy;

    private Carbon $inicioHistoria;

    /** @var array<string,string> business unit code => id */
    private array $empresas = [];

    /** @var array<string,string> puesto name => id */
    private array $puestos = [];

    /** @var array<int,array<string,mixed>> */
    private array $personas = [];

    /** @var array<int,string> user ids of supervisors flagged as problem bosses */
    private array $jefesProblema = [];

    public function run(): void
    {
        mt_srand(self::SEED);

        $this->hoy = Carbon::now()->startOfDay();
        $this->inicioHistoria = $this->hoy->copy()->startOfMonth()->subMonths(self::MESES_HISTORIA - 1);

        $this->command->info('  · Catálogos (empresas y puestos)...');
        $this->seedCatalogos();

        $this->command->info('  · Personas y estructura...');
        $this->seedPersonas();

        $this->command->info('  · Jerarquía...');
        $this->seedJerarquia();

        $this->command->info('  · Historia mensual (asistencia, horas extra, salidas)...');
        $this->simularHistoria();

        $this->command->info('  · Desempeño y clima...');
        $this->seedDesempenoYClima();

        $this->command->info('  · Saldos de vacaciones...');
        $this->seedSaldosVacaciones();

        $activos = EmploymentRecord::where('estado', 'activo')->count();
        $bajas = Termination::count();
        $this->command->info("  ✓ {$activos} activos · {$bajas} bajas en ".self::MESES_HISTORIA.' meses');
    }

    // ────────────────────────────────────────────────────────────────
    // Catálogos
    // ────────────────────────────────────────────────────────────────

    private function seedCatalogos(): void
    {
        foreach (ConfitecaOrg::EMPRESAS as $codigo => [$nombre, $descripcion]) {
            $this->empresas[$codigo] = BusinessUnit::firstOrCreate(
                ['codigo' => $codigo],
                ['nombre' => $nombre, 'descripcion' => $descripcion, 'activo' => true]
            )->id;
        }

        foreach (ConfitecaOrg::PUESTOS as $nombre => $cfg) {
            $this->puestos[$nombre] = Puesto::firstOrCreate(
                ['nombre' => $nombre],
                ['descripcion' => $cfg['areas'][0].' — nivel '.$cfg['nivel']]
            )->id;
        }
    }

    // ────────────────────────────────────────────────────────────────
    // Personas
    // ────────────────────────────────────────────────────────────────

    /**
     * Named accounts used to run the demo. Everything else is generated.
     *
     * @return array<int,array{email:string,nombre:string,puesto:string,role:string,antiguedad_meses:int}>
     */
    private function cuentasDemo(): array
    {
        return [
            ['email' => 'admin@confiteca.com', 'nombre' => 'Administrador Demo', 'puesto' => 'Analista de TI', 'role' => 'superadmin', 'antiguedad_meses' => 70],
            ['email' => 'gerencia@confiteca.com', 'nombre' => 'Gerencia General', 'puesto' => 'Gerente General', 'role' => 'admin', 'antiguedad_meses' => 96],
            ['email' => 'th@confiteca.com', 'nombre' => 'Jefatura de Talento Humano', 'puesto' => 'Jefe de Talento Humano', 'role' => 'admin', 'antiguedad_meses' => 62],
            ['email' => 'jefe.planta@confiteca.com', 'nombre' => 'Jefatura de Planta', 'puesto' => 'Jefe de Planta', 'role' => 'admin', 'antiguedad_meses' => 58],
            ['email' => 'jefe.ventas@confiteca.com', 'nombre' => 'Jefatura de Ventas', 'puesto' => 'Jefe de Ventas', 'role' => 'admin', 'antiguedad_meses' => 44],
            ['email' => 'jefe.bodega@confiteca.com', 'nombre' => 'Jefatura de Bodega', 'puesto' => 'Jefe de Bodega', 'role' => 'admin', 'antiguedad_meses' => 51],
            ['email' => 'contador@confiteca.com', 'nombre' => 'Contaduría General', 'puesto' => 'Contador General', 'role' => 'admin', 'antiguedad_meses' => 66],
            ['email' => 'medico@confiteca.com', 'nombre' => 'Médico Ocupacional', 'puesto' => 'Médico Ocupacional', 'role' => 'user', 'antiguedad_meses' => 33],
            ['email' => 'supervisor@confiteca.com', 'nombre' => 'Supervisión de Línea', 'puesto' => 'Supervisor de Línea', 'role' => 'user', 'antiguedad_meses' => 29],
            ['email' => 'vendedor@confiteca.com', 'nombre' => 'Vendedor Demo', 'puesto' => 'Vendedor', 'role' => 'user', 'antiguedad_meses' => 21],
            ['email' => 'colaborador@confiteca.com', 'nombre' => 'Colaborador Demo', 'puesto' => 'Operario de Producción', 'role' => 'user', 'antiguedad_meses' => 14],
        ];
    }

    private function seedPersonas(): void
    {
        $secuencia = 1;

        foreach ($this->cuentasDemo() as $cuenta) {
            $this->crearPersona(
                secuencia: $secuencia++,
                puestoNombre: $cuenta['puesto'],
                email: $cuenta['email'],
                displayName: $cuenta['nombre'],
                role: $cuenta['role'],
                antiguedadMeses: $cuenta['antiguedad_meses'],
                protegido: true,
            );
        }

        $restantes = self::TOTAL_HEADCOUNT - count($this->personas);
        $ruleta = $this->construirRuleta();

        for ($i = 0; $i < $restantes; $i++) {
            $puestoNombre = $this->elegirPonderado($ruleta);
            $this->crearPersona(
                secuencia: $secuencia++,
                puestoNombre: $puestoNombre,
                email: null,
                displayName: null,
                role: 'user',
                antiguedadMeses: null,
                protegido: false,
            );
        }

        $this->persistirPersonas();
        $this->marcarJefesProblema();
    }

    /** Cumulative weight table for position sampling */
    private function construirRuleta(): array
    {
        $ruleta = [];
        $acumulado = 0.0;

        foreach (ConfitecaOrg::PUESTOS as $nombre => $cfg) {
            // Leadership roles are filled by the named demo accounts only.
            if (in_array($cfg['nivel'], ['jefatura', 'direccion'], true)) {
                continue;
            }
            $acumulado += $cfg['peso'];
            $ruleta[] = [$acumulado, $nombre];
        }

        return [$ruleta, $acumulado];
    }

    private function elegirPonderado(array $ruleta): string
    {
        [$tabla, $total] = $ruleta;
        $tiro = mt_rand(0, 100000) / 100000 * $total;

        foreach ($tabla as [$corte, $nombre]) {
            if ($tiro <= $corte) {
                return $nombre;
            }
        }

        return $tabla[array_key_last($tabla)][1];
    }

    private function crearPersona(
        int $secuencia,
        string $puestoNombre,
        ?string $email,
        ?string $displayName,
        string $role,
        ?int $antiguedadMeses,
        bool $protegido,
    ): void {
        $cfg = ConfitecaOrg::PUESTOS[$puestoNombre];

        $genero = mt_rand(0, 100) < 46 ? 'F' : 'M';
        $nombre = $displayName ?? $this->nombreAleatorio($genero);

        $pais = $this->elegirPais();
        $ciudad = ConfitecaOrg::CIUDADES[$pais][mt_rand(0, count(ConfitecaOrg::CIUDADES[$pais]) - 1)];
        $area = $cfg['areas'][mt_rand(0, count($cfg['areas']) - 1)];

        // Tenure: operational roles skew recent, leadership skews long
        $antiguedad = $antiguedadMeses ?? $this->antiguedadPara($cfg['nivel']);
        $fechaIngreso = $this->hoy->copy()->subMonths($antiguedad)->subDays(mt_rand(0, 27));

        $tipoContrato = $this->tipoContratoPara($cfg['nivel'], $antiguedad);
        $modalidad = $this->modalidadPara($cfg['bu'], $cfg['nivel']);

        $salario = $this->salarioPara($cfg, $antiguedad);

        $this->personas[] = [
            'id' => (string) Str::uuid(),
            'secuencia' => $secuencia,
            'email' => $email ?? $this->emailPara($nombre, $secuencia),
            'display_name' => $nombre,
            'role' => $role,
            'protegido' => $protegido,
            'puesto_nombre' => $puestoNombre,
            'cfg' => $cfg,
            'area' => $area,
            'pais' => $pais,
            'ciudad' => $ciudad,
            'genero' => $genero,
            'fecha_nacimiento' => $this->hoy->copy()->subYears(mt_rand(20, 58))->subDays(mt_rand(0, 364)),
            'fecha_ingreso' => $fechaIngreso,
            'tipo_contrato' => $tipoContrato,
            'modalidad' => $modalidad,
            'salario' => $salario,
            'employee_code' => sprintf('CNF-%04d', $secuencia),
            'supervisor_id' => null,
            'fecha_salida' => null,
            'estado' => 'activo',
        ];
    }

    private function nombreAleatorio(string $genero): string
    {
        $pila = $genero === 'F' ? DemoNames::NOMBRES_F : DemoNames::NOMBRES_M;
        $nombre = $pila[mt_rand(0, count($pila) - 1)];
        $ap1 = DemoNames::APELLIDOS[mt_rand(0, count(DemoNames::APELLIDOS) - 1)];
        $ap2 = DemoNames::APELLIDOS[mt_rand(0, count(DemoNames::APELLIDOS) - 1)];

        return "{$nombre} {$ap1} {$ap2}";
    }

    private function emailPara(string $nombre, int $secuencia): string
    {
        $partes = explode(' ', Str::ascii(mb_strtolower($nombre)));
        $slug = preg_replace('/[^a-z]/', '', $partes[0].'.'.($partes[1] ?? 'x'));

        return "{$slug}{$secuencia}@confiteca.com";
    }

    private function elegirPais(): string
    {
        $tiro = mt_rand(1, 100);

        return $tiro <= 78 ? 'Ecuador' : ($tiro <= 92 ? 'Colombia' : 'Perú');
    }

    private function antiguedadPara(string $nivel): int
    {
        return match ($nivel) {
            'operativo' => $this->sesgado(1, 84, 2.1),
            'tecnico', 'analista' => $this->sesgado(2, 110, 1.5),
            'supervisor' => $this->sesgado(8, 130, 1.2),
            'profesional' => $this->sesgado(6, 120, 1.3),
            default => $this->sesgado(12, 150, 1.1),
        };
    }

    /** Draw skewed toward the low end when $potencia > 1 */
    private function sesgado(int $min, int $max, float $potencia): int
    {
        $u = mt_rand(0, 100000) / 100000;

        return (int) round($min + ($max - $min) * pow($u, $potencia));
    }

    private function tipoContratoPara(string $nivel, int $antiguedad): string
    {
        if (in_array($nivel, ['jefatura', 'direccion', 'profesional'], true)) {
            return 'indefinido';
        }

        if ($antiguedad <= 3 && mt_rand(1, 100) <= 55) {
            return mt_rand(1, 100) <= 25 ? 'aprendizaje' : 'temporal';
        }

        if ($antiguedad <= 12) {
            return mt_rand(1, 100) <= 45 ? 'plazo_fijo' : 'indefinido';
        }

        return mt_rand(1, 100) <= 12 ? 'plazo_fijo' : 'indefinido';
    }

    private function modalidadPara(string $bu, string $nivel): string
    {
        if ($bu === 'VENTAS' || $bu === 'DIST') {
            return $nivel === 'operativo' ? 'campo' : 'hibrido';
        }

        if ($bu === 'ADMIN') {
            return mt_rand(1, 100) <= 35 ? 'hibrido' : 'presencial';
        }

        return 'presencial';
    }

    /** Salary inside the band, rewarded by tenure, with real dispersion */
    private function salarioPara(array $cfg, int $antiguedad): float
    {
        $rango = $cfg['max'] - $cfg['min'];
        $porAntiguedad = min(1.0, $antiguedad / 72) * 0.55;
        $ruido = (mt_rand(0, 100000) / 100000) * 0.45;
        $posicion = min(1.0, $porAntiguedad + $ruido);

        return round($cfg['min'] + $rango * $posicion, 2);
    }

    private function persistirPersonas(): void
    {
        $ahora = now();
        $hash = Hash::make(self::PASSWORD);

        $usuarios = [];
        $roles = [];
        $empleos = [];
        $compensaciones = [];
        $cuentas = [];

        foreach ($this->personas as $p) {
            $buId = $this->empresas[$p['cfg']['bu']];

            $usuarios[] = [
                'id' => $p['id'],
                'email' => $p['email'],
                'password' => $hash,
                'display_name' => $p['display_name'],
                'hire_date' => $p['fecha_ingreso']->format('Y-m-d'),
                'is_financial_admin' => $p['role'] === 'superadmin',
                'security_watermark_enabled' => false,
                'business_unit_id' => $buId,
                'puesto_id' => $this->puestos[$p['puesto_nombre']],
                'created_at' => $ahora,
                'updated_at' => $ahora,
            ];

            $roles[] = [
                'id' => (string) Str::uuid(),
                'user_id' => $p['id'],
                'role' => $p['role'],
                'created_at' => $ahora,
                'updated_at' => $ahora,
            ];

            $empleos[] = [
                'id' => (string) Str::uuid(),
                'user_id' => $p['id'],
                'employee_code' => $p['employee_code'],
                'cedula' => $this->cedulaFalsa($p['secuencia']),
                'pais' => $p['pais'],
                'ciudad' => $p['ciudad'],
                'area' => $p['area'],
                'business_unit_id' => $buId,
                'puesto_id' => $this->puestos[$p['puesto_nombre']],
                'supervisor_id' => null,
                'nivel' => $p['cfg']['nivel'],
                'tipo_contrato' => $p['tipo_contrato'],
                'modalidad' => $p['modalidad'],
                'genero' => $p['genero'],
                'fecha_nacimiento' => $p['fecha_nacimiento']->format('Y-m-d'),
                'fecha_ingreso' => $p['fecha_ingreso']->format('Y-m-d'),
                'fecha_salida' => null,
                'estado' => 'activo',
                'created_at' => $ahora,
                'updated_at' => $ahora,
            ];

            // Entry salary plus an annual adjustment history
            $salarioIngreso = round($p['salario'] / (1 + 0.04 * min(5, intdiv($p['fecha_ingreso']->diffInMonths($this->hoy), 12))), 2);
            $compensaciones[] = [
                'id' => (string) Str::uuid(),
                'user_id' => $p['id'],
                'vigente_desde' => $p['fecha_ingreso']->format('Y-m-d'),
                'salario_base' => $salarioIngreso,
                'variable_objetivo' => $p['cfg']['esquema'] === 'fijo' ? 0 : round($salarioIngreso * (mt_rand(15, 45) / 100), 2),
                'esquema' => $p['cfg']['esquema'],
                'moneda' => 'USD',
                'motivo' => 'ingreso',
                'created_at' => $ahora,
                'updated_at' => $ahora,
            ];

            $aniosCompletos = intdiv($p['fecha_ingreso']->diffInMonths($this->hoy), 12);
            for ($a = 1; $a <= min(5, $aniosCompletos); $a++) {
                $fecha = $p['fecha_ingreso']->copy()->addYears($a);
                $salarioAnio = round($salarioIngreso * pow(1.04, $a), 2);
                $compensaciones[] = [
                    'id' => (string) Str::uuid(),
                    'user_id' => $p['id'],
                    'vigente_desde' => $fecha->format('Y-m-d'),
                    'salario_base' => $salarioAnio,
                    'variable_objetivo' => $p['cfg']['esquema'] === 'fijo' ? 0 : round($salarioAnio * (mt_rand(15, 45) / 100), 2),
                    'esquema' => $p['cfg']['esquema'],
                    'moneda' => 'USD',
                    'motivo' => $a === 3 ? 'promocion' : 'ajuste_anual',
                    'created_at' => $ahora,
                    'updated_at' => $ahora,
                ];
            }

            $banco = ConfitecaOrg::BANCOS[mt_rand(0, count(ConfitecaOrg::BANCOS) - 1)];
            $cuentas[] = [
                'id' => (string) Str::uuid(),
                'user_id' => $p['id'],
                'banco' => $banco,
                'numero_cuenta' => (string) mt_rand(2000000000, 4999999999),
                'tipo_cuenta' => mt_rand(1, 100) <= 80 ? 'ahorros' : 'corriente',
                'created_at' => $ahora,
                'updated_at' => $ahora,
            ];
        }

        foreach (array_chunk($usuarios, 100) as $chunk) {
            DB::table('users')->insert($chunk);
        }
        foreach (array_chunk($roles, 200) as $chunk) {
            DB::table('user_roles')->insert($chunk);
        }
        foreach (array_chunk($empleos, 100) as $chunk) {
            DB::table('employment_records')->insert($chunk);
        }
        foreach (array_chunk($compensaciones, 200) as $chunk) {
            DB::table('compensations')->insert($chunk);
        }
        foreach (array_chunk($cuentas, 200) as $chunk) {
            DB::table('bank_accounts')->insert($chunk);
        }
    }

    private function cedulaFalsa(int $secuencia): string
    {
        return sprintf('17%08d', 10000000 + $secuencia * 7919 % 89999999);
    }

    // ────────────────────────────────────────────────────────────────
    // Jerarquía
    // ────────────────────────────────────────────────────────────────

    private function seedJerarquia(): void
    {
        $gerente = $this->buscarPorEmail('gerencia@confiteca.com');
        $jefeTh = $this->buscarPorEmail('th@confiteca.com');

        $jefaturaPorBu = [];
        $supervisoresPorBu = [];

        foreach ($this->personas as $i => $p) {
            $bu = $p['cfg']['bu'];
            if (in_array($p['cfg']['nivel'], ['jefatura'], true)) {
                $jefaturaPorBu[$bu] = $p['id'];
            }
            if ($p['cfg']['nivel'] === 'supervisor') {
                $supervisoresPorBu[$bu][] = $p['id'];
            }
        }

        // Business units with no named jefatura report to the general manager
        $relaciones = [];
        $updates = [];

        foreach ($this->personas as $i => $p) {
            $bu = $p['cfg']['bu'];
            $nivel = $p['cfg']['nivel'];

            $supervisorId = match (true) {
                $nivel === 'direccion' => null,
                $nivel === 'jefatura' => $gerente['id'],
                $nivel === 'supervisor' => $jefaturaPorBu[$bu] ?? $gerente['id'],
                default => $this->supervisorParaColaborador($bu, $supervisoresPorBu, $jefaturaPorBu, $gerente['id'], $i),
            };

            $this->personas[$i]['supervisor_id'] = $supervisorId;

            if ($supervisorId) {
                $updates[] = ['user_id' => $p['id'], 'supervisor_id' => $supervisorId];
            }

            $relaciones[] = [
                'id' => (string) Str::uuid(),
                'user_id' => $p['id'],
                'supervisor_id' => $supervisorId,
                'authorizer_id' => $jefeTh['id'],
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        foreach (array_chunk($relaciones, 200) as $chunk) {
            DB::table('user_relationships')->insert($chunk);
        }

        foreach ($updates as $u) {
            DB::table('employment_records')
                ->where('user_id', $u['user_id'])
                ->update(['supervisor_id' => $u['supervisor_id']]);
        }
    }

    private function supervisorParaColaborador(string $bu, array $supervisoresPorBu, array $jefaturaPorBu, string $gerenteId, int $indice): ?string
    {
        $candidatos = $supervisoresPorBu[$bu] ?? [];

        if (empty($candidatos)) {
            return $jefaturaPorBu[$bu] ?? $gerenteId;
        }

        return $candidatos[$indice % count($candidatos)];
    }

    private function buscarPorEmail(string $email): array
    {
        foreach ($this->personas as $p) {
            if ($p['email'] === $email) {
                return $p;
            }
        }

        throw new \RuntimeException("Demo account not found: {$email}");
    }

    /**
     * Plant the narrative: two supervisors whose teams bleed people.
     * Without a deliberate signal the dashboard has nothing to reveal.
     */
    private function marcarJefesProblema(): void
    {
        $supervisores = array_values(array_filter(
            $this->personas,
            fn ($p) => $p['cfg']['nivel'] === 'supervisor'
        ));

        if (count($supervisores) < 2) {
            return;
        }

        $planta = array_values(array_filter($supervisores, fn ($p) => $p['cfg']['bu'] === 'PLANTA'));
        $ventas = array_values(array_filter($supervisores, fn ($p) => $p['cfg']['bu'] === 'VENTAS'));

        if ($planta) {
            $this->jefesProblema[] = $planta[0]['id'];
        }
        if ($ventas) {
            $this->jefesProblema[] = $ventas[0]['id'];
        }
    }

    // ────────────────────────────────────────────────────────────────
    // Historia mensual
    // ────────────────────────────────────────────────────────────────

    private function simularHistoria(): void
    {
        $asistencias = [];
        $bajas = [];
        $ahora = now();

        foreach ($this->personas as $i => $p) {
            $ingreso = $p['fecha_ingreso'];
            $cursor = $ingreso->copy()->startOfMonth();
            if ($cursor->lt($this->inicioHistoria)) {
                $cursor = $this->inicioHistoria->copy();
            }

            $fin = $this->hoy->copy()->startOfMonth();
            $fechaSalida = null;

            // First pass: decide the exit month, if any
            $probe = $cursor->copy();
            while ($probe->lte($fin)) {
                $antiguedadMeses = $ingreso->diffInMonths($probe);
                $riesgo = $this->riesgoMensual($p, $antiguedadMeses);

                if (mt_rand(0, 100000) / 100000 < $riesgo && ! $p['protegido']) {
                    $fechaSalida = $probe->copy()->addDays(mt_rand(0, 27));
                    if ($fechaSalida->gt($this->hoy)) {
                        $fechaSalida = null;
                    }
                    break;
                }
                $probe->addMonth();
            }

            $ultimoMes = $fechaSalida ? $fechaSalida->copy()->startOfMonth() : $fin;

            // Second pass: attendance for every month actually worked
            $mes = $cursor->copy();
            while ($mes->lte($ultimoMes)) {
                $mesesParaSalir = $fechaSalida ? $mes->diffInMonths($fechaSalida->copy()->startOfMonth(), false) : 99;
                $asistencias[] = $this->filaAsistencia($p, $mes, $mesesParaSalir, $ahora);
                $mes->addMonth();
            }

            if ($fechaSalida) {
                $this->personas[$i]['fecha_salida'] = $fechaSalida;
                $this->personas[$i]['estado'] = 'inactivo';
                $bajas[] = $this->filaBaja($p, $fechaSalida, $ahora);
            }
        }

        foreach (array_chunk($asistencias, 500) as $chunk) {
            DB::table('attendance_months')->insert($chunk);
        }
        foreach (array_chunk($bajas, 200) as $chunk) {
            DB::table('terminations')->insert($chunk);
        }

        foreach ($this->personas as $p) {
            if ($p['estado'] === 'inactivo') {
                DB::table('employment_records')->where('user_id', $p['id'])->update([
                    'estado' => 'inactivo',
                    'fecha_salida' => $p['fecha_salida']->format('Y-m-d'),
                ]);
            }
        }
    }

    /** Monthly exit hazard. This is where the story is encoded. */
    private function riesgoMensual(array $p, int $antiguedadMeses): float
    {
        $riesgo = 0.010;

        $riesgo *= match ($p['cfg']['nivel']) {
            'operativo' => 1.6,
            'tecnico', 'analista' => 0.8,
            'supervisor' => 0.6,
            'profesional' => 0.5,
            default => 0.25,
        };

        $riesgo *= match ($p['tipo_contrato']) {
            'temporal' => 2.2,
            'aprendizaje' => 1.8,
            'plazo_fijo' => 1.3,
            default => 1.0,
        };

        $riesgo *= match (true) {
            $antiguedadMeses <= 3 => 2.0,
            $antiguedadMeses <= 12 => 1.4,
            $antiguedadMeses <= 36 => 0.9,
            default => 0.5,
        };

        if (in_array($p['supervisor_id'], $this->jefesProblema, true)) {
            $riesgo *= 2.4;
        }

        if ($p['area'] === 'Producción Caramelos') {
            $riesgo *= 1.5;
        }

        if ($p['cfg']['bu'] === 'VENTAS' && $p['cfg']['nivel'] === 'operativo') {
            $riesgo *= 1.35;
        }

        // Paid below the midpoint of the band
        $medio = ($p['cfg']['min'] + $p['cfg']['max']) / 2;
        if ($p['salario'] < $medio) {
            $riesgo *= 1.3;
        }

        return min(0.12, $riesgo);
    }

    private function filaAsistencia(array $p, Carbon $mes, int $mesesParaSalir, Carbon $ahora): array
    {
        $bu = $p['cfg']['bu'];
        $nivel = $p['cfg']['nivel'];

        $baseExtra = match (true) {
            $bu === 'PLANTA' && $nivel === 'operativo' => mt_rand(8, 34),
            $bu === 'DIST' => mt_rand(6, 30),
            $bu === 'VENTAS' => mt_rand(0, 14),
            default => mt_rand(0, 8),
        };

        if (in_array($p['supervisor_id'], $this->jefesProblema, true)) {
            $baseExtra = (int) round($baseExtra * 1.6);
        }

        $ausenciaJust = mt_rand(0, 100) <= 22 ? mt_rand(1, 3) : 0;
        $ausenciaInjust = mt_rand(0, 100) <= 9 ? 1 : 0;

        // Disengagement is visible before the exit: absenteeism climbs
        if ($mesesParaSalir >= 0 && $mesesParaSalir <= 3) {
            $ausenciaInjust += mt_rand(0, 2);
            $ausenciaJust += mt_rand(0, 1);
        }

        return [
            'id' => (string) Str::uuid(),
            'user_id' => $p['id'],
            'periodo' => $mes->format('Y-m'),
            'dias_laborables' => 22,
            'dias_ausencia_justificada' => $ausenciaJust,
            'dias_ausencia_injustificada' => $ausenciaInjust,
            'horas_extra' => $baseExtra,
            'atrasos_minutos' => mt_rand(0, 100) <= 40 ? mt_rand(5, 95) : 0,
            'created_at' => $ahora,
            'updated_at' => $ahora,
        ];
    }

    private function filaBaja(array $p, Carbon $fecha, Carbon $ahora): array
    {
        $motivos = ConfitecaOrg::MOTIVOS_SALIDA;

        // Problem bosses and low pay push voluntary, regrettable exits
        $sesgoVoluntario = in_array($p['supervisor_id'], $this->jefesProblema, true) ? 82 : 62;
        if ($p['tipo_contrato'] === 'temporal') {
            $sesgoVoluntario = 25;
        }

        $esVoluntaria = mt_rand(1, 100) <= $sesgoVoluntario;
        $candidatos = array_keys(array_filter(
            $motivos,
            fn ($m) => $m[0] === ($esVoluntaria ? 'voluntaria' : 'involuntaria')
        ));

        if (in_array($p['supervisor_id'], $this->jefesProblema, true) && $esVoluntaria && mt_rand(1, 100) <= 55) {
            $motivo = 'Clima laboral / jefatura';
        } else {
            $motivo = $candidatos[mt_rand(0, count($candidatos) - 1)];
        }

        return [
            'id' => (string) Str::uuid(),
            'user_id' => $p['id'],
            'fecha' => $fecha->format('Y-m-d'),
            'tipo' => $motivos[$motivo][0],
            'motivo' => $motivo,
            'es_lamentable' => $motivos[$motivo][1],
            'comentario_entrevista' => null,
            'created_at' => $ahora,
            'updated_at' => $ahora,
        ];
    }

    // ────────────────────────────────────────────────────────────────
    // Desempeño y clima
    // ────────────────────────────────────────────────────────────────

    private function periodosSemestrales(): array
    {
        $periodos = [];
        $cursor = $this->inicioHistoria->copy();

        while ($cursor->lte($this->hoy)) {
            $semestre = $cursor->month <= 6 ? 'S1' : 'S2';
            $clave = $cursor->year.'-'.$semestre;
            $periodos[$clave] = $cursor->month <= 6
                ? Carbon::create($cursor->year, 6, 30)
                : Carbon::create($cursor->year, 12, 31);
            $cursor->addMonths(6);
        }

        return $periodos;
    }

    private function seedDesempenoYClima(): void
    {
        $evaluaciones = [];
        $clima = [];
        $ahora = now();

        foreach ($this->periodosSemestrales() as $periodo => $cierre) {
            foreach ($this->personas as $p) {
                // Only people employed at the close of the period are evaluated
                if ($p['fecha_ingreso']->gt($cierre)) {
                    continue;
                }
                if ($p['fecha_salida'] && $p['fecha_salida']->lt($cierre)) {
                    continue;
                }
                if ($cierre->gt($this->hoy)) {
                    continue;
                }

                $score = $this->scoreDesempeno($p);
                $evaluaciones[] = [
                    'id' => (string) Str::uuid(),
                    'user_id' => $p['id'],
                    'periodo' => $periodo,
                    'score' => $score,
                    'calificacion' => $this->calificacionPara($score),
                    'potencial' => round(max(10, min(100, $score + mt_rand(-18, 18))), 2),
                    'nine_box' => null,
                    'created_at' => $ahora,
                    'updated_at' => $ahora,
                ];

                // Climate is a sample, not a census
                if (mt_rand(1, 100) <= 72) {
                    $clima[] = $this->filaClima($p, $periodo, $ahora);
                }
            }
        }

        foreach (array_chunk($evaluaciones, 500) as $chunk) {
            DB::table('performance_reviews')->insert($chunk);
        }
        foreach (array_chunk($clima, 500) as $chunk) {
            DB::table('climate_responses')->insert($chunk);
        }
    }

    private function scoreDesempeno(array $p): float
    {
        $base = 62 + mt_rand(0, 28);

        if (in_array($p['cfg']['nivel'], ['jefatura', 'direccion', 'profesional'], true)) {
            $base += 6;
        }

        // People who end up leaving involuntarily were underperforming
        if ($p['fecha_salida'] && mt_rand(1, 100) <= 35) {
            $base -= mt_rand(10, 25);
        }

        return round(max(20, min(100, $base)), 2);
    }

    private function calificacionPara(float $score): string
    {
        return match (true) {
            $score < 50 => 'bajo',
            $score < 65 => 'en_desarrollo',
            $score < 80 => 'cumple',
            $score < 92 => 'supera',
            default => 'destacado',
        };
    }

    private function filaClima(array $p, string $periodo, Carbon $ahora): array
    {
        $malJefe = in_array($p['supervisor_id'], $this->jefesProblema, true);

        $liderazgo = $malJefe
            ? round(mt_rand(120, 260) / 100, 2)
            : round(mt_rand(300, 490) / 100, 2);

        $satisfaccion = $malJefe
            ? round(mt_rand(140, 300) / 100, 2)
            : round(mt_rand(290, 480) / 100, 2);

        $enps = $malJefe ? mt_rand(0, 6) : mt_rand(5, 10);

        $carga = match ($p['cfg']['bu']) {
            'PLANTA', 'DIST' => round(mt_rand(320, 490) / 100, 2),
            default => round(mt_rand(200, 420) / 100, 2),
        };

        return [
            'id' => (string) Str::uuid(),
            'user_id' => $p['id'],
            'periodo' => $periodo,
            'enps' => $enps,
            'satisfaccion' => $satisfaccion,
            'liderazgo' => $liderazgo,
            'carga_laboral' => $carga,
            'created_at' => $ahora,
            'updated_at' => $ahora,
        ];
    }

    // ────────────────────────────────────────────────────────────────
    // Saldos de vacaciones (reales, no mockeados)
    // ────────────────────────────────────────────────────────────────

    private function seedSaldosVacaciones(): void
    {
        $filas = [];
        $anio = (int) $this->hoy->format('Y');
        $ahora = now();

        foreach ($this->personas as $p) {
            if ($p['estado'] !== 'activo') {
                continue;
            }

            $mesesTrabajados = min(12, $p['fecha_ingreso']->diffInMonths($this->hoy));
            $total = 15;
            $usados = min($total, mt_rand(0, (int) round($mesesTrabajados * 1.2)));

            $filas[] = [
                'id' => (string) Str::uuid(),
                'user_id' => $p['id'],
                'year' => $anio,
                'total_days' => $total,
                'used_days' => $usados,
                'weekend_rule_uses' => 0,
                'renewal_date' => $p['fecha_ingreso']->copy()->year($anio)->format('Y-m-d'),
                'created_at' => $ahora,
                'updated_at' => $ahora,
            ];
        }

        foreach (array_chunk($filas, 300) as $chunk) {
            DB::table('vacation_balances')->insert($chunk);
        }
    }

    /** Exposed for downstream seeders that need the same in-memory roster */
    public function personas(): array
    {
        return $this->personas;
    }
}
