<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\UserRole;
use App\Services\Nomina\NominaService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * Wiring tests for the nómina projection: the arithmetic itself is pinned in
 * NominaCalculadoraTest, so these cover the parts that only break against a
 * real database — historised compensation, per-period commission grouping,
 * tenure from fecha_ingreso, and the server-side permission gate.
 */
class NominaServiceTest extends TestCase
{
    use RefreshDatabase;

    private function crearColaborador(array $overrides = []): string
    {
        $user = User::create([
            'email' => Str::uuid().'@confiteca.test',
            'password' => 'secret-password',
            'display_name' => $overrides['nombre'] ?? 'Colaborador Prueba',
        ]);

        DB::table('employment_records')->insert([
            'id' => (string) Str::uuid(),
            'user_id' => $user->id,
            'employee_code' => 'EMP-'.Str::random(6),
            'cedula' => '1712345678',
            'pais' => 'Ecuador',
            'ciudad' => 'Quito',
            'area' => $overrides['area'] ?? 'Ventas',
            'nivel' => 'profesional',
            'tipo_contrato' => 'indefinido',
            'modalidad' => 'presencial',
            'genero' => 'F',
            'fecha_nacimiento' => '1990-01-01',
            'fecha_ingreso' => $overrides['fecha_ingreso'] ?? '2020-01-15',
            'estado' => $overrides['estado'] ?? 'activo',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return $user->id;
    }

    private function crearCompensacion(string $userId, string $vigenteDesde, float $salario, float $variable = 0.0): void
    {
        DB::table('compensations')->insert([
            'id' => (string) Str::uuid(),
            'user_id' => $userId,
            'vigente_desde' => $vigenteDesde,
            'salario_base' => $salario,
            'variable_objetivo' => $variable,
            'esquema' => 'fijo_variable',
            'moneda' => 'USD',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function crearComision(string $userId, string $periodo, string $concepto, float $monto): void
    {
        DB::table('commission_records')->insert([
            'id' => (string) Str::uuid(),
            'user_id' => $userId,
            'periodo' => $periodo,
            'concepto' => $concepto,
            'base_calculo' => 0,
            'porcentaje' => 0,
            'monto' => $monto,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function servicio(): NominaService
    {
        return app(NominaService::class);
    }

    // ── Compensación historizada ───────────────────────────────────

    public function test_usa_la_compensacion_vigente_al_cierre_del_periodo(): void
    {
        $userId = $this->crearColaborador();
        $this->crearCompensacion($userId, '2026-01-01', 1000.00);
        $this->crearCompensacion($userId, '2026-06-01', 1500.00); // aumento posterior

        $marzo = $this->servicio()->detalle($userId, '2026-03');
        $this->assertSame(1000.00, $marzo['salario_base']);

        $julio = $this->servicio()->detalle($userId, '2026-07');
        $this->assertSame(1500.00, $julio['salario_base']);
    }

    public function test_ignora_al_colaborador_sin_compensacion_registrada(): void
    {
        $userId = $this->crearColaborador();

        $this->assertNull($this->servicio()->detalle($userId, '2026-03'));
        $this->assertSame([], $this->servicio()->colaboradores('2026-03'));
    }

    public function test_excluye_colaboradores_inactivos(): void
    {
        $userId = $this->crearColaborador(['estado' => 'inactivo']);
        $this->crearCompensacion($userId, '2026-01-01', 1000.00);

        $this->assertSame([], $this->servicio()->colaboradores('2026-03'));
    }

    // ── Comisiones por período ─────────────────────────────────────

    public function test_suma_las_comisiones_del_periodo_e_ignora_las_de_otros(): void
    {
        $userId = $this->crearColaborador();
        $this->crearCompensacion($userId, '2026-01-01', 800.00);

        $this->crearComision($userId, '2026-03', 'cumplimiento_cuota', 150.25);
        $this->crearComision($userId, '2026-03', 'cobranza', 42.10);
        $this->crearComision($userId, '2026-03', 'nuevos_clientes', 78.00);
        $this->crearComision($userId, '2026-03', 'mix_producto', 29.65);
        $this->crearComision($userId, '2026-04', 'cobranza', 9999.00); // otro período

        $r = $this->servicio()->detalle($userId, '2026-03');

        $this->assertSame(300.00, $r['total_comisiones']);
        $this->assertSame(1100.00, $r['total_ingresos']);
        $this->assertSame(103.95, $r['iess_personal']);
        $this->assertSame(996.05, $r['neto_a_pagar']);
    }

    // ── Antigüedad desde fecha_ingreso ─────────────────────────────

    public function test_deriva_la_elegibilidad_de_fondos_de_reserva_desde_fecha_ingreso(): void
    {
        $nuevo = $this->crearColaborador(['fecha_ingreso' => '2026-01-10']);
        $this->crearCompensacion($nuevo, '2026-01-10', 600.00);

        $antiguo = $this->crearColaborador(['fecha_ingreso' => '2020-01-10']);
        $this->crearCompensacion($antiguo, '2020-01-10', 600.00);

        $this->assertFalse($this->servicio()->detalle($nuevo, '2026-03')['fondos_reserva_aplica']);
        $this->assertTrue($this->servicio()->detalle($antiguo, '2026-03')['fondos_reserva_aplica']);
        $this->assertSame(49.98, $this->servicio()->detalle($antiguo, '2026-03')['provision_fondos_reserva']);
    }

    // ── Resumen ────────────────────────────────────────────────────

    public function test_el_resumen_agrega_los_totales_del_periodo(): void
    {
        $a = $this->crearColaborador();
        $this->crearCompensacion($a, '2026-01-01', 1000.00);

        $b = $this->crearColaborador();
        $this->crearCompensacion($b, '2026-01-01', 500.00);

        $resumen = $this->servicio()->resumen('2026-03');

        $this->assertSame(2, $resumen['colaboradores']);
        $this->assertSame(1500.00, $resumen['total_ingresos']);
        $this->assertSame(141.75, $resumen['total_iess_personal']); // 1500 * 9.45%
        $this->assertSame(1358.25, $resumen['total_neto']);
    }

    // ── Supuestos / disclaimers ────────────────────────────────────

    public function test_los_supuestos_advierten_que_las_tarifas_no_estan_confirmadas(): void
    {
        $supuestos = $this->servicio()->supuestos();

        $this->assertFalse($supuestos['tarifas']['confirmado']);
        $this->assertTrue($supuestos['tarifas']['iess_patronal_ambiguo']);
        $this->assertNotEmpty($supuestos['advertencias']);

        $texto = implode(' ', $supuestos['advertencias']);
        $this->assertStringContainsString('estimados', $texto);
        $this->assertStringContainsString('patronal', $texto);
    }

    public function test_valida_el_formato_del_periodo(): void
    {
        $servicio = $this->servicio();

        $this->assertTrue($servicio->esPeriodoValido('2026-03'));
        $this->assertFalse($servicio->esPeriodoValido('2026-13'));
        $this->assertFalse($servicio->esPeriodoValido('marzo'));
        $this->assertFalse($servicio->esPeriodoValido(''));
    }

    // ── Gate de permisos en el servidor ────────────────────────────

    public function test_bloquea_a_quien_no_tiene_el_modulo_nomina(): void
    {
        $user = User::create([
            'email' => 'colaborador@confiteca.test',
            'password' => 'secret-password',
            'display_name' => 'Colaborador',
        ]);
        UserRole::create(['user_id' => $user->id, 'role' => 'user']);

        $this->actingAs($user)
            ->getJson('/api/nomina/dashboard')
            ->assertForbidden();
    }

    public function test_permite_el_acceso_a_superadmin(): void
    {
        $user = User::create([
            'email' => 'super@confiteca.test',
            'password' => 'secret-password',
            'display_name' => 'Super',
        ]);
        UserRole::create(['user_id' => $user->id, 'role' => 'superadmin']);

        $this->actingAs($user)
            ->getJson('/api/nomina/dashboard')
            ->assertOk()
            ->assertJsonStructure(['data' => ['periodo', 'resumen', 'colaboradores', 'catalogos', 'supuestos']]);
    }

    public function test_exige_autenticacion(): void
    {
        $this->getJson('/api/nomina/dashboard')->assertUnauthorized();
    }
}
