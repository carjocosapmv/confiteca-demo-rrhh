<?php

namespace App\Services\Nomina;

use InvalidArgumentException;

/**
 * Immutable snapshot of the payroll rates defined in config/payroll.php.
 *
 * Exists so the calculator depends on a validated value object instead of
 * reaching into the config helper: that keeps the maths pure and unit-testable
 * without booting the framework, and makes "where do these numbers come from"
 * a single, obvious answer.
 */
final class TarifasNomina
{
    /** @param array{0:float,1:float} $iessPatronalRango */
    public function __construct(
        public readonly float $iessPersonalPct,
        public readonly float $iessPatronalPct,
        public readonly array $iessPatronalRango,
        public readonly float $sbu,
        public readonly float $fondosReservaPct,
        public readonly int $fondosReservaMesesMinimos,
        public readonly int $anioReferencia,
        public readonly bool $confirmado,
    ) {
        foreach (['iessPersonalPct' => $iessPersonalPct, 'iessPatronalPct' => $iessPatronalPct, 'fondosReservaPct' => $fondosReservaPct] as $nombre => $valor) {
            if ($valor < 0 || $valor > 100) {
                throw new InvalidArgumentException("La tarifa {$nombre} debe estar entre 0 y 100.");
            }
        }

        if ($sbu <= 0) {
            throw new InvalidArgumentException('El SBU debe ser mayor a cero.');
        }
    }

    public static function desdeArray(array $config): self
    {
        return new self(
            iessPersonalPct: (float) ($config['iess_personal_pct'] ?? 0),
            iessPatronalPct: (float) ($config['iess_patronal_pct'] ?? 0),
            iessPatronalRango: array_map('floatval', $config['iess_patronal_rango'] ?? [0.0, 0.0]),
            sbu: (float) ($config['sbu'] ?? 0),
            fondosReservaPct: (float) ($config['fondos_reserva_pct'] ?? 0),
            fondosReservaMesesMinimos: (int) ($config['fondos_reserva_meses_minimos'] ?? 12),
            anioReferencia: (int) ($config['anio_referencia'] ?? 0),
            confirmado: (bool) ($config['confirmado'] ?? false),
        );
    }

    /** True when the employer rate is ambiguous across public sources. */
    public function patronalEsAmbiguo(): bool
    {
        return count($this->iessPatronalRango) === 2
            && $this->iessPatronalRango[0] !== $this->iessPatronalRango[1];
    }

    /** Shape consumed by the UI to render the assumptions/disclaimer panel. */
    public function aArray(): array
    {
        return [
            'iess_personal_pct' => $this->iessPersonalPct,
            'iess_patronal_pct' => $this->iessPatronalPct,
            'iess_patronal_rango' => $this->iessPatronalRango,
            'iess_patronal_ambiguo' => $this->patronalEsAmbiguo(),
            'sbu' => $this->sbu,
            'fondos_reserva_pct' => $this->fondosReservaPct,
            'fondos_reserva_meses_minimos' => $this->fondosReservaMesesMinimos,
            'anio_referencia' => $this->anioReferencia,
            'confirmado' => $this->confirmado,
        ];
    }
}
