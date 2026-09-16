<?php

namespace App\Support;

/**
 * Single source of truth for the Confiteca demo organizational structure.
 *
 * Seeders, catalog endpoints and analytics all read from here so the demo
 * never shows an area in one screen that does not exist in another.
 */
final class ConfitecaOrg
{
    /** Business units: codigo => [nombre, descripcion] */
    public const EMPRESAS = [
        'PLANTA' => ['Planta', 'Planta de producción de confitería'],
        'VENTAS' => ['Ventas de Campo', 'Fuerza de ventas y trade marketing'],
        'DIST' => ['Distribución', 'Transporte, reparto y bodega de producto terminado'],
        'ADMIN' => ['Administración', 'Administración, finanzas y soporte corporativo'],
        'DISP' => ['Dispensario Médico', 'Servicio médico y salud ocupacional'],
    ];

    /** Areas grouped by business unit code */
    public const AREAS_POR_EMPRESA = [
        'PLANTA' => [
            'Producción Chocolates',
            'Producción Caramelos',
            'Producción Galletas',
            'Empaque',
            'Mantenimiento',
            'Control de Calidad',
            'Bodega Materia Prima',
        ],
        'VENTAS' => [
            'Ventas Autoservicios',
            'Ventas Detalle',
            'Ventas Mayoreo',
            'Trade Marketing',
            'Televentas',
        ],
        'DIST' => [
            'Transporte Primario',
            'Reparto Urbano',
            'Bodega Producto Terminado',
            'Planificación de Rutas',
        ],
        'ADMIN' => [
            'Contabilidad',
            'Talento Humano',
            'Tecnología',
            'Compras',
            'Cartera y Cobranzas',
            'Gerencia General',
        ],
        'DISP' => [
            'Dispensario Médico',
            'Seguridad y Salud Ocupacional',
        ],
    ];

    /** Countries where the demo company operates */
    public const PAISES = ['Ecuador', 'Colombia', 'Perú'];

    /** Cities by country */
    public const CIUDADES = [
        'Ecuador' => ['Quito', 'Guayaquil', 'Cuenca', 'Ambato', 'Manta'],
        'Colombia' => ['Bogotá', 'Medellín', 'Cali'],
        'Perú' => ['Lima', 'Arequipa'],
    ];

    public const TIPOS_CONTRATO = ['indefinido', 'plazo_fijo', 'temporal', 'aprendizaje'];

    public const MODALIDADES = ['presencial', 'hibrido', 'campo'];

