<?php

namespace Database\Seeders;

use App\Models\OnboardingChapter;
use App\Models\OnboardingVideo;
use Illuminate\Database\Seeder;

class OnboardingChapterSeeder extends Seeder
{
    public function run(): void
    {
        $chapters = [
            [
                'titulo' => 'Bienvenida y Cultura Organizacional',
                'descripcion' => 'Conoce nuestra historia, misión y los valores que nos guían.',
                'icono' => 'Heart',
                'orden' => 1,
                'videos' => [
                    ['titulo' => 'Video de bienvenida del CEO', 'descripcion' => 'Mensaje de bienvenida y visión estratégica de la dirección.', 'duracion_minutos' => 5],
                    ['titulo' => 'Misión, Visión y Valores', 'descripcion' => 'Conoce el propósito de la organización y los principios que nos definen.', 'duracion_minutos' => 8],
                    ['titulo' => 'Cultura organizacional y código de conducta', 'descripcion' => 'Cómo trabajamos, qué esperamos y cómo nos relacionamos.', 'duracion_minutos' => 10],
                ],
            ],
            [
                'titulo' => 'Historia y Estructura',
                'descripcion' => 'Recorre nuestra trayectoria y conoce cómo estamos organizados.',
                'icono' => 'Building2',
                'orden' => 2,
                'videos' => [
                    ['titulo' => 'Historia de la empresa', 'descripcion' => 'Desde nuestros inicios hasta hoy: los hitos que marcaron el camino.', 'duracion_minutos' => 7],
                    ['titulo' => 'Organigrama y áreas clave', 'descripcion' => 'Estructura organizacional, direcciones y cómo se relacionan.', 'duracion_minutos' => 5],
                ],
            ],
            [
                'titulo' => 'Políticas de Recursos Humanos',
                'descripcion' => 'Todo lo que necesitas saber sobre normas, beneficios y procesos de RRHH.',
                'icono' => 'FileText',
                'orden' => 3,
                'videos' => [
                    ['titulo' => 'Políticas de asistencia y horarios', 'descripcion' => 'Horarios, flexibilidad, registro de asistencia y teletrabajo.', 'duracion_minutos' => 6],
                    ['titulo' => 'Vacaciones, permisos y ausencias', 'descripcion' => 'Cómo solicitar vacaciones, permisos personales, visitas médicas y más.', 'duracion_minutos' => 7],
                    ['titulo' => 'Proceso de nómina y beneficios', 'descripcion' => 'Fechas de pago, descuentos, beneficios adicionales y asignaciones.', 'duracion_minutos' => 6],
                ],
            ],
            [
                'titulo' => 'Seguridad y Salud Laboral',
                'descripcion' => 'Protocolos y medidas para garantizar un entorno de trabajo seguro.',
                'icono' => 'Shield',
                'orden' => 4,
                'videos' => [
                    ['titulo' => 'Protocolos de seguridad', 'descripcion' => 'Normas de seguridad generales, uso de EPP y prevención de riesgos.', 'duracion_minutos' => 8],
                    ['titulo' => 'Salud ocupacional y bienestar', 'descripcion' => 'Programas de salud ocupacional, pausas activas y ergonomía.', 'duracion_minutos' => 5],
                    ['titulo' => 'Plan de emergencias y evacuación', 'descripcion' => 'Procedimientos ante emergencias, puntos de encuentro y roles.', 'duracion_minutos' => 6],
                ],
            ],
            [
                'titulo' => 'Sistemas y Herramientas',
                'descripcion' => 'Acceso y uso de las plataformas que utilizamos en el día a día.',
                'icono' => 'Monitor',
                'orden' => 5,
                'videos' => [
                    ['titulo' => 'Acceso a sistemas y correo electrónico', 'descripcion' => 'Credenciales, primer ingreso y configuración de herramientas básicas.', 'duracion_minutos' => 5],
                    ['titulo' => 'Herramientas de trabajo colaborativo', 'descripcion' => 'Uso de las plataformas de comunicación, documentos y gestión de proyectos.', 'duracion_minutos' => 8],
                ],
            ],
            [
                'titulo' => 'Capacitación del Puesto',
                'descripcion' => 'Formación específica para tu rol y áreas de responsabilidad.',
                'icono' => 'GraduationCap',
                'orden' => 6,
                'videos' => [
                    ['titulo' => 'Responsabilidades del rol', 'descripcion' => 'Expectativas, objetivos y funciones clave de tu posición.', 'duracion_minutos' => 6],
                    ['titulo' => 'Sistema de mentoría y acompañamiento', 'descripcion' => 'Cómo funciona el programa de mentoría y a quién recurrir.', 'duracion_minutos' => 4],
                ],
            ],
            [
                'titulo' => 'Evaluación y Desarrollo Profesional',
                'descripcion' => 'Cómo medimos el desempeño y crecemos dentro de la organización.',
                'icono' => 'TrendingUp',
                'orden' => 7,
                'videos' => [
                    ['titulo' => 'Período de prueba y expectativas', 'descripcion' => 'Qué se evalúa durante los primeros meses y cómo se define la confirmación.', 'duracion_minutos' => 6],
                    ['titulo' => 'Evaluación de desempeño', 'descripcion' => 'Ciclo de evaluaciones, feedback y definición de objetivos.', 'duracion_minutos' => 5],
                    ['titulo' => 'Plan de desarrollo y carrera', 'descripcion' => 'Oportunidades de crecimiento, capacitaciones y planes de sucesión.', 'duracion_minutos' => 7],
                ],
            ],
            [
                'titulo' => 'Beneficios y Calidad de Vida',
                'descripcion' => 'Conoce todos los beneficios que tienes como colaborador.',
                'icono' => 'Gift',
                'orden' => 8,
                'videos' => [
                    ['titulo' => 'Paquete de beneficios', 'descripcion' => 'Seguros, bonos, descuentos y otros beneficios exclusivos.', 'duracion_minutos' => 6],
                    ['titulo' => 'Bienestar y calidad de vida', 'descripcion' => 'Programas de bienestar, actividades recreativas y equilibrio laboral.', 'duracion_minutos' => 5],
                ],
            ],
        ];

        foreach ($chapters as $chapterData) {
            $videos = $chapterData['videos'];
            unset($chapterData['videos']);

            $chapter = OnboardingChapter::create($chapterData);

            foreach ($videos as $i => $videoData) {
                OnboardingVideo::create([
                    'chapter_id' => $chapter->id,
                    'titulo' => $videoData['titulo'],
                    'departamento' => 'general',
                    'descripcion' => $videoData['descripcion'],
                    'duracion_minutos' => $videoData['duracion_minutos'],
                    'url' => 'https://www.youtube.com/embed/dQw4w9WgXcQ',
                    'orden' => $i + 1,
                    'activo' => true,
                ]);
            }
        }

        $this->command->info('8 capítulos de onboarding creados con videos.');
    }
}
