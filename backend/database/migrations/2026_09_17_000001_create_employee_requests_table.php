<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('employee_requests', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained('users')->cascadeOnDelete();

            // `string` y no `enum`: los tipos viven en EmployeeRequest::TIPOS y
            // agregar uno no debería costar una migración con recreación de
            // tabla en SQLite.
            $table->string('tipo', 32);
            $table->text('descripcion');
            $table->string('estado', 16)->default('pendiente');

            $table->text('respuesta_rrhh')->nullable();
            $table->foreignUuid('resuelto_por')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('resuelto_at')->nullable();

            $table->timestamps();

            // La bandeja del colaborador y la de Talento Humano son las dos
            // únicas consultas que existen sobre esta tabla.
            $table->index(['user_id', 'created_at']);
            $table->index(['estado', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('employee_requests');
    }
};
