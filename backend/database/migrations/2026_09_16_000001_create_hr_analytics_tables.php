<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * HR analytics core for the Confiteca demo.
 *
 * The inherited schema only knew hire_date / business_unit / puesto / supervisor.
 * Rotation analytics needs tenure, boss, area, country, absenteeism, overtime,
 * contract type, salary, performance, climate and resignations — that is what
 * these tables provide. Payroll, sales and deposit tables are seeded here too so
 * later slices (nómina, cartera) already have coherent data to read from.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('employment_records', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('employee_code')->unique();
            $table->string('cedula')->nullable();
            $table->string('pais');
            $table->string('ciudad');
            $table->string('area');
            $table->foreignUuid('business_unit_id')->nullable()->constrained('business_units')->nullOnDelete();
            $table->foreignUuid('puesto_id')->nullable()->constrained('puestos')->nullOnDelete();
            $table->foreignUuid('supervisor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('nivel');                 // operativo | tecnico | analista | profesional | supervisor | jefatura | direccion
            $table->string('tipo_contrato');         // indefinido | plazo_fijo | temporal | aprendizaje
            $table->string('modalidad');             // presencial | hibrido | campo
            $table->string('genero');                // F | M
            $table->date('fecha_nacimiento');
            $table->date('fecha_ingreso');
            $table->date('fecha_salida')->nullable();
            $table->string('estado')->default('activo'); // activo | inactivo
            $table->timestamps();

            $table->index('estado');
            $table->index('area');
            $table->index('pais');
            $table->index('supervisor_id');
            $table->index('fecha_ingreso');
            $table->index('fecha_salida');
        });

        Schema::create('compensations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained('users')->cascadeOnDelete();
            $table->date('vigente_desde');
            $table->decimal('salario_base', 12, 2);
            $table->decimal('variable_objetivo', 12, 2)->default(0);
            $table->string('esquema');               // fijo | fijo_variable | comision
            $table->string('moneda', 3)->default('USD');
            $table->string('motivo')->nullable();    // ingreso | ajuste_anual | promocion | equidad
            $table->timestamps();

            $table->index(['user_id', 'vigente_desde']);
        });

        Schema::create('terminations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained('users')->cascadeOnDelete();
            $table->date('fecha');
            $table->string('tipo');                  // voluntaria | involuntaria
            $table->string('motivo');
            $table->boolean('es_lamentable')->default(false);
            $table->text('comentario_entrevista')->nullable();
            $table->timestamps();

            $table->index('fecha');
            $table->index('tipo');
        });

        Schema::create('attendance_months', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('periodo', 7);            // YYYY-MM
            $table->integer('dias_laborables')->default(22);
            $table->decimal('dias_ausencia_justificada', 5, 1)->default(0);
            $table->decimal('dias_ausencia_injustificada', 5, 1)->default(0);
            $table->decimal('horas_extra', 6, 1)->default(0);
            $table->integer('atrasos_minutos')->default(0);
            $table->timestamps();

            $table->unique(['user_id', 'periodo']);
            $table->index('periodo');
        });

        Schema::create('performance_reviews', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('periodo', 10);           // 2025-S1
            $table->decimal('score', 5, 2);          // 0-100
            $table->string('calificacion');          // bajo | en_desarrollo | cumple | supera | destacado
            $table->decimal('potencial', 5, 2)->nullable();
            $table->string('nine_box')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'periodo']);
            $table->index('periodo');
        });

        Schema::create('climate_responses', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('periodo', 10);           // 2025-S1
            $table->integer('enps');                 // 0-10 recommendation score
            $table->decimal('satisfaccion', 4, 2);   // 1-5
            $table->decimal('liderazgo', 4, 2);      // 1-5 perception of direct boss
            $table->decimal('carga_laboral', 4, 2);  // 1-5 (higher = heavier)
            $table->timestamps();

            $table->unique(['user_id', 'periodo']);
            $table->index('periodo');
        });

        Schema::create('medical_visits', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignUuid('atendido_por')->nullable()->constrained('users')->nullOnDelete();
            $table->date('fecha');
            $table->string('tipo');                  // consulta | emergencia | control | ocupacional
            $table->string('motivo');
            $table->string('diagnostico')->nullable();
            $table->string('cie10')->nullable();
            $table->integer('reposo_dias')->default(0);
            $table->boolean('relacionado_trabajo')->default(false);
            $table->boolean('derivado')->default(false);
            $table->text('observaciones')->nullable();
            $table->timestamps();

            $table->index('fecha');
            $table->index('tipo');
        });

        Schema::create('bank_accounts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('banco');
            $table->string('numero_cuenta');
            $table->string('tipo_cuenta');           // ahorros | corriente
            $table->timestamps();

            $table->index('banco');
        });

        Schema::create('commission_records', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('periodo', 7);            // YYYY-MM
            $table->string('concepto');              // cumplimiento_cuota | cobranza | nuevos_clientes | mix_producto
            $table->decimal('base_calculo', 12, 2)->default(0);
            $table->decimal('porcentaje', 5, 2)->default(0);
            $table->decimal('monto', 12, 2)->default(0);
            $table->timestamps();

            $table->index(['user_id', 'periodo']);
            $table->index('periodo');
        });

        Schema::create('daily_sales', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('vendedor_id')->constrained('users')->cascadeOnDelete();
            $table->date('fecha');
            $table->string('ruta');
            $table->decimal('total_vendido', 12, 2)->default(0);
            $table->decimal('cobrado_efectivo', 12, 2)->default(0);
            $table->decimal('cobrado_transferencia', 12, 2)->default(0);
            $table->decimal('credito_otorgado', 12, 2)->default(0);
            $table->integer('num_facturas')->default(0);
            $table->timestamps();

            $table->index(['vendedor_id', 'fecha']);
            $table->index('fecha');
        });

        Schema::create('bank_deposits', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('vendedor_id')->constrained('users')->cascadeOnDelete();
            $table->date('fecha_deposito');
            $table->date('fecha_venta_referencia')->nullable();
            $table->string('banco');
            $table->string('numero_documento');
            $table->decimal('monto', 12, 2)->default(0);
            $table->string('estado')->default('registrado'); // registrado | conciliado | observado
            $table->timestamps();

            $table->index(['vendedor_id', 'fecha_deposito']);
            $table->index('fecha_deposito');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bank_deposits');
        Schema::dropIfExists('daily_sales');
        Schema::dropIfExists('commission_records');
        Schema::dropIfExists('bank_accounts');
        Schema::dropIfExists('medical_visits');
        Schema::dropIfExists('climate_responses');
        Schema::dropIfExists('performance_reviews');
        Schema::dropIfExists('attendance_months');
        Schema::dropIfExists('terminations');
        Schema::dropIfExists('compensations');
        Schema::dropIfExists('employment_records');
    }
};
