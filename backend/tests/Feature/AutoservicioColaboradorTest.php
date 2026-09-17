<?php

namespace Tests\Feature;

use App\Models\EmployeeRequest;
use App\Models\User;
use App\Models\UserRole;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * Autoservicio del colaborador: "mi nómina" y "mis solicitudes".
 *
 * La propiedad crítica que cubre este archivo es el ACOTAMIENTO AL PROPIO
 * USUARIO. Estos endpoints están abiertos a todos los roles autenticados
 * (a diferencia del módulo de nómina, reservado a admin), así que la única
 * barrera que separa el sueldo de una persona del de su compañero es que el
 * identificador salga SIEMPRE de la sesión y nunca del cliente.
 */
class AutoservicioColaboradorTest extends TestCase
{
    use RefreshDatabase;

    private function colaborador(string $nombre, string $rol = 'user'): User
    {
        $user = User::create([
            'email' => Str::uuid().'@confiteca.test',
            'password' => 'secret-password',
            'display_name' => $nombre,
        ]);
        UserRole::create(['user_id' => $user->id, 'role' => $rol]);

        return $user;
    }

    private function conNomina(User $user, float $salario, string $periodo = '2026-03'): void
    {
        DB::table('employment_records')->insert([
            'id' => (string) Str::uuid(),
            'user_id' => $user->id,
            'employee_code' => 'EMP-'.Str::random(6),
            'cedula' => '1712345678',
            'pais' => 'Ecuador',
            'ciudad' => 'Quito',
            'area' => 'Ventas',
            'nivel' => 'profesional',
            'tipo_contrato' => 'indefinido',
            'modalidad' => 'presencial',
            'genero' => 'F',
            'fecha_nacimiento' => '1990-01-01',
            'fecha_ingreso' => '2020-01-15',
            'estado' => 'activo',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('compensations')->insert([
            'id' => (string) Str::uuid(),
            'user_id' => $user->id,
            'vigente_desde' => '2020-01-15',
            'salario_base' => $salario,
            'variable_objetivo' => 0,
            'esquema' => 'fijo',
            'moneda' => 'USD',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Da existencia al período para periodosDisponibles().
        DB::table('commission_records')->insert([
            'id' => (string) Str::uuid(),
            'user_id' => $user->id,
            'periodo' => $periodo,
            'concepto' => 'cobranza',
            'base_calculo' => 0,
            'porcentaje' => 0,
            'monto' => 0,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    // ── Mi nómina: acotamiento al propio usuario ───────────────────

    public function test_mi_nomina_devuelve_solamente_el_desglose_del_usuario_autenticado(): void
    {
        $ana = $this->colaborador('Ana Torres');
        $beto = $this->colaborador('Beto Salas');
        $this->conNomina($ana, 800.00);
        $this->conNomina($beto, 5000.00);

        $respuesta = $this->actingAs($ana)
            ->getJson('/api/nomina/mi-nomina?periodo=2026-03')
            ->assertOk();

        $respuesta->assertJsonPath('data.user_id', $ana->id);
        $respuesta->assertJsonPath('data.nombre', 'Ana Torres');
        $this->assertSame(800.0, (float) $respuesta->json('data.salario_base'));

        // El sueldo del compañero no aparece por ningún lado del payload.
        $this->assertStringNotContainsString('Beto Salas', $respuesta->getContent());
        $this->assertStringNotContainsString($beto->id, $respuesta->getContent());
        $this->assertStringNotContainsString('5000', $respuesta->getContent());
    }

    /**
     * El endpoint no acepta identificadores del cliente. Se prueban las tres
     * vías por las que un cliente podría intentar imponerlos.
     */
    public function test_mi_nomina_ignora_cualquier_identificador_enviado_por_el_cliente(): void
    {
        $ana = $this->colaborador('Ana Torres');
        $beto = $this->colaborador('Beto Salas');
        $this->conNomina($ana, 800.00);
        $this->conNomina($beto, 5000.00);

        foreach (['user_id', 'userId', 'id'] as $parametro) {
            $respuesta = $this->actingAs($ana)
                ->getJson("/api/nomina/mi-nomina?periodo=2026-03&{$parametro}={$beto->id}")
                ->assertOk();

            $respuesta->assertJsonPath('data.user_id', $ana->id);
            $this->assertSame(800.0, (float) $respuesta->json('data.salario_base'));
        }
    }

    public function test_la_sesion_de_un_colaborador_no_alcanza_la_nomina_de_otro_por_el_endpoint_admin(): void
    {
        $ana = $this->colaborador('Ana Torres');
        $beto = $this->colaborador('Beto Salas');
        $this->conNomina($beto, 5000.00);

        $this->actingAs($ana)->getJson("/api/nomina/colaboradores/{$beto->id}")->assertForbidden();
        $this->actingAs($ana)->getJson('/api/nomina/colaboradores')->assertForbidden();
        $this->actingAs($ana)->getJson('/api/nomina/dashboard')->assertForbidden();
    }

    public function test_mi_nomina_exige_sesion(): void
    {
        $this->getJson('/api/nomina/mi-nomina')->assertUnauthorized();
    }

    public function test_mi_nomina_responde_404_cuando_no_hay_compensacion_registrada(): void
    {
        $sinDatos = $this->colaborador('Sin Compensación');

        $this->actingAs($sinDatos)
            ->getJson('/api/nomina/mi-nomina?periodo=2026-03')
            ->assertNotFound();
    }

    // ── Mis solicitudes: acotamiento al propio usuario ─────────────

    private function crearSolicitud(User $user, string $estado = EmployeeRequest::ESTADO_PENDIENTE): EmployeeRequest
    {
        return EmployeeRequest::create([
            'user_id' => $user->id,
            'tipo' => EmployeeRequest::TIPO_NOMINA,
            'descripcion' => 'Revisión del cálculo de comisiones del período.',
            'estado' => $estado,
        ]);
    }

    public function test_el_listado_propio_no_incluye_solicitudes_ajenas(): void
    {
        $ana = $this->colaborador('Ana Torres');
        $beto = $this->colaborador('Beto Salas');
        $propia = $this->crearSolicitud($ana);
        $ajena = $this->crearSolicitud($beto);

        $respuesta = $this->actingAs($ana)->getJson('/api/solicitudes')->assertOk();

        $respuesta->assertJsonCount(1, 'data');
        $respuesta->assertJsonPath('data.0.id', $propia->id);
        $this->assertStringNotContainsString($ajena->id, $respuesta->getContent());
    }

    public function test_un_colaborador_no_puede_leer_la_solicitud_de_otro(): void
    {
        $ana = $this->colaborador('Ana Torres');
        $beto = $this->colaborador('Beto Salas');
        $ajena = $this->crearSolicitud($beto);

        $this->actingAs($ana)->getJson("/api/solicitudes/{$ajena->id}")->assertForbidden();
    }

    public function test_el_alta_asigna_el_usuario_de_la_sesion_e_ignora_el_del_payload(): void
    {
        $ana = $this->colaborador('Ana Torres');
        $beto = $this->colaborador('Beto Salas');

        $respuesta = $this->actingAs($ana)->postJson('/api/solicitudes', [
            'user_id' => $beto->id, // intento de suplantación
            'tipo' => 'certificado',
            'descripcion' => 'Solicito un certificado laboral con sueldo.',
        ])->assertCreated();

        $respuesta->assertJsonPath('data.user_id', $ana->id);
        $respuesta->assertJsonPath('data.estado', EmployeeRequest::ESTADO_PENDIENTE);
        $this->assertDatabaseCount('employee_requests', 1);
        $this->assertDatabaseHas('employee_requests', ['user_id' => $ana->id]);
    }

    public function test_el_alta_valida_tipo_y_descripcion(): void
    {
        $ana = $this->colaborador('Ana Torres');

        $this->actingAs($ana)
            ->postJson('/api/solicitudes', ['tipo' => 'inventado', 'descripcion' => 'Texto suficientemente largo.'])
            ->assertJsonValidationErrorFor('tipo');

        $this->actingAs($ana)
            ->postJson('/api/solicitudes', ['tipo' => 'otro', 'descripcion' => 'corto'])
            ->assertJsonValidationErrorFor('descripcion');
    }

    // ── Resolución: quién puede actuar ─────────────────────────────

    public function test_un_colaborador_no_puede_resolver_ninguna_solicitud(): void
    {
        $ana = $this->colaborador('Ana Torres');
        $propia = $this->crearSolicitud($ana);

        $this->actingAs($ana)
            ->postJson("/api/solicitudes/{$propia->id}/aprobar", ['respuesta_rrhh' => 'Me apruebo solo.'])
            ->assertForbidden();

        $this->actingAs($ana)->getJson('/api/solicitudes/todas')->assertForbidden();

        $this->assertSame(EmployeeRequest::ESTADO_PENDIENTE, $propia->fresh()->estado);
    }

    public function test_rrhh_aprueba_y_la_solicitud_queda_resuelta(): void
    {
        $ana = $this->colaborador('Ana Torres');
        $rrhh = $this->colaborador('Talento Humano', 'admin');
        $solicitud = $this->crearSolicitud($ana);

        $this->actingAs($rrhh)
            ->postJson("/api/solicitudes/{$solicitud->id}/aprobar", ['respuesta_rrhh' => 'Se corrigió el registro.'])
            ->assertOk()
            ->assertJsonPath('data.estado', EmployeeRequest::ESTADO_APROBADO)
            ->assertJsonPath('data.resuelto_por', $rrhh->id);

        $this->assertSame('Se corrigió el registro.', $solicitud->fresh()->respuesta_rrhh);
    }

    public function test_rrhh_rechaza_con_motivo_obligatorio(): void
    {
        $ana = $this->colaborador('Ana Torres');
        $rrhh = $this->colaborador('Talento Humano', 'admin');
        $solicitud = $this->crearSolicitud($ana);

        $this->actingAs($rrhh)
            ->postJson("/api/solicitudes/{$solicitud->id}/rechazar", [])
            ->assertJsonValidationErrorFor('respuesta_rrhh');

        $this->actingAs($rrhh)
            ->postJson("/api/solicitudes/{$solicitud->id}/rechazar", ['respuesta_rrhh' => 'El cálculo es correcto.'])
            ->assertOk()
            ->assertJsonPath('data.estado', EmployeeRequest::ESTADO_RECHAZADO);
    }

    public function test_una_solicitud_ya_resuelta_rechaza_una_segunda_transicion(): void
    {
        $ana = $this->colaborador('Ana Torres');
        $rrhh = $this->colaborador('Talento Humano', 'admin');
        $solicitud = $this->crearSolicitud($ana, EmployeeRequest::ESTADO_APROBADO);

        $this->actingAs($rrhh)
            ->postJson("/api/solicitudes/{$solicitud->id}/rechazar", ['respuesta_rrhh' => 'Cambio de opinión.'])
            ->assertStatus(409);

        $this->assertSame(EmployeeRequest::ESTADO_APROBADO, $solicitud->fresh()->estado);
    }

    public function test_rrhh_ve_las_solicitudes_de_todo_el_personal(): void
    {
        $ana = $this->colaborador('Ana Torres');
        $beto = $this->colaborador('Beto Salas');
        $rrhh = $this->colaborador('Talento Humano', 'admin');
        $this->crearSolicitud($ana);
        $this->crearSolicitud($beto);

        $this->actingAs($rrhh)
            ->getJson('/api/solicitudes/todas')
            ->assertOk()
            ->assertJsonCount(2, 'data');
    }

    public function test_el_alta_notifica_a_talento_humano(): void
    {
        $ana = $this->colaborador('Ana Torres');
        $rrhh = $this->colaborador('Talento Humano', 'admin');

        $this->actingAs($ana)->postJson('/api/solicitudes', [
            'tipo' => 'otro',
            'descripcion' => 'Necesito actualizar mi cuenta bancaria.',
        ])->assertCreated();

        $this->assertDatabaseHas('notifications', [
            'user_id' => $rrhh->id,
            'reference_type' => 'employee_request',
        ]);
    }

    public function test_la_resolucion_notifica_al_solicitante(): void
    {
        $ana = $this->colaborador('Ana Torres');
        $rrhh = $this->colaborador('Talento Humano', 'admin');
        $solicitud = $this->crearSolicitud($ana);

        $this->actingAs($rrhh)
            ->postJson("/api/solicitudes/{$solicitud->id}/aprobar", ['respuesta_rrhh' => 'Listo.'])
            ->assertOk();

        $this->assertDatabaseHas('notifications', [
            'user_id' => $ana->id,
            'reference_id' => $solicitud->id,
            'reference_type' => 'employee_request',
        ]);
    }
}
