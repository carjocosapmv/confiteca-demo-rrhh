<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('job_descriptions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('nombre_cargo');
            $table->string('empresa');
            $table->string('area');
            $table->string('jefe_inmediato')->nullable();
            $table->text('mision_cargo')->nullable();
            $table->json('funciones')->nullable();
            $table->string('nivel_formacion')->nullable();
            $table->string('area_estudios')->nullable();
            $table->text('certificaciones')->nullable();
            $table->integer('anios_experiencia')->default(0);
            $table->text('experiencia_descripcion')->nullable();
            $table->json('competencias_tecnicas')->nullable();
            $table->json('competencias_conductuales')->nullable();
            $table->string('elaborado_por_nombre')->nullable();
            $table->string('elaborado_por_cargo')->nullable();
            $table->date('fecha_elaboracion')->nullable();
            $table->string('estado')->default('borrador');
            $table->integer('version_actual')->default(1);
            $table->boolean('vinculado_requisicion')->default(false);
            $table->timestamps();
        });

        Schema::create('job_description_versions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('job_description_id')->constrained('job_descriptions')->cascadeOnDelete();
            $table->integer('version');
            $table->string('estado')->default('borrador');
            $table->json('data');
            $table->string('creado_por_nombre')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('job_description_versions');
        Schema::dropIfExists('job_descriptions');
    }
};
