<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('puestos', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('nombre')->unique();
            $table->text('descripcion')->nullable();
            $table->boolean('activo')->default(true);
            $table->timestamps();
        });

        Schema::create('business_units', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('nombre')->unique();
            $table->string('codigo')->unique();
            $table->text('descripcion')->nullable();
            $table->uuid('responsable_id')->nullable(); // FK added later
            $table->boolean('activo')->default(true);
            $table->timestamps();
        });

        // Seed default business units
        DB::table('business_units')->insert([
            ['id' => (string) Str::orderedUuid(), 'nombre' => 'AI MKT', 'codigo' => 'AIMKT', 'descripcion' => 'Marketing y performance'],
            ['id' => (string) Str::orderedUuid(), 'nombre' => 'AI LAB', 'codigo' => 'AILAB', 'descripcion' => 'Laboratorio de IA, automatización y desarrollo'],
            ['id' => (string) Str::orderedUuid(), 'nombre' => 'Planning + Carteleras Digitales', 'codigo' => 'PLN', 'descripcion' => 'Planning y carteleras digitales'],
        ]);

        // Seed default puestos
        DB::table('puestos')->insert([
            ['id' => (string) Str::orderedUuid(), 'nombre' => 'Estratega', 'descripcion' => 'Define estrategia de marca/cliente'],
            ['id' => (string) Str::orderedUuid(), 'nombre' => 'Diseñador', 'descripcion' => 'Diseño gráfico y visual'],
            ['id' => (string) Str::orderedUuid(), 'nombre' => 'Content Creator', 'descripcion' => 'Creación de contenido'],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('business_units');
        Schema::dropIfExists('puestos');
    }
};
