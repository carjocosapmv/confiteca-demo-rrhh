<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\RotacionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RotacionController extends Controller
{
    public function __construct(private readonly RotacionService $rotacion) {}

    /** Everything the dashboard needs for its first paint, in one round trip. */
    public function dashboard(Request $request): JsonResponse
    {
        $dimension = $request->string('dimension', 'area')->toString();

        if (! array_key_exists($dimension, $this->rotacion->dimensiones())) {
            $dimension = 'area';
        }

        return response()->json([
            'data' => [
                'resumen' => $this->rotacion->resumen(),
                'tendencia' => $this->rotacion->tendencia((int) $request->integer('meses', 24)),
                'dimension' => $this->rotacion->porDimension($dimension),
                'motivos' => $this->rotacion->motivos(),
                'riesgo' => $this->rotacion->riesgo((int) $request->integer('riesgo_limite', 20)),
                'catalogos' => $this->rotacion->catalogos(),
            ],
        ]);
    }

    public function dimension(Request $request, string $dimension): JsonResponse
    {
        if (! array_key_exists($dimension, $this->rotacion->dimensiones())) {
            return response()->json(['message' => 'Dimensión no soportada.'], 422);
        }

        return response()->json(['data' => $this->rotacion->porDimension($dimension)]);
    }

    public function colaboradores(Request $request): JsonResponse
    {
        $filtros = $request->only(['estado', 'area', 'pais', 'tipo_contrato', 'nivel', 'business_unit', 'buscar']);

        return response()->json(['data' => $this->rotacion->colaboradores($filtros)]);
    }

    public function riesgo(Request $request): JsonResponse
    {
        return response()->json(['data' => $this->rotacion->riesgo((int) $request->integer('limite', 20))]);
    }
}
