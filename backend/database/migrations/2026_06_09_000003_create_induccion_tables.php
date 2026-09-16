<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('induction_programs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('empresa');
            $table->string('area');
            $table->date('fecha_ingreso');
            $table->integer('progreso')->default(0);
            $table->integer('total_actividades')->default(0);
            $table->integer('completadas')->default(0);
            $table->timestamp('completed_at')->nullable();
            $table->string('survey_rating')->nullable();
            $table->text('survey_feedback')->nullable();
            $table->boolean('survey_commitment')->default(false);
            $table->timestamp('certificate_generated_at')->nullable();
            $table->timestamps();
        });

        Schema::create('induction_activities', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('program_id')->constrained('induction_programs')->cascadeOnDelete();
            $table->integer('dia');
            $table->string('area_competencia');
            $table->text('contenido');
            $table->date('fecha');
            $table->string('lugar');
            $table->string('horario');
            $table->string('facilitador');
            $table->string('status')->default('pendiente');
            $table->text('observaciones')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('induction_activities');
        Schema::dropIfExists('induction_programs');
    }
};
