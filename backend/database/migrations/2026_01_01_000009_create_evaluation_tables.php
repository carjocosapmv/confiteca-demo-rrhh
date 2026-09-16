<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('evaluation_criteria', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('nombre');
            $table->text('descripcion')->nullable();
            $table->decimal('peso', 5, 2)->default(0);
            $table->integer('orden')->default(0);
            $table->boolean('activo')->default(true);
            $table->timestamps();
        });

        Schema::create('evaluations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('collaborator_id'); // not FK - can be manual collaborator
            $table->foreignUuid('evaluated_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('unidad_negocio_id');
            $table->string('equipo_marca_id')->nullable();
            $table->string('trimestre'); // '2026-Q1'
            $table->foreignUuid('evaluator_id')->constrained('users')->cascadeOnDelete();
            $table->decimal('nota_final', 5, 2)->default(0);
            $table->text('comentario_general')->nullable();
            $table->string('status')->default('borrador'); // borrador | publicada
            $table->timestamps();

            $table->unique(['collaborator_id', 'trimestre']);
            $table->index('collaborator_id');
            $table->index('evaluated_user_id');
            $table->index('trimestre');
        });

        Schema::create('evaluation_scores', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('evaluation_id')->constrained('evaluations')->cascadeOnDelete();
            $table->foreignUuid('criteria_id')->constrained('evaluation_criteria')->cascadeOnDelete();
            $table->decimal('nota', 5, 2)->default(0);
            $table->text('comentario')->nullable();
            $table->timestamps();

            $table->unique(['evaluation_id', 'criteria_id']);
            $table->index('evaluation_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('evaluation_scores');
        Schema::dropIfExists('evaluations');
        Schema::dropIfExists('evaluation_criteria');
    }
};
