<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_roles', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('role'); // superadmin, admin, user, viewer
            $table->timestamps();

            $table->unique(['user_id', 'role']);
        });

        Schema::create('user_unit_assignments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('unidad_negocio_id');
            $table->foreignUuid('assigned_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['user_id', 'unidad_negocio_id']);
        });

        Schema::create('role_permissions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('role');
            $table->string('module_key');
            $table->boolean('can_view')->default(true);
            $table->boolean('can_edit')->default(false);
            $table->timestamps();

            $table->unique(['role', 'module_key']);
        });

        Schema::create('role_config', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('role')->unique();
            $table->string('salary_visibility')->default('none'); // full, masked, none
            $table->boolean('can_view_income')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('role_config');
        Schema::dropIfExists('role_permissions');
        Schema::dropIfExists('user_unit_assignments');
        Schema::dropIfExists('user_roles');
    }
};
