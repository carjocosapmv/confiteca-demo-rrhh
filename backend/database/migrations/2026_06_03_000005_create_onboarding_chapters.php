<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('onboarding_chapters', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('titulo');
            $table->text('descripcion')->nullable();
            $table->string('icono')->nullable();
            $table->integer('orden')->default(0);
            $table->boolean('activo')->default(true);
            $table->timestamps();
        });

        Schema::table('onboarding_videos', function (Blueprint $table) {
            $table->foreignUuid('chapter_id')->nullable()->constrained('onboarding_chapters')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('onboarding_videos', function (Blueprint $table) {
            $table->dropConstrainedForeignId('chapter_id');
        });
        Schema::dropIfExists('onboarding_chapters');
    }
};
