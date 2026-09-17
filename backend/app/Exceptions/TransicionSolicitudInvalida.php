<?php

namespace App\Exceptions;

use DomainException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Se intentó resolver una solicitud que ya estaba resuelta.
 *
 * Es un 409 y no un 422: el payload es válido, lo que está en conflicto es el
 * estado del recurso. El caso real que cubre es mundano pero frecuente —dos
 * personas de Talento Humano abriendo la misma bandeja, o un doble clic sobre
 * el botón de aprobar— y la consecuencia de no cubrirlo sería pisar la
 * respuesta y el autor de una resolución anterior.
 */
class TransicionSolicitudInvalida extends DomainException
{
    public function __construct(
        public readonly string $desde,
        public readonly string $hacia,
    ) {
        parent::__construct(
            "La solicitud ya fue resuelta como \"{$desde}\" y no puede pasar a \"{$hacia}\". "
            .'Solo las solicitudes pendientes admiten aprobación o rechazo.'
        );
    }

    public function codigoHttp(): int
    {
        return 409;
    }

    /** Laravel usa este método para convertir la excepción en respuesta. */
    public function render(Request $request): JsonResponse
    {
        return response()->json([
            'message' => $this->getMessage(),
            'estado_actual' => $this->desde,
        ], $this->codigoHttp());
    }
}
