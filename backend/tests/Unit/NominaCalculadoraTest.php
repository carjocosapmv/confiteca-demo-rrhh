<?php

namespace Tests\Unit;

use App\Services\Nomina\NominaCalculadora;
use App\Services\Nomina\TarifasNomina;
use PHPUnit\Framework\TestCase;

/**
 * The payroll maths is the only part of the nómina slice with real correctness
 * risk, so it lives in a pure calculator with no database and is pinned here
 * against hand-computed expectations.
 *
 * Every rate used below is an ESTIMATE pending client/accountant confirmation.
 * These tests pin the ARITHMETIC, not the legal accuracy of the rates.
 */
class NominaCalculadoraTest extends TestCase
{
    private const TARIFAS_BASE = [
        'iess_personal_pct' => 9.45,
        'iess_patronal_pct' => 11.15,
        'iess_patronal_rango' => [11.15, 12.15],
        'sbu' => 482.00,
        'fondos_reserva_pct' => 8.33,
        'fondos_reserva_meses_minimos' => 12,
        'anio_referencia' => 2026,
        'confirmado' => false,
    ];

    private function calculadora(array $overrides = []): NominaCalculadora
    {
        return new NominaCalculadora(
            TarifasNomina::desdeArray(array_merge(self::TARIFAS_BASE, $overrides))
        );
    }

    // ── Sueldo fijo, sin comisiones ────────────────────────────────

    public function test_sueldo_fijo_calcula_aportes_neto_y_provisiones(): void
    {
        $r = $this->calculadora()->calcular(
            salarioBase: 1000.00,
            comisiones: [],
            variableObjetivo: 0.0,
            mesesAntiguedad: 24,
        );

        $this->assertSame(1000.00, $r['salario_base']);
        $this->assertSame(0.00, $r['total_comisiones']);
        $this->assertSame(1000.00, $r['total_ingresos']);

        // 1000 * 9.45%
        $this->assertSame(94.50, $r['iess_personal']);
        $this->assertSame(905.50, $r['neto_a_pagar']);

        // Employer cost, informational — never deducted from net.
        $this->assertSame(111.50, $r['iess_patronal']);

        $this->assertSame(83.33, $r['provision_decimo_tercero']);  // 1000 / 12
        $this->assertSame(40.17, $r['provision_decimo_cuarto']);   // 482 / 12
        $this->assertSame(83.30, $r['provision_fondos_reserva']);  // 1000 * 8.33%
        $this->assertTrue($r['fondos_reserva_aplica']);

        // 1000 + 111.50 + 83.33 + 40.17 + 83.30
        $this->assertSame(1318.30, $r['costo_total_empleador']);
    }

    // ── Las 4 comisiones suman al ingreso bruto ────────────────────

    public function test_las_cuatro_comisiones_suman_al_ingreso_bruto(): void
    {
        $r = $this->calculadora()->calcular(
            salarioBase: 800.00,
            comisiones: [
                'cumplimiento_cuota' => 150.25,
                'cobranza' => 42.10,
                'nuevos_clientes' => 78.00,
                'mix_producto' => 29.65,
            ],
            variableObjetivo: 0.0,
            mesesAntiguedad: 6,
        );

        $this->assertSame(300.00, $r['total_comisiones']);
        $this->assertSame(1100.00, $r['total_ingresos']);
        $this->assertSame(103.95, $r['iess_personal']);   // 1100 * 9.45%
        $this->assertSame(996.05, $r['neto_a_pagar']);
        $this->assertSame(122.65, $r['iess_patronal']);   // 1100 * 11.15%
        $this->assertSame(91.67, $r['provision_decimo_tercero']); // 1100 / 12
    }

    public function test_siempre_expone_los_cuatro_conceptos_en_orden_fijo(): void
    {
        $r = $this->calculadora()->calcular(
            salarioBase: 500.00,
            comisiones: ['cobranza' => 10.00],
        );

        $this->assertSame(
            ['cumplimiento_cuota', 'cobranza', 'nuevos_clientes', 'mix_producto'],
            array_column($r['comisiones'], 'concepto'),
        );
        // Conceptos ausentes se reportan en 0, no se omiten.
        $this->assertSame([0.00, 10.00, 0.00, 0.00], array_column($r['comisiones'], 'monto'));
    }

