<?php

namespace Database\Seeders;

use App\Models\EmployeeRequest;
use App\Models\LeaveRequest;
use App\Models\Notification;
use App\Models\User;
use App\Models\VacancyRequest;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

/**
 * Demo requests for the inherited modules (vacaciones/permisos and requisición
 * de personal), rebuilt around the Confiteca cast so every approval stage is
 * visible on screen during the demo.
 */
class ConfitecaRequestsSeeder extends Seeder
{
    public function run(): void
    {
        $colaborador = User::where('email', 'colaborador@confiteca.com')->first();
        $vendedor = User::where('email', 'vendedor@confiteca.com')->first();
        $supervisor = User::where('email', 'supervisor@confiteca.com')->first();
        $jefePlanta = User::where('email', 'jefe.planta@confiteca.com')->first();
        $jefeVentas = User::where('email', 'jefe.ventas@confiteca.com')->first();
        $th = User::where('email', 'th@confiteca.com')->first();

        if (! $colaborador || ! $vendedor || ! $th) {
            $this->command->error('Cuentas demo no encontradas. Ejecuta ConfitecaWorkforceSeeder primero.');

            return;
        }

        $hoy = Carbon::now();

        // ── Solicitudes de vacaciones y permisos, una por etapa ──
        $solicitudes = [
            [
                'user_id' => $colaborador->id,
                'request_type' => 'vacation',
                'start_date' => $hoy->copy()->addDays(14)->format('Y-m-d'),
                'end_date' => $hoy->copy()->addDays(28)->format('Y-m-d'),
                'fecha_reintegro' => $hoy->copy()->addDays(29)->format('Y-m-d'),
                'dias_solicitados' => 15,
                'days_requested' => 15,
                'days_charged' => 15,
                'razon' => 'Vacaciones familiares programadas',
                'saldo_vacaciones_disponible' => '12',
                'status' => 'pending',
                'etapa_aprobacion' => 'enviado',
            ],
            [
                'user_id' => $vendedor->id,
                'request_type' => 'permiso',
                'tipo_permiso' => 'permiso_medico',
                'start_date' => $hoy->copy()->subDays(5)->format('Y-m-d'),
                'end_date' => $hoy->copy()->subDays(2)->format('Y-m-d'),
                'days_requested' => 3,
                'days_charged' => 3,
                'razon' => 'Control médico post-operatorio',
                'status' => 'pending',
                'etapa_aprobacion' => 'aprobado_jefe',
                'aprobado_por_jefe_id' => $jefeVentas?->id,
                'aprobado_por_jefe_at' => $hoy->copy()->subDays(3),
            ],
            [
                'user_id' => $supervisor?->id ?? $colaborador->id,
                'request_type' => 'permiso',
                'tipo_permiso' => 'calamidad',
                'start_date' => $hoy->copy()->subDays(10)->format('Y-m-d'),
                'end_date' => $hoy->copy()->subDays(7)->format('Y-m-d'),
                'days_requested' => 3,
                'days_charged' => 3,
                'razon' => 'Fallecimiento de familiar directo',
                'status' => 'approved',
                'etapa_aprobacion' => 'aprobado_th',
                'aprobado_por_jefe_id' => $jefePlanta?->id,
                'aprobado_por_jefe_at' => $hoy->copy()->subDays(9),
                'aprobado_por_th_id' => $th->id,
                'aprobado_por_th_at' => $hoy->copy()->subDays(8),
            ],
            [
                'user_id' => $vendedor->id,
                'request_type' => 'vacation',
                'start_date' => $hoy->copy()->addDays(7)->format('Y-m-d'),
                'end_date' => $hoy->copy()->addDays(11)->format('Y-m-d'),
                'fecha_reintegro' => $hoy->copy()->addDays(12)->format('Y-m-d'),
                'dias_solicitados' => 5,
                'days_requested' => 5,
                'days_charged' => 5,
                'razon' => 'Viaje personal',
                'saldo_vacaciones_disponible' => '3',
                'status' => 'rejected',
                'etapa_aprobacion' => 'rechazado',
                'rechazado_por' => 'jefe',
                'nota_rechazo' => 'Cierre de mes comercial, no es posible liberar la ruta en esa semana.',
                'reviewed_by' => $jefeVentas?->id,
                'reviewed_at' => $hoy->copy()->subDay(),
            ],
        ];

        foreach ($solicitudes as $sol) {
            LeaveRequest::firstOrCreate(
                ['user_id' => $sol['user_id'], 'start_date' => $sol['start_date']],
                $sol
            );
        }

        // ── Requisiciones de personal ──
        $requisiciones = [
            [
                'user_id' => $supervisor?->id ?? $colaborador->id,
                'fecha_requerimiento' => $hoy->copy()->subDays(3)->format('Y-m-d'),
                'cargo_solicitante' => 'Supervisor de Línea',
                'area_solicitante' => 'Producción Chocolates',
                'cargo_reporta' => 'Jefe de Planta',
                'cargo_requerimiento' => 'Operario de Producción',
                'num_vacantes' => 4,
                'horario_trabajo' => 'Rotativo 6:00-14:00 / 14:00-22:00',
                'turno' => 'Rotativo',
                'disponibilidad_viajar' => false,
                'requiere_vehiculo' => false,
                'ciudad' => 'Quito',
                'fecha_tentativa_ingreso' => $hoy->copy()->addWeeks(3)->format('Y-m-d'),
                'empresa' => 'Planta',
                'grupo_ocupacional' => 'Producción',
                'departamento' => 'Producción Chocolates',
                'motivo' => 'Incremento de demanda por temporada alta',
                'rango_edad' => '20-40',
                'nacionalidad' => 'Ecuatoriana',
                'genero' => 'Indiferente',
                'estado_civil' => 'Indiferente',
                'discapacidad' => 'No',
                'caracteristicas_jefe' => 'Responsable, cumplido con horarios rotativos, trabajo en equipo',
                'experiencia_requerida' => 'Deseable experiencia en planta de alimentos. Manejo de BPM.',
                'experiencia_sectores' => [
                    ['sector' => 'Alimentos', 'tiempo' => '1 año'],
                    ['sector' => 'Manufactura', 'tiempo' => '6 meses'],
                ],
                'justificativo_contratacion' => 'La línea de chocolates sube a tres turnos por temporada navideña.',
                'tipo_contratacion' => 'nuevo_cargo',
                'tipo_contrato' => 'Plazo fijo',
                'remuneracion_base' => 490.00,
                'remuneracion_variable' => 60.00,
                'modo_pago_variable' => 'Bono por cumplimiento de producción',
                'remuneracion_total' => 550.00,
                'movilizacion' => true,
                'movilizacion_monto' => 40.00,
                'nivel_urgencia' => 'alta',
                'status' => 'pendiente',
                'etapa_aprobacion' => 'en_revision',
            ],
            [
                'user_id' => $vendedor->id,
                'fecha_requerimiento' => $hoy->copy()->subDays(12)->format('Y-m-d'),
                'cargo_solicitante' => 'Vendedor',
                'area_solicitante' => 'Ventas Detalle',
                'cargo_reporta' => 'Jefe de Ventas',
                'cargo_requerimiento' => 'Vendedor',
                'num_vacantes' => 2,
                'horario_trabajo' => 'Lunes a Sábado 7:30-17:00',
                'turno' => 'Mañana',
                'disponibilidad_viajar' => true,
                'requiere_vehiculo' => true,
                'ciudad' => 'Guayaquil',
                'fecha_tentativa_ingreso' => $hoy->copy()->addMonth()->format('Y-m-d'),
                'empresa' => 'Ventas de Campo',
                'grupo_ocupacional' => 'Ventas y Mercadeo',
                'departamento' => 'Ventas Detalle',
                'motivo' => 'Reemplazo por renuncias en la zona sur',
                'rango_edad' => '22-38',
                'nacionalidad' => 'Ecuatoriana',
                'genero' => 'Indiferente',
                'estado_civil' => 'Indiferente',
                'discapacidad' => 'No',
                'experiencia_requerida' => 'Mínimo 1 año en ventas de consumo masivo, manejo de ruta y cobranza.',
                'justificativo_contratacion' => 'Dos renuncias consecutivas en la ruta sur dejaron cartera sin cobertura.',
                'tipo_contratacion' => 'reemplazo',
                'motivo_salida' => 'Renuncia voluntaria',
                'tipo_contrato' => 'Indefinido',
                'remuneracion_base' => 500.00,
                'remuneracion_variable' => 350.00,
                'modo_pago_variable' => 'Comisión por cumplimiento de cuota y cobranza',
                'remuneracion_total' => 850.00,
                'nivel_urgencia' => 'alta',
                'status' => 'pendiente',
                'etapa_aprobacion' => 'aprobado_gerente',
                'aprobado_por_gerente_id' => $jefeVentas?->id,
                'aprobado_por_gerente_at' => $hoy->copy()->subDays(6),
                'nota_gerente' => 'Aprobado. Priorizar candidatos con ruta propia en zona sur.',
            ],
        ];

        foreach ($requisiciones as $req) {
            VacancyRequest::firstOrCreate(
                ['user_id' => $req['user_id'], 'fecha_requerimiento' => $req['fecha_requerimiento']],
                $req
            );
        }

        // ── Solicitudes genéricas del personal, una por estado ──
        $genericas = [
            [
                'user_id' => $vendedor->id,
                'tipo' => EmployeeRequest::TIPO_NOMINA,
                'descripcion' => 'En el período anterior no aparece la comisión por cobranza de la ruta sur. '
                    .'Adjunté los cobros en el sistema, pero el estimado no los refleja.',
                'estado' => EmployeeRequest::ESTADO_PENDIENTE,
            ],
            [
                'user_id' => $colaborador->id,
                'tipo' => EmployeeRequest::TIPO_CERTIFICADO,
                'descripcion' => 'Necesito un certificado laboral con detalle de ingresos para un trámite bancario.',
                'estado' => EmployeeRequest::ESTADO_APROBADO,
                'respuesta_rrhh' => 'Certificado emitido. Puedes retirarlo en Talento Humano a partir de mañana.',
                'resuelto_por' => $th->id,
                'resuelto_at' => $hoy->copy()->subDays(3),
            ],
            [
                'user_id' => $colaborador->id,
                'tipo' => EmployeeRequest::TIPO_OTRO,
                'descripcion' => 'Solicito cambio de horario de almuerzo de forma permanente a partir del próximo mes.',
                'estado' => EmployeeRequest::ESTADO_RECHAZADO,
                'respuesta_rrhh' => 'La cobertura del turno no permite el cambio permanente. '
                    .'Se puede revisar un ajuste temporal con tu jefe inmediato.',
                'resuelto_por' => $th->id,
                'resuelto_at' => $hoy->copy()->subDays(8),
            ],
        ];

        foreach ($genericas as $solicitud) {
            EmployeeRequest::firstOrCreate(
                ['user_id' => $solicitud['user_id'], 'descripcion' => $solicitud['descripcion']],
                $solicitud
            );
        }

        // ── Notificaciones de bandeja ──
        $notificaciones = [
            [
                'user_id' => $th->id,
                'title' => 'Nueva solicitud de vacaciones',
                'message' => 'Colaborador Demo envió una solicitud de 15 días pendiente de aprobación.',
                'type' => 'info',
                'reference_type' => 'leave_request',
            ],
            [
                'user_id' => $th->id,
                'title' => 'Requisición aprobada por gerencia',
                'message' => 'La requisición de 2 vendedores para la zona sur pasó a Talento Humano.',
                'type' => 'success',
                'reference_type' => 'vacancy_request',
            ],
            [
                'user_id' => $colaborador->id,
                'title' => 'Tu programa de inducción avanza',
                'message' => 'Tenés actividades pendientes en tu programa de inducción.',
                'type' => 'info',
                'reference_type' => 'induction',
            ],
        ];

        foreach ($notificaciones as $n) {
            Notification::firstOrCreate(
                ['user_id' => $n['user_id'], 'title' => $n['title']],
                $n + ['read' => false]
            );
        }

        $this->command->info('  ✓ Solicitudes, requisiciones y notificaciones demo');
    }
}
