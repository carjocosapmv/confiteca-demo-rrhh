<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Nomina\NominaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Nómina — endpoints de cálculo (solo lectura).
 *
 * Nothing here writes. Every response is a projection computed on demand from
 * existing compensation and commission data, using UNCONFIRMED reference
 * rates. The `supuestos` payload travels with every response precisely so the
 * client cannot render a figure without its disclaimer.
 */
class NominaController extends Controller
{
    public function __construct(private readonly NominaService $nomina) {}

    /** Everything the module needs for its first paint, in one round trip. */
    public function dashboard(Request $request): JsonResponse
    {
        $periodo = $this->resolverPeriodo($request);

        return response()->json([
            'data' => [
                'periodo' => $periodo,
                'resumen' => $this->nomina->resumen($periodo),
                'colaboradores' => $this->nomina->colaboradores($periodo),
                'catalogos' => $this->nomina->catalogos($periodo),
                'supuestos' => $this->nomina->supuestos(),
            ],
        ]);
    }

    public function colaboradores(Request $request): JsonResponse
    {
        $periodo = $this->resolverPeriodo($request);
        $filtros = $request->only(['area', 'esquema', 'tipo_contrato', 'buscar']);

        return response()->json([
            'data' => $this->nomina->colaboradores($periodo, $filtros),
            'meta' => ['periodo' => $periodo],
        ]);
    }

    public function detalle(Request $request, string $userId): JsonResponse
    {
        $periodo = $this->resolverPeriodo($request);
        $detalle = $this->nomina->detalle($userId, $periodo);

        if ($detalle === null) {
            return response()->json([
                'message' => 'El colaborador no tiene compensación registrada para el período solicitado.',
            ], 404);
        }

        return response()->json([
            'data' => $detalle,
            'meta' => ['periodo' => $periodo, 'supuestos' => $this->nomina->supuestos()],
        ]);
    }

    /** Assumptions and disclaimers, standalone. */
    public function supuestos(): JsonResponse
    {
        return response()->json(['data' => $this->nomina->supuestos()]);
    }

    private function resolverPeriodo(Request $request): string
    {
        $periodo = $request->string('periodo')->toString();

        return $this->nomina->esPeriodoValido($periodo)
            ? $periodo
            : $this->nomina->periodoPorDefecto();
    }
}
