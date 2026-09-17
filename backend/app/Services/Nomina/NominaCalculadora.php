<?php

namespace App\Services\Nomina;

use InvalidArgumentException;

/**
 * Pure payroll maths. No database, no framework, no I/O.
 *
 * Everything this class returns is an ESTIMATE built on unconfirmed rates
 * (see config/payroll.php). It is a projection tool for the demo, not a
 * payroll run: nothing here is persisted and nothing here is compliance-grade.
 */
final class NominaCalculadora
{
    /**
     * The four commission components Confiteca called out. These mirror the
     * `concepto` values already stored in `commission_records`.
     */
    public const CONCEPTOS_COMISION = [
        'cumplimiento_cuota',
        'cobranza',
        'nuevos_clientes',
        'mix_producto',
    ];

    public const ETIQUETAS_COMISION = [
        'cumplimiento_cuota' => 'Cumplimiento de cuota',
        'cobranza' => 'Cobranza',
        'nuevos_clientes' => 'Nuevos clientes',
        'mix_producto' => 'Mix de producto',
    ];

    public function __construct(private readonly TarifasNomina $tarifas) {}

    public function tarifas(): TarifasNomina
    {
        return $this->tarifas;
    }

    /**
     * @param  array<string,float>  $comisiones  concepto => monto devengado en el período
     * @param  int|null  $mesesAntiguedad  null cuando no se conoce la fecha de ingreso
     */
    public function calcular(
        float $salarioBase,
        array $comisiones = [],
        float $variableObjetivo = 0.0,
        ?int $mesesAntiguedad = null,
    ): array {
        if ($salarioBase < 0) {
            throw new InvalidArgumentException('El salario base no puede ser negativo.');
        }

        // ── Comisiones ────────────────────────────────────────────
        //
        // PLACEHOLDER — REGLA DE COMBINACIÓN PENDIENTE DE CONFIRMACIÓN.
        //
        // Discovery flagged "4 variables por comisión" as an OPEN QUESTION: the
        // client never defined how the four components combine. Until they do,
        // we treat them as four independent amounts and SUM them. This is the
        // only assumption that does not silently invent business logic — any
        // weighting, capping or tiering would be a fabricated formula presented
        // as final. Do not "improve" this into a made-up formula; replace it
        // once the client provides the real rule.
        $detalle = [];
        $totalComisiones = 0.0;

        foreach (self::CONCEPTOS_COMISION as $concepto) {
            $monto = $this->redondear((float) ($comisiones[$concepto] ?? 0.0));
            $detalle[] = [
                'concepto' => $concepto,
                'etiqueta' => self::ETIQUETAS_COMISION[$concepto],
                'monto' => $monto,
            ];
            $totalComisiones += $monto;
        }

        $totalComisiones = $this->redondear($totalComisiones);

        // ── Ingresos ──────────────────────────────────────────────
        //
        // `variable_objetivo` is a TARGET, not earned money. Adding it to gross
        // would pay everyone their target regardless of performance and would
        // also double-count the commissions that actually realise it. It is
        // reported alongside as context plus an attainment percentage.
        $salarioBase = $this->redondear($salarioBase);
        $totalIngresos = $this->redondear($salarioBase + $totalComisiones);

        // ── Aportes IESS ──────────────────────────────────────────
        $iessPersonal = $this->porcentaje($totalIngresos, $this->tarifas->iessPersonalPct);
        $iessPatronal = $this->porcentaje($totalIngresos, $this->tarifas->iessPatronalPct);

        $netoAPagar = $this->redondear($totalIngresos - $iessPersonal);

        // ── Provisiones (acumulación mensual estimada) ────────────
        $decimoTercero = $this->redondear($totalIngresos / 12);
        $decimoCuarto = $this->redondear($this->tarifas->sbu / 12);

        $fondosAplican = $mesesAntiguedad !== null
            && $mesesAntiguedad >= $this->tarifas->fondosReservaMesesMinimos;

        $fondosReserva = $fondosAplican
            ? $this->porcentaje($totalIngresos, $this->tarifas->fondosReservaPct)
            : 0.00;

        return [
            'salario_base' => $salarioBase,
            'comisiones' => $detalle,
            'total_comisiones' => $totalComisiones,
            'variable_objetivo' => $this->redondear($variableObjetivo),
            'cumplimiento_variable_pct' => $variableObjetivo > 0
                ? $this->redondear($totalComisiones / $variableObjetivo * 100, 1)
                : null,

            'total_ingresos' => $totalIngresos,

            'iess_personal' => $iessPersonal,
            'neto_a_pagar' => $netoAPagar,

            'iess_patronal' => $iessPatronal,

            'provision_decimo_tercero' => $decimoTercero,
            'provision_decimo_cuarto' => $decimoCuarto,
            'provision_fondos_reserva' => $fondosReserva,
            'fondos_reserva_aplica' => $fondosAplican,
            'meses_antiguedad' => $mesesAntiguedad,

            'costo_total_empleador' => $this->redondear(
                $totalIngresos + $iessPatronal + $decimoTercero + $decimoCuarto + $fondosReserva
            ),
        ];
    }

    private function porcentaje(float $monto, float $pct): float
    {
        return $this->redondear($monto * $pct / 100);
    }

    private function redondear(float $valor, int $decimales = 2): float
    {
        return round($valor, $decimales);
    }
}
