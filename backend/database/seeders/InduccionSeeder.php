<?php

namespace Database\Seeders;

use App\Models\InductionActivity;
use App\Models\InductionProgram;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class InduccionSeeder extends Seeder
{
    public function run(): void
    {
        $maria = User::where('email', 'colaborador@confiteca.com')->first();
        $pedro = User::where('email', 'vendedor@confiteca.com')->first();
        $carlos = User::where('email', 'jefe.planta@confiteca.com')->first();
        $ana = User::where('email', 'jefe.ventas@confiteca.com')->first();

        if (!$maria || !$pedro) {
            $this->command->error('Usuarios demo no encontrados. Ejecuta ConfitecaWorkforceSeeder primero.');
            return;
        }

        $hoy = Carbon::now();

        // Programa de Luis Carrión (lo creamos como usuario nuevo)
        $luis = User::firstOrCreate(
            ['email' => 'ingreso.planta@confiteca.com'],
            [
                'password' => bcrypt('demo123'),
                'display_name' => 'Nuevo Ingreso Planta',
                'business_unit_id' => $maria->business_unit_id,
                'puesto_id' => $maria->puesto_id,
                'hire_date' => $hoy->copy()->subDays(3)->format('Y-m-d'),
            ]
        );

        $programa1 = InductionProgram::firstOrCreate(
            ['user_id' => $luis->id],
            [
                'empresa' => 'Planta',
                'area' => 'Producción Chocolates',
                'fecha_ingreso' => $hoy->copy()->subDays(3)->format('Y-m-d'),
                'total_actividades' => 6,
                'completadas' => 3,
                'progreso' => 60,
            ]
        );

        $this->crearActividades($programa1, [
            ['dia' => 1, 'area_competencia' => 'Administrativo', 'contenido' => 'Bienvenida Administrativa', 'fecha' => $hoy->copy()->subDays(3), 'lugar' => 'Oficina Principal Sala A', 'horario' => '8:00 - 9:00', 'facilitador' => $carlos->display_name, 'status' => 'finalizado'],
            ['dia' => 1, 'area_competencia' => 'Talento Humano', 'contenido' => 'Políticas de empresa', 'fecha' => $hoy->copy()->subDays(3), 'lugar' => 'Oficina Principal Sala A', 'horario' => '9:00 - 11:00', 'facilitador' => $carlos->display_name, 'status' => 'finalizado'],
            ['dia' => 2, 'area_competencia' => 'Ventas', 'contenido' => 'Inducción Ventas', 'fecha' => $hoy->copy()->subDays(2), 'lugar' => 'Sala Ventas 2do Piso', 'horario' => '8:00 - 10:00', 'facilitador' => $carlos->display_name, 'status' => 'finalizado'],
            ['dia' => 2, 'area_competencia' => 'Tecnología', 'contenido' => 'Herramientas CRM', 'fecha' => $hoy->copy()->subDays(2), 'lugar' => 'Sala Ventas 2do Piso', 'horario' => '10:00 - 12:00', 'facilitador' => 'Soporte TI', 'status' => 'en_curso'],
            ['dia' => 3, 'area_competencia' => 'Bodega Materia Prima', 'contenido' => 'Recorrido bodega', 'fecha' => $hoy->copy()->subDay(), 'lugar' => 'Bodega de Materia Prima', 'horario' => '8:00 - 10:00', 'facilitador' => $carlos->display_name, 'status' => 'aplazado'],
            ['dia' => 3, 'area_competencia' => 'Ventas', 'contenido' => 'Proceso de ventas', 'fecha' => $hoy->copy()->subDay(), 'lugar' => 'Bodega de Materia Prima', 'horario' => '10:00 - 12:00', 'facilitador' => $carlos->display_name, 'status' => 'pendiente'],
        ]);

        // Programa de Valeria Mora
        $valeria = User::firstOrCreate(
            ['email' => 'ingreso.ventas@confiteca.com'],
            [
                'password' => bcrypt('demo123'),
                'display_name' => 'Nuevo Ingreso Ventas',
                'business_unit_id' => $pedro->business_unit_id,
                'puesto_id' => $pedro->puesto_id,
                'hire_date' => $hoy->copy()->subDay()->format('Y-m-d'),
            ]
        );

        $programa2 = InductionProgram::firstOrCreate(
            ['user_id' => $valeria->id],
            [
                'empresa' => 'Ventas de Campo',
                'area' => 'Ventas Detalle',
                'fecha_ingreso' => $hoy->copy()->subDay()->format('Y-m-d'),
                'total_actividades' => 5,
                'completadas' => 1,
                'progreso' => 20,
            ]
        );

        $this->crearActividades($programa2, [
            ['dia' => 1, 'area_competencia' => 'Administrativo', 'contenido' => 'Bienvenida Administrativa', 'fecha' => $hoy->copy()->subDay(), 'lugar' => 'Oficinas Comerciales Piso 3', 'horario' => '8:00 - 9:00', 'facilitador' => $ana->display_name, 'status' => 'finalizado'],
            ['dia' => 1, 'area_competencia' => 'Seguridad', 'contenido' => 'Seguridad industrial', 'fecha' => $hoy->copy()->subDay(), 'lugar' => 'Oficinas Comerciales Piso 3', 'horario' => '9:00 - 11:00', 'facilitador' => $ana->display_name, 'status' => 'en_curso'],
            ['dia' => 2, 'area_competencia' => 'Reparto Urbano', 'contenido' => 'Proceso de distribución', 'fecha' => $hoy->copy()->addDay(), 'lugar' => 'Centro de Distribución', 'horario' => '8:00 - 10:00', 'facilitador' => $ana->display_name, 'status' => 'pendiente'],
            ['dia' => 2, 'area_competencia' => 'Tecnología', 'contenido' => 'Sistemas internos', 'fecha' => $hoy->copy()->addDay(), 'lugar' => 'Centro de Distribución', 'horario' => '10:00 - 12:00', 'facilitador' => 'Soporte TI', 'status' => 'pendiente'],
            ['dia' => 3, 'area_competencia' => 'Producción Galletas', 'contenido' => 'Procesos productivos', 'fecha' => $hoy->copy()->addDays(2), 'lugar' => 'Planta de Producción', 'horario' => '8:00 - 11:00', 'facilitador' => $ana->display_name, 'status' => 'pendiente'],
        ]);

        // Programa completado para Sofía (demo de programa terminado + encuesta)
        $sofia = User::where('email', 'supervisor@confiteca.com')->first();
        if ($sofia) {
            $programaCompleto = InductionProgram::firstOrCreate(
                ['user_id' => $sofia->id],
                [
                    'empresa' => 'Administración',
                    'area' => 'Talento Humano',
                    'fecha_ingreso' => $hoy->copy()->subMonth()->format('Y-m-d'),
                    'total_actividades' => 4,
                    'completadas' => 4,
                    'progreso' => 100,
                    'completed_at' => $hoy->copy()->subDays(20),
                    'survey_rating' => 'excelente',
                    'survey_feedback' => 'El proceso fue muy claro y los facilitadores estuvieron muy atentos.',
                    'survey_commitment' => true,
                    'certificate_generated_at' => $hoy->copy()->subDays(20),
                ]
            );

            $this->crearActividades($programaCompleto, [
                ['dia' => 1, 'area_competencia' => 'Administrativo', 'contenido' => 'Bienvenida e inducción administrativa', 'fecha' => $hoy->copy()->subMonth(), 'lugar' => 'Oficinas Corporativas', 'horario' => '8:00 - 10:00', 'facilitador' => 'Jefatura de Talento Humano', 'status' => 'finalizado'],
                ['dia' => 1, 'area_competencia' => 'Talento Humano', 'contenido' => 'Políticas y beneficios', 'fecha' => $hoy->copy()->subMonth(), 'lugar' => 'Oficinas Corporativas', 'horario' => '10:00 - 12:00', 'facilitador' => 'Jefatura de Talento Humano', 'status' => 'finalizado'],
                ['dia' => 2, 'area_competencia' => 'Tecnología', 'contenido' => 'Sistemas y herramientas Confiteca', 'fecha' => $hoy->copy()->subMonth()->addDay(), 'lugar' => 'Sala de Sistemas', 'horario' => '8:00 - 10:00', 'facilitador' => 'Soporte TI', 'status' => 'finalizado'],
                ['dia' => 2, 'area_competencia' => 'Administrativo', 'contenido' => 'Procesos administrativos diarios', 'fecha' => $hoy->copy()->subMonth()->addDay(), 'lugar' => 'Oficinas Corporativas', 'horario' => '10:00 - 12:00', 'facilitador' => 'Jefatura de Talento Humano', 'status' => 'finalizado'],
            ]);
        }

        $this->command->info('Inducción demo seeded: Nuevo Ingreso Planta (60%), Nuevo Ingreso Ventas (20%), Supervisión (100%).');
    }

    private function crearActividades(InductionProgram $program, array $actividades): void
    {
        foreach ($actividades as $act) {
            InductionActivity::firstOrCreate(
                ['program_id' => $program->id, 'contenido' => $act['contenido']],
                [
                    'dia' => $act['dia'],
                    'area_competencia' => $act['area_competencia'],
                    'fecha' => $act['fecha']->format('Y-m-d'),
                    'lugar' => $act['lugar'],
                    'horario' => $act['horario'],
                    'facilitador' => $act['facilitador'],
                    'status' => $act['status'],
                ]
            );
        }
    }
}
