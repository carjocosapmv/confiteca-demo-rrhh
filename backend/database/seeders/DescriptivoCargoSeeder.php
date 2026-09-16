<?php

namespace Database\Seeders;

use App\Models\JobDescription;
use App\Models\JobDescriptionVersion;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class DescriptivoCargoSeeder extends Seeder
{
    public function run(): void
    {
        $hoy = Carbon::now();

        // 1. Vendedor PDV — Planta — v2 — Aprobado
        $vendedor = $this->crearDescriptivo([
            'nombre_cargo' => 'Vendedor PDV',
            'empresa' => 'Planta',
            'area' => 'Ventas',
            'jefe_inmediato' => 'Jefe de Ventas',
            'mision_cargo' => 'Ejecutar la venta directa en punto de venta, asegurando la correcta exhibición de productos, atención al cliente y cumplimiento de metas comerciales asignadas.',
            'funciones' => [
                ['nombre' => 'Atención al Cliente', 'actividades' => ['Atender y asesorar a los clientes en el punto de venta', 'Resolver quejas y reclamos de clientes', 'Mantener una comunicación cordial y efectiva con el público']],
                ['nombre' => 'Gestión de Ventas', 'actividades' => ['Cumplir con las metas de ventas diarias, semanales y mensuales', 'Registrar las ventas en el sistema POS', 'Realizar cobros en efectivo y tarjeta']],
                ['nombre' => 'Exhibición y Merchandising', 'actividades' => ['Mantener la orden y limpieza del punto de venta', 'Reponer productos en góndolas y exhibidores', 'Ejecutar planogramas asignados']],
            ],
            'nivel_formacion' => 'Bachillerato',
            'area_estudios' => 'Cualquier área',
            'certificaciones' => 'Curso de atención al cliente (deseable)',
            'anios_experiencia' => 1,
            'experiencia_descripcion' => 'Experiencia mínima de 1 año en ventas directas o atención al cliente en retail.',
            'competencias_tecnicas' => [
                ['nombre' => 'Manejo de POS', 'nivel' => 'Medio'],
                ['nombre' => 'Office básico', 'nivel' => 'Bajo'],
                ['nombre' => 'Digitación', 'nivel' => 'Medio'],
            ],
            'competencias_conductuales' => [
                ['nombre' => 'Comunicación efectiva', 'nivel' => 'Alto'],
                ['nombre' => 'Trabajo en equipo', 'nivel' => 'Alto'],
                ['nombre' => 'Orientación al cliente', 'nivel' => 'Alto'],
                ['nombre' => 'Proactividad', 'nivel' => 'Medio'],
            ],
            'elaborado_por_nombre' => 'Jefe de Ventas GM',
            'elaborado_por_cargo' => 'Jefe de Ventas',
            'fecha_elaboracion' => $hoy->copy()->subMonths(3)->format('Y-m-d'),
            'estado' => 'aprobado',
            'version_actual' => 2,
        ]);

        // v1
        JobDescriptionVersion::create([
            'job_description_id' => $vendedor->id,
            'version' => 1,
            'estado' => 'desactualizado',
            'data' => ['nombre_cargo' => 'Vendedor PDV', 'empresa' => 'Planta', 'area' => 'Ventas', 'nivel_formacion' => 'Bachillerato', 'anios_experiencia' => 0],
            'creado_por_nombre' => 'Jefe de Ventas GM',
            'created_at' => $hoy->copy()->subMonths(6),
        ]);

        // v2 (current)
        JobDescriptionVersion::create([
            'job_description_id' => $vendedor->id,
            'version' => 2,
            'estado' => 'aprobado',
            'data' => ['nombre_cargo' => 'Vendedor PDV', 'empresa' => 'Planta', 'area' => 'Ventas', 'nivel_formacion' => 'Bachillerato', 'anios_experiencia' => 1, 'funciones' => [['nombre' => 'Atención al Cliente', 'actividades' => ['Atender y asesorar a los clientes']]]],
            'creado_por_nombre' => 'Jefe de Ventas GM',
            'created_at' => $hoy->copy()->subMonths(3),
        ]);

        // 2. Analista Contable — Ventas de Campo — v1 — En revisión
        $analista = $this->crearDescriptivo([
            'nombre_cargo' => 'Analista Contable',
            'empresa' => 'Ventas de Campo',
            'area' => 'Contabilidad',
            'jefe_inmediato' => 'Contador General',
            'mision_cargo' => 'Realizar el registro contable de las operaciones de la empresa, asegurando la precisión y oportunidad de la información financiera.',
            'funciones' => [
                ['nombre' => 'Registro Contable', 'actividades' => ['Registrar facturas de compra y venta en el sistema contable', 'Conciliar cuentas bancarias mensualmente', 'Elaborar asientos contables de ajuste']],
                ['nombre' => 'Declaraciones', 'actividades' => ['Preparar información para declaraciones tributarias', 'Calcular impuestos mensuales (IVA, retenciones)', 'Mantener archivo de declaraciones']],
                ['nombre' => 'Reportes', 'actividades' => ['Elaborar reportes contables mensuales', 'Apoyar en la preparación de estados financieros', 'Atender requerimientos de auditoría']],
            ],
            'nivel_formacion' => 'Universitario',
            'area_estudios' => 'Contabilidad, Auditoría o afines',
            'certificaciones' => 'Conocimiento de NIIF (deseable)',
            'anios_experiencia' => 2,
            'experiencia_descripcion' => 'Mínimo 2 años en posiciones contables. Manejo de software contable.',
            'competencias_tecnicas' => [
                ['nombre' => 'Software contable', 'nivel' => 'Alto'],
                ['nombre' => 'Excel avanzado', 'nivel' => 'Alto'],
                ['nombre' => 'NIIF', 'nivel' => 'Medio'],
            ],
            'competencias_conductuales' => [
                ['nombre' => 'Atención al detalle', 'nivel' => 'Alto'],
                ['nombre' => 'Organización', 'nivel' => 'Alto'],
                ['nombre' => 'Integridad', 'nivel' => 'Alto'],
            ],
            'elaborado_por_nombre' => 'Contador General',
            'elaborado_por_cargo' => 'Jefe Administrativo',
            'fecha_elaboracion' => $hoy->copy()->subDays(10)->format('Y-m-d'),
            'estado' => 'en_revision',
            'version_actual' => 1,
        ]);
        JobDescriptionVersion::create([
            'job_description_id' => $analista->id,
            'version' => 1,
            'estado' => 'en_revision',
            'data' => ['nombre_cargo' => 'Analista Contable', 'empresa' => 'Ventas de Campo', 'area' => 'Contabilidad', 'nivel_formacion' => 'Universitario', 'anios_experiencia' => 2],
            'creado_por_nombre' => 'Contador General',
        ]);

        // 3. Coordinador de Operaciones — Distribución — v1 — Borrador
        $coord = $this->crearDescriptivo([
            'nombre_cargo' => 'Coordinador de Operaciones',
            'empresa' => 'Distribución',
            'area' => 'Planificación de Rutas',
            'jefe_inmediato' => 'Gerente de Operaciones',
            'mision_cargo' => 'Coordinar las operaciones diarias del holding, asegurando la eficiencia en los procesos y la correcta asignación de recursos.',
            'funciones' => [
                ['nombre' => 'Planificación', 'actividades' => ['Planificar la asignación de recursos operativos', 'Elaborar cronogramas de actividades', 'Monitorear el cumplimiento de planes']],
                ['nombre' => 'Supervisión', 'actividades' => ['Supervisar al equipo operativo', 'Realizar evaluaciones de desempeño', 'Identificar necesidades de capacitación']],
            ],
            'nivel_formacion' => 'Universitario',
            'area_estudios' => 'Administración, Ingeniería Industrial o afines',
            'anios_experiencia' => 3,
            'experiencia_descripcion' => 'Mínimo 3 años en posiciones de coordinación o supervisión operativa.',
            'competencias_tecnicas' => [
                ['nombre' => 'Liderazgo', 'nivel' => 'Alto'],
                ['nombre' => 'Planificación', 'nivel' => 'Alto'],
                ['nombre' => 'Office avanzado', 'nivel' => 'Medio'],
            ],
            'competencias_conductuales' => [
                ['nombre' => 'Liderazgo', 'nivel' => 'Alto'],
                ['nombre' => 'Toma de decisiones', 'nivel' => 'Alto'],
                ['nombre' => 'Comunicación asertiva', 'nivel' => 'Medio'],
            ],
            'elaborado_por_nombre' => 'Gerente TH',
            'elaborado_por_cargo' => 'Gerente de Talento Humano',
            'fecha_elaboracion' => $hoy->copy()->subDays(5)->format('Y-m-d'),
            'estado' => 'borrador',
            'version_actual' => 1,
        ]);
        JobDescriptionVersion::create([
            'job_description_id' => $coord->id,
            'version' => 1,
            'estado' => 'borrador',
            'data' => ['nombre_cargo' => 'Coordinador de Operaciones', 'empresa' => 'Distribución', 'area' => 'Planificación de Rutas', 'nivel_formacion' => 'Universitario', 'anios_experiencia' => 3],
            'creado_por_nombre' => 'Gerente TH',
        ]);

        // 4. Chofer — Distribución — v3 — Aprobado (historial completo)
        $chofer = $this->crearDescriptivo([
            'nombre_cargo' => 'Chofer',
            'empresa' => 'Distribución',
            'area' => 'Reparto Urbano',
            'jefe_inmediato' => 'Coordinador de Reparto Urbano',
            'mision_cargo' => 'Conducir los vehículos de la empresa para el transporte de productos, materiales y personal, asegurando la puntualidad, seguridad y cuidado de los activos.',
            'funciones' => [
                ['nombre' => 'Conducción', 'actividades' => ['Conducir vehículos livianos y pesados de la empresa', 'Realizar rutas de entrega y recolección', 'Cumplir con los horarios y cronogramas establecidos']],
                ['nombre' => 'Mantenimiento', 'actividades' => ['Realizar revisiones básicas del vehículo', 'Reportar novedades mecánicas a mantenimiento', 'Mantener la limpieza del vehículo']],
                ['nombre' => 'Documentación', 'actividades' => ['Gestionar guías de remisión y documentos de transporte', 'Registrar novedades en bitácora de viajes', 'Entregar documentación a bodega']],
            ],
            'nivel_formacion' => 'Bachillerato',
            'certificaciones' => 'Licencia tipo E o G (vigente). Curso de manejo defensivo.',
            'anios_experiencia' => 2,
            'experiencia_descripcion' => 'Mínimo 2 años como chofer. Experiencia en rutas urbanas e interprovinciales.',
            'competencias_tecnicas' => [
                ['nombre' => 'Conducción defensiva', 'nivel' => 'Alto'],
                ['nombre' => 'Mecánica básica', 'nivel' => 'Medio'],
                ['nombre' => 'Navegación', 'nivel' => 'Alto'],
            ],
            'competencias_conductuales' => [
                ['nombre' => 'Responsabilidad', 'nivel' => 'Alto'],
                ['nombre' => 'Puntualidad', 'nivel' => 'Alto'],
                ['nombre' => 'Tolerancia a la presión', 'nivel' => 'Medio'],
            ],
            'elaborado_por_nombre' => 'Jefatura de Bodega',
            'elaborado_por_cargo' => 'Jefe Administrativo',
            'fecha_elaboracion' => $hoy->copy()->subMonths(2)->format('Y-m-d'),
            'estado' => 'aprobado',
            'version_actual' => 3,
        ]);

        JobDescriptionVersion::create([
            'job_description_id' => $chofer->id, 'version' => 1, 'estado' => 'desactualizado',
            'data' => ['nombre_cargo' => 'Chofer', 'empresa' => 'Distribución', 'area' => 'Reparto Urbano', 'nivel_formacion' => 'Bachillerato', 'anios_experiencia' => 1],
            'creado_por_nombre' => 'Jefatura de Bodega', 'created_at' => $hoy->copy()->subMonths(8),
        ]);
        JobDescriptionVersion::create([
            'job_description_id' => $chofer->id, 'version' => 2, 'estado' => 'desactualizado',
            'data' => ['nombre_cargo' => 'Chofer', 'empresa' => 'Distribución', 'area' => 'Reparto Urbano', 'nivel_formacion' => 'Bachillerato', 'anios_experiencia' => 2],
            'creado_por_nombre' => 'Jefatura de Bodega', 'created_at' => $hoy->copy()->subMonths(5),
        ]);
        JobDescriptionVersion::create([
            'job_description_id' => $chofer->id, 'version' => 3, 'estado' => 'aprobado',
            'data' => ['nombre_cargo' => 'Chofer', 'empresa' => 'Distribución', 'area' => 'Reparto Urbano', 'nivel_formacion' => 'Bachillerato', 'anios_experiencia' => 2, 'certificaciones' => 'Licencia tipo E o G'],
            'creado_por_nombre' => 'Jefatura de Bodega', 'created_at' => $hoy->copy()->subMonths(2),
        ]);

        $this->command->info('Descriptivos de cargo seeded: Vendedor PDV v2, Analista Contable v1, Coordinador Operaciones v1, Chofer v3.');
    }

    private function crearDescriptivo(array $data): JobDescription
    {
        return JobDescription::firstOrCreate(
            ['nombre_cargo' => $data['nombre_cargo'], 'empresa' => $data['empresa']],
            $data
        );
    }
}