    /**
     * Positions catalogue.
     *
     * peso = relative hiring weight, drives the demo headcount distribution.
     * esquema = fijo | fijo_variable | comision (drives the payroll slice).
     */
    public const PUESTOS = [
        // ── Planta ──
        'Operario de Producción' => ['bu' => 'PLANTA', 'areas' => ['Producción Chocolates', 'Producción Caramelos', 'Producción Galletas'], 'nivel' => 'operativo', 'min' => 470, 'max' => 640, 'esquema' => 'fijo', 'peso' => 14],
        'Empacador' => ['bu' => 'PLANTA', 'areas' => ['Empaque'], 'nivel' => 'operativo', 'min' => 460, 'max' => 570, 'esquema' => 'fijo', 'peso' => 9],
        'Supervisor de Línea' => ['bu' => 'PLANTA', 'areas' => ['Producción Chocolates', 'Producción Caramelos', 'Producción Galletas', 'Empaque'], 'nivel' => 'supervisor', 'min' => 900, 'max' => 1350, 'esquema' => 'fijo_variable', 'peso' => 3],
        'Técnico de Mantenimiento' => ['bu' => 'PLANTA', 'areas' => ['Mantenimiento'], 'nivel' => 'tecnico', 'min' => 750, 'max' => 1150, 'esquema' => 'fijo', 'peso' => 3],
        'Analista de Calidad' => ['bu' => 'PLANTA', 'areas' => ['Control de Calidad'], 'nivel' => 'analista', 'min' => 800, 'max' => 1250, 'esquema' => 'fijo', 'peso' => 2],
        'Bodeguero' => ['bu' => 'PLANTA', 'areas' => ['Bodega Materia Prima'], 'nivel' => 'operativo', 'min' => 520, 'max' => 720, 'esquema' => 'fijo', 'peso' => 3],
        'Jefe de Planta' => ['bu' => 'PLANTA', 'areas' => ['Producción Chocolates'], 'nivel' => 'jefatura', 'min' => 2200, 'max' => 3200, 'esquema' => 'fijo_variable', 'peso' => 0.4],

        // ── Ventas de Campo ──
        'Vendedor' => ['bu' => 'VENTAS', 'areas' => ['Ventas Detalle', 'Ventas Autoservicios', 'Ventas Mayoreo'], 'nivel' => 'operativo', 'min' => 470, 'max' => 720, 'esquema' => 'comision', 'peso' => 12],
        'Mercaderista' => ['bu' => 'VENTAS', 'areas' => ['Trade Marketing'], 'nivel' => 'operativo', 'min' => 460, 'max' => 610, 'esquema' => 'fijo_variable', 'peso' => 4],
        'Televendedor' => ['bu' => 'VENTAS', 'areas' => ['Televentas'], 'nivel' => 'operativo', 'min' => 470, 'max' => 660, 'esquema' => 'comision', 'peso' => 3],
        'Supervisor de Ventas' => ['bu' => 'VENTAS', 'areas' => ['Ventas Detalle', 'Ventas Autoservicios', 'Ventas Mayoreo'], 'nivel' => 'supervisor', 'min' => 1100, 'max' => 1750, 'esquema' => 'comision', 'peso' => 2],
        'Jefe de Ventas' => ['bu' => 'VENTAS', 'areas' => ['Ventas Mayoreo'], 'nivel' => 'jefatura', 'min' => 2400, 'max' => 3600, 'esquema' => 'comision', 'peso' => 0.4],

        // ── Distribución ──
        'Chofer' => ['bu' => 'DIST', 'areas' => ['Transporte Primario', 'Reparto Urbano'], 'nivel' => 'operativo', 'min' => 600, 'max' => 880, 'esquema' => 'fijo', 'peso' => 4],
        'Auxiliar de Reparto' => ['bu' => 'DIST', 'areas' => ['Reparto Urbano'], 'nivel' => 'operativo', 'min' => 470, 'max' => 620, 'esquema' => 'fijo_variable', 'peso' => 5],
        'Planificador de Rutas' => ['bu' => 'DIST', 'areas' => ['Planificación de Rutas'], 'nivel' => 'analista', 'min' => 900, 'max' => 1450, 'esquema' => 'fijo', 'peso' => 1],
        'Jefe de Bodega' => ['bu' => 'DIST', 'areas' => ['Bodega Producto Terminado'], 'nivel' => 'jefatura', 'min' => 1500, 'max' => 2250, 'esquema' => 'fijo', 'peso' => 0.5],

        // ── Administración ──
        'Analista Contable' => ['bu' => 'ADMIN', 'areas' => ['Contabilidad'], 'nivel' => 'analista', 'min' => 900, 'max' => 1450, 'esquema' => 'fijo', 'peso' => 2],
        'Contador General' => ['bu' => 'ADMIN', 'areas' => ['Contabilidad'], 'nivel' => 'jefatura', 'min' => 2000, 'max' => 2900, 'esquema' => 'fijo', 'peso' => 0.3],
        'Analista de Talento Humano' => ['bu' => 'ADMIN', 'areas' => ['Talento Humano'], 'nivel' => 'analista', 'min' => 900, 'max' => 1450, 'esquema' => 'fijo', 'peso' => 1.5],
        'Jefe de Talento Humano' => ['bu' => 'ADMIN', 'areas' => ['Talento Humano'], 'nivel' => 'jefatura', 'min' => 2300, 'max' => 3400, 'esquema' => 'fijo_variable', 'peso' => 0.3],
        'Analista de TI' => ['bu' => 'ADMIN', 'areas' => ['Tecnología'], 'nivel' => 'analista', 'min' => 1100, 'max' => 1850, 'esquema' => 'fijo', 'peso' => 1.5],
        'Comprador' => ['bu' => 'ADMIN', 'areas' => ['Compras'], 'nivel' => 'analista', 'min' => 950, 'max' => 1550, 'esquema' => 'fijo', 'peso' => 1],
        'Analista de Cartera' => ['bu' => 'ADMIN', 'areas' => ['Cartera y Cobranzas'], 'nivel' => 'analista', 'min' => 900, 'max' => 1450, 'esquema' => 'fijo_variable', 'peso' => 1.5],
        'Gerente General' => ['bu' => 'ADMIN', 'areas' => ['Gerencia General'], 'nivel' => 'direccion', 'min' => 5000, 'max' => 7000, 'esquema' => 'fijo_variable', 'peso' => 0.2],

        // ── Dispensario ──
        'Médico Ocupacional' => ['bu' => 'DISP', 'areas' => ['Dispensario Médico'], 'nivel' => 'profesional', 'min' => 1800, 'max' => 2600, 'esquema' => 'fijo', 'peso' => 0.5],
        'Enfermera' => ['bu' => 'DISP', 'areas' => ['Dispensario Médico'], 'nivel' => 'tecnico', 'min' => 800, 'max' => 1250, 'esquema' => 'fijo', 'peso' => 0.7],
        'Técnico en Seguridad Industrial' => ['bu' => 'DISP', 'areas' => ['Seguridad y Salud Ocupacional'], 'nivel' => 'tecnico', 'min' => 900, 'max' => 1450, 'esquema' => 'fijo', 'peso' => 0.8],
    ];

    /** Exit reasons: motivo => [tipo, es_lamentable] */
    public const MOTIVOS_SALIDA = [
        'Mejor oferta salarial' => ['voluntaria', true],
        'Crecimiento profesional' => ['voluntaria', true],
        'Clima laboral / jefatura' => ['voluntaria', true],
        'Motivos personales / familiares' => ['voluntaria', false],
        'Cambio de ciudad' => ['voluntaria', false],
        'Estudios' => ['voluntaria', false],
        'Bajo desempeño' => ['involuntaria', false],
        'Reestructuración de área' => ['involuntaria', false],
        'Incumplimiento de reglamento' => ['involuntaria', false],
        'Fin de contrato temporal' => ['involuntaria', false],
    ];

    /** Banks used for the payroll TXT demo */
    public const BANCOS = ['Banco Pichincha', 'Banco Guayaquil', 'Produbanco', 'Banco del Pacífico'];

    /** Flat list of every area */
    public static function areas(): array
    {
        $out = [];
        foreach (self::AREAS_POR_EMPRESA as $areas) {
            foreach ($areas as $a) {
                $out[] = $a;
            }
        }
        sort($out);

        return $out;
    }

    /** Flat list of business unit display names */
    public static function empresas(): array
    {
        return array_map(fn ($e) => $e[0], array_values(self::EMPRESAS));
    }

    /** Positions filtered by business unit code */
    public static function puestosPorBu(string $bu): array
    {
        return array_filter(self::PUESTOS, fn ($p) => $p['bu'] === $bu);
    }

    public static function empresaCodePorArea(string $area): ?string
    {
        foreach (self::AREAS_POR_EMPRESA as $code => $areas) {
            if (in_array($area, $areas, true)) {
                return $code;
            }
        }

        return null;
    }
}