    public function test_ignora_conceptos_de_comision_desconocidos(): void
    {
        $r = $this->calculadora()->calcular(
            salarioBase: 500.00,
            comisiones: ['cobranza' => 10.00, 'concepto_inventado' => 999.00],
        );

        $this->assertSame(10.00, $r['total_comisiones']);
        $this->assertCount(4, $r['comisiones']);
    }

    // ── Fondos de reserva: elegibilidad por antigüedad ─────────────

    public function test_fondos_de_reserva_no_aplican_antes_del_mes_13(): void
    {
        $r = $this->calculadora()->calcular(salarioBase: 600.00, mesesAntiguedad: 11);

        $this->assertFalse($r['fondos_reserva_aplica']);
        $this->assertSame(0.00, $r['provision_fondos_reserva']);
    }

    public function test_fondos_de_reserva_aplican_al_cumplir_doce_meses(): void
    {
        $r = $this->calculadora()->calcular(salarioBase: 600.00, mesesAntiguedad: 12);

        $this->assertTrue($r['fondos_reserva_aplica']);
        $this->assertSame(49.98, $r['provision_fondos_reserva']); // 600 * 8.33%
    }

    public function test_sin_antiguedad_conocida_no_asume_elegibilidad(): void
    {
        $r = $this->calculadora()->calcular(salarioBase: 600.00, mesesAntiguedad: null);

        $this->assertFalse($r['fondos_reserva_aplica']);
        $this->assertSame(0.00, $r['provision_fondos_reserva']);
    }

    // ── Variable objetivo es contexto, no ingreso ──────────────────

    public function test_variable_objetivo_no_se_suma_al_bruto_y_reporta_cumplimiento(): void
    {
        $r = $this->calculadora()->calcular(
            salarioBase: 1000.00,
            comisiones: ['cumplimiento_cuota' => 250.00],
            variableObjetivo: 500.00,
            mesesAntiguedad: 24,
        );

        // El objetivo es una meta, no dinero devengado: el bruto es base + comisiones.
        $this->assertSame(1250.00, $r['total_ingresos']);
        $this->assertSame(500.00, $r['variable_objetivo']);
        $this->assertSame(50.0, $r['cumplimiento_variable_pct']); // 250 / 500
    }

    public function test_sin_variable_objetivo_el_cumplimiento_es_nulo(): void
    {
        $r = $this->calculadora()->calcular(salarioBase: 1000.00, variableObjetivo: 0.0);

        $this->assertNull($r['cumplimiento_variable_pct']);
    }

    // ── Las tarifas vienen de una sola fuente ──────────────────────

    public function test_las_tarifas_provienen_de_la_configuracion_inyectada(): void
    {
        $r = $this->calculadora([
            'iess_personal_pct' => 10.00,
            'iess_patronal_pct' => 12.15,
            'sbu' => 600.00,
        ])->calcular(salarioBase: 1000.00, mesesAntiguedad: 24);

        $this->assertSame(100.00, $r['iess_personal']);
        $this->assertSame(900.00, $r['neto_a_pagar']);
        $this->assertSame(121.50, $r['iess_patronal']);
        $this->assertSame(50.00, $r['provision_decimo_cuarto']); // 600 / 12
    }

    public function test_marca_los_supuestos_como_no_confirmados(): void
    {
        $tarifas = TarifasNomina::desdeArray(self::TARIFAS_BASE);

        $this->assertFalse($tarifas->confirmado);
        $this->assertSame([11.15, 12.15], $tarifas->iessPatronalRango);
    }

    public function test_rechaza_salario_base_negativo(): void
    {
        $this->expectException(\InvalidArgumentException::class);

        $this->calculadora()->calcular(salarioBase: -1.00);
    }
}
