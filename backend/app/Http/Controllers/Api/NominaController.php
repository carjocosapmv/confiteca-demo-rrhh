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

    /**
     * Autoservicio: el desglose del usuario AUTENTICADO y de nadie más.
     *
     * Esta es la única ruta de nómina abierta a todos los roles, y lo es porque
     * no recibe a quién consultar: el identificador sale de la sesión. No hay
     * parámetro que aceptar ni validar, que es exactamente el punto — mientras
     * `detalle()` vive detrás de `permission:nomina` porque cualquiera de sus
     * respuestas es el sueldo de otra persona, acá el peor caso posible es que
     * alguien lea el suyo.
     */
    public function miNomina(Request $request): JsonResponse
    {
        $periodo = $this->resolverPeriodo($request);
        $detalle = $this->nomina->detalle($request->user()->id, $periodo);

        if ($detalle === null) {
            return response()->json([
                'message' => 'No hay una compensación registrada a tu nombre para el período solicitado. '
                    .'Comunícate con Talento Humano si crees que es un error.',
            ], 404);
        }

        return response()->json([
            'data' => $detalle,
            'meta' => [
                'periodo' => $periodo,
                // Solo etiquetas de mes: no revelan datos de otros colaboradores.
                'periodos' => $this->nomina->periodosDisponibles(),
                'supuestos' => $this->nomina->supuestos(),
            ],
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
