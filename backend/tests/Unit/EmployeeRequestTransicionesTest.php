<?php

namespace Tests\Unit;

use App\Exceptions\TransicionSolicitudInvalida;
use App\Models\EmployeeRequest;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

/**
 * Máquina de estados de una solicitud genérica, sin base de datos.
 *
 * Extiende el TestCase de Laravel para tener casts de fecha, pero no toca la
 * base: todas las solicitudes de este archivo viven solo en memoria.
 *
 * El guard se evalúa ANTES de tocar la persistencia a propósito: una solicitud
 * ya resuelta no puede reabrirse ni re-resolverse por una segunda pulsación del
 * botón de aprobar, y esa garantía no debe depender de una transacción.
 */
class EmployeeRequestTransicionesTest extends TestCase
{
    private const RRHH_ID = '11111111-1111-4111-8111-111111111111';

    private function solicitud(string $estado): EmployeeRequest
    {
        $solicitud = new EmployeeRequest([
            'tipo' => EmployeeRequest::TIPO_NOMINA,
            'descripcion' => 'Diferencia en el cálculo de comisiones del período.',
        ]);
        $solicitud->estado = $estado;

        return $solicitud;
    }

    public function test_una_solicitud_nueva_nace_pendiente(): void
    {
        $solicitud = new EmployeeRequest([
            'tipo' => EmployeeRequest::TIPO_OTRO,
            'descripcion' => 'Consulta general.',
        ]);

        $this->assertSame(EmployeeRequest::ESTADO_PENDIENTE, $solicitud->estado);
        $this->assertTrue($solicitud->estaPendiente());
    }

    public function test_pendiente_pasa_a_aprobado(): void
    {
        $solicitud = $this->solicitud(EmployeeRequest::ESTADO_PENDIENTE);

        $solicitud->marcarAprobada(self::RRHH_ID, 'Se corrigió el registro de comisiones.');

        $this->assertSame(EmployeeRequest::ESTADO_APROBADO, $solicitud->estado);
        $this->assertSame(self::RRHH_ID, $solicitud->resuelto_por);
        $this->assertSame('Se corrigió el registro de comisiones.', $solicitud->respuesta_rrhh);
        $this->assertNotNull($solicitud->resuelto_at);
        $this->assertFalse($solicitud->estaPendiente());
    }

    public function test_pendiente_pasa_a_rechazado(): void
    {
        $solicitud = $this->solicitud(EmployeeRequest::ESTADO_PENDIENTE);

        $solicitud->marcarRechazada(self::RRHH_ID, 'El cálculo corresponde al contrato vigente.');

        $this->assertSame(EmployeeRequest::ESTADO_RECHAZADO, $solicitud->estado);
        $this->assertSame('El cálculo corresponde al contrato vigente.', $solicitud->respuesta_rrhh);
        $this->assertNotNull($solicitud->resuelto_at);
    }

    public static function estadosResueltos(): array
    {
        return [
            'aprobada' => [EmployeeRequest::ESTADO_APROBADO],
            'rechazada' => [EmployeeRequest::ESTADO_RECHAZADO],
        ];
    }

    #[DataProvider('estadosResueltos')]
    public function test_una_solicitud_resuelta_no_puede_aprobarse_de_nuevo(string $estado): void
    {
        $solicitud = $this->solicitud($estado);

        $this->expectException(TransicionSolicitudInvalida::class);
        $solicitud->marcarAprobada(self::RRHH_ID);
    }

    #[DataProvider('estadosResueltos')]
    public function test_una_solicitud_resuelta_no_puede_rechazarse_de_nuevo(string $estado): void
    {
        $solicitud = $this->solicitud($estado);

        $this->expectException(TransicionSolicitudInvalida::class);
        $solicitud->marcarRechazada(self::RRHH_ID, 'Motivo tardío.');
    }

    public function test_la_transicion_invalida_no_altera_el_estado_previo(): void
    {
        $solicitud = $this->solicitud(EmployeeRequest::ESTADO_APROBADO);
        $solicitud->respuesta_rrhh = 'Respuesta original.';

        try {
            $solicitud->marcarRechazada(self::RRHH_ID, 'Intento de sobrescritura.');
            $this->fail('Se esperaba una TransicionSolicitudInvalida.');
        } catch (TransicionSolicitudInvalida $e) {
            $this->assertSame(EmployeeRequest::ESTADO_APROBADO, $solicitud->estado);
            $this->assertSame('Respuesta original.', $solicitud->respuesta_rrhh);
            $this->assertSame(409, $e->codigoHttp());
        }
    }
}
