<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('vacancy_requests', function (Blueprint $table) {
            // Sección 1 — Información básica
            $table->date('fecha_requerimiento')->nullable()->after('user_id');
            $table->string('cargo_solicitante')->nullable()->after('fecha_requerimiento');
            $table->string('area_solicitante')->nullable()->after('cargo_solicitante');
            $table->string('cargo_reporta')->nullable()->after('area_solicitante');
            $table->renameColumn('cargo_solicitado', 'cargo_requerimiento');
            $table->integer('num_vacantes')->default(1)->after('cargo_requerimiento');
            $table->string('horario_trabajo')->nullable()->after('num_vacantes');
            $table->string('turno')->nullable()->after('horario_trabajo');
            $table->boolean('disponibilidad_viajar')->default(false)->after('turno');
            $table->boolean('requiere_vehiculo')->default(false)->after('disponibilidad_viajar');
            $table->string('ciudad')->nullable()->after('requiere_vehiculo');
            $table->renameColumn('fecha_estimada_ingreso', 'fecha_tentativa_ingreso');
            $table->string('empresa')->nullable()->after('fecha_tentativa_ingreso');

            // Sección 2 — Grupo Ocupacional
            $table->string('grupo_ocupacional')->nullable()->after('empresa');

            // Sección 3 — Especificaciones
            $table->string('rango_edad')->nullable()->after('grupo_ocupacional');
            $table->string('nacionalidad')->nullable()->after('rango_edad');
            $table->string('genero')->default('Indiferente')->after('nacionalidad');
            $table->string('estado_civil')->default('Indiferente')->after('genero');
            $table->string('carga_familiar')->nullable()->after('estado_civil');
            $table->string('discapacidad')->default('Indiferente')->after('carga_familiar');
            $table->text('caracteristicas_jefe')->nullable()->after('discapacidad');

            // Sección 4 — Conocimiento y experiencia
            $table->text('experiencia_requerida')->nullable()->after('caracteristicas_jefe');
            $table->json('experiencia_sectores')->nullable()->after('experiencia_requerida');
            $table->text('especificaciones_hunting')->nullable()->after('experiencia_sectores');

            // Sección 5 — Contratación y remuneración
            $table->text('justificativo_contratacion')->nullable()->after('especificaciones_hunting');
            $table->string('tipo_contratacion')->nullable()->after('justificativo_contratacion');
            $table->string('motivo_salida')->nullable()->after('tipo_contratacion');
            $table->string('tipo_contrato')->nullable()->after('motivo_salida');
            $table->decimal('remuneracion_base', 10, 2)->default(0)->after('tipo_contrato');
            $table->decimal('remuneracion_variable', 10, 2)->default(0)->after('remuneracion_base');
            $table->string('modo_pago_variable')->nullable()->after('remuneracion_variable');
            $table->decimal('remuneracion_total', 10, 2)->default(0)->after('modo_pago_variable');
            $table->boolean('movilizacion')->default(false)->after('remuneracion_total');
            $table->decimal('movilizacion_monto', 10, 2)->default(0)->after('movilizacion');
            $table->text('otros_rubros')->nullable()->after('movilizacion_monto');

            // Sección 6 — Candidato interno
            $table->boolean('candidato_interno')->default(false)->after('otros_rubros');
            $table->string('candidato_nombre')->nullable()->after('candidato_interno');
            $table->string('candidato_area')->nullable()->after('candidato_nombre');
            $table->string('candidato_cargo_actual')->nullable()->after('candidato_area');

            // Flujo de aprobación (5 etapas)
            $table->string('etapa_aprobacion')->default('borrador')->after('status');
            $table->foreignUuid('aprobado_por_gerente_id')->nullable()->constrained('users')->nullOnDelete()->after('nota_revision');
            $table->timestamp('aprobado_por_gerente_at')->nullable()->after('aprobado_por_gerente_id');
            $table->text('nota_gerente')->nullable()->after('aprobado_por_gerente_at');
            $table->foreignUuid('aprobado_por_th_id')->nullable()->constrained('users')->nullOnDelete()->after('nota_gerente');
            $table->timestamp('aprobado_por_th_at')->nullable()->after('aprobado_por_th_id');
            $table->text('nota_th')->nullable()->after('aprobado_por_th_at');
            $table->foreignUuid('recibido_seleccion_id')->nullable()->constrained('users')->nullOnDelete()->after('nota_th');
            $table->timestamp('recibido_seleccion_at')->nullable()->after('recibido_seleccion_id');
            $table->text('nota_seleccion')->nullable()->after('recibido_seleccion_at');
            $table->foreignUuid('revision_final_id')->nullable()->constrained('users')->nullOnDelete()->after('nota_seleccion');
            $table->timestamp('revision_final_at')->nullable()->after('revision_final_id');
            $table->text('nota_revision_final')->nullable()->after('revision_final_at');
        });
    }

    public function down(): void
    {
        Schema::table('vacancy_requests', function (Blueprint $table) {
            $table->dropColumn([
                'fecha_requerimiento', 'cargo_solicitante', 'area_solicitante', 'cargo_reporta',
                'num_vacantes', 'horario_trabajo', 'turno', 'disponibilidad_viajar',
                'requiere_vehiculo', 'ciudad', 'empresa',
                'grupo_ocupacional',
                'rango_edad', 'nacionalidad', 'genero', 'estado_civil', 'carga_familiar',
                'discapacidad', 'caracteristicas_jefe',
                'experiencia_requerida', 'experiencia_sectores', 'especificaciones_hunting',
                'justificativo_contratacion', 'tipo_contratacion', 'motivo_salida',
                'tipo_contrato', 'remuneracion_base', 'remuneracion_variable',
                'modo_pago_variable', 'remuneracion_total', 'movilizacion',
                'movilizacion_monto', 'otros_rubros',
                'candidato_interno', 'candidato_nombre', 'candidato_area', 'candidato_cargo_actual',
                'etapa_aprobacion',
                'aprobado_por_gerente_id', 'aprobado_por_gerente_at', 'nota_gerente',
                'aprobado_por_th_id', 'aprobado_por_th_at', 'nota_th',
                'recibido_seleccion_id', 'recibido_seleccion_at', 'nota_seleccion',
                'revision_final_id', 'revision_final_at', 'nota_revision_final',
            ]);
        });
    }
};
