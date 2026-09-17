<?php

namespace App\Models;

use App\Exceptions\TransicionSolicitudInvalida;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Solicitud genérica del colaborador hacia Talento Humano.
 *
 * DELIBERADAMENTE GENÉRICA. LeaveRequest y VacancyRequest modelan un trámite
 * cada uno, con su propia tabla, su propio controlador y su propia cadena de
 * aprobación; replicar ese patrón para cada pedido nuevo (un certificado, una
 * duda sobre el rol de pago, un cambio de cuenta bancaria) significaría una
 * migración por trámite. Esta tabla absorbe el caso general: tipo + texto libre
 * + una única resolución de Talento Humano.
 *
 * Cuando un tipo de solicitud acumule campos propios, reglas de saldo o más de
 * un aprobador, deja de pertenecer acá y merece su propio módulo.
 */
class EmployeeRequest extends Model
{
    use HasFactory, HasUuids;

    public const TIPO_NOMINA = 'nomina';
    public const TIPO_CERTIFICADO = 'certificado';
    public const TIPO_OTRO = 'otro';

    public const TIPOS = [self::TIPO_NOMINA, self::TIPO_CERTIFICADO, self::TIPO_OTRO];

    public const ESTADO_PENDIENTE = 'pendiente';
    public const ESTADO_APROBADO = 'aprobado';
    public const ESTADO_RECHAZADO = 'rechazado';

    public const ESTADOS = [self::ESTADO_PENDIENTE, self::ESTADO_APROBADO, self::ESTADO_RECHAZADO];

    /**
     * `user_id` NO es asignable en masa desde una petición: el controlador lo
     * toma de la sesión. Está en la lista porque los seeders y las pruebas lo
     * necesitan, pero ninguna ruta pasa el input del cliente a `create()`.
     */
    protected $fillable = [
        'user_id', 'tipo', 'descripcion', 'estado',
        'respuesta_rrhh', 'resuelto_por', 'resuelto_at',
    ];

    protected $attributes = [
        'estado' => self::ESTADO_PENDIENTE,
    ];

    protected $casts = [
        'resuelto_at' => 'datetime',
    ];

    // ── Relaciones ─────────────────────────────────────────────────

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** Quien de Talento Humano resolvió la solicitud. */
    public function resolutor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'resuelto_por');
    }

    // ── Máquina de estados ─────────────────────────────────────────

    public function estaPendiente(): bool
    {
        return $this->estado === self::ESTADO_PENDIENTE;
    }

    public function esDe(string $userId): bool
    {
        return $this->user_id === $userId;
    }

    /** @throws TransicionSolicitudInvalida */
    public function marcarAprobada(string $resolutorId, ?string $respuesta = null): void
    {
        $this->resolver(self::ESTADO_APROBADO, $resolutorId, $respuesta);
    }

    /** @throws TransicionSolicitudInvalida */
    public function marcarRechazada(string $resolutorId, string $respuesta): void
    {
        $this->resolver(self::ESTADO_RECHAZADO, $resolutorId, $respuesta);
    }

    /**
     * Única puerta de salida del estado `pendiente`.
     *
     * El guard corre antes de mutar cualquier atributo para que una transición
     * inválida deje el objeto exactamente como estaba: sin resolución a medias
     * que después alguien tenga que limpiar a mano en la base.
     *
     * @throws TransicionSolicitudInvalida
     */
    private function resolver(string $destino, string $resolutorId, ?string $respuesta): void
    {
        if (! $this->estaPendiente()) {
            throw new TransicionSolicitudInvalida($this->estado, $destino);
        }

        $this->estado = $destino;
        $this->resuelto_por = $resolutorId;
        $this->resuelto_at = now();

        if ($respuesta !== null) {
            $this->respuesta_rrhh = $respuesta;
        }
    }
}
