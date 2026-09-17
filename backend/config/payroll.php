<?php

/**
 * Nómina Ecuador — SINGLE SOURCE OF TRUTH for every payroll rate.
 *
 * ⚠️  ESTIMATES, NOT COMPLIANCE-GRADE FIGURES.
 *
 * These are public 2026 reference numbers that have NOT been confirmed by the
 * client or their accountant. They live here — and ONLY here — precisely so
 * that correcting them is a one-file edit once real figures arrive. Never
 * inline a payroll rate anywhere else in the codebase.
 *
 * Anything computed from these values must be surfaced in the UI as an
 * estimate ("Estimado — pendiente de confirmación"), never as a legal or
 * accounting result.
 */
return [

    /*
     | IESS — aportación personal (employee), deducted from gross.
     */
    'iess_personal_pct' => (float) env('PAYROLL_IESS_PERSONAL_PCT', 9.45),

    /*
     | IESS — aportación patronal (employer). Informational cost only: it is
     | NEVER deducted from the employee's net pay.
     |
     | Public sources disagree on this rate (11.15% vs 12.15%) depending on how
     | they treat the additional contributions. We use the lower bound as the
     | base and expose the full range so the UI can flag the ambiguity instead
     | of silently presenting one number as fact.
     */
    'iess_patronal_pct' => (float) env('PAYROLL_IESS_PATRONAL_PCT', 11.15),
    'iess_patronal_rango' => [11.15, 12.15],

    /*
     | SBU — salario básico unificado 2026. Drives the décimo cuarto accrual.
     */
    'sbu' => (float) env('PAYROLL_SBU', 482.00),

    /*
     | Fondos de reserva. Accrue only from month 13 of continuous employment,
     | so eligibility is derived from employment_records.fecha_ingreso.
     */
    'fondos_reserva_pct' => (float) env('PAYROLL_FONDOS_RESERVA_PCT', 8.33),
    'fondos_reserva_meses_minimos' => 12,

    /*
     | Reference year for the figures above.
     */
    'anio_referencia' => 2026,

    /*
     | Flip to true ONLY once the client's accountant has signed off on every
     | rate in this file. The API and the UI read this flag to decide whether
     | to show the "pendiente de confirmación" warnings.
     */
    'confirmado' => (bool) env('PAYROLL_TARIFAS_CONFIRMADAS', false),

];
