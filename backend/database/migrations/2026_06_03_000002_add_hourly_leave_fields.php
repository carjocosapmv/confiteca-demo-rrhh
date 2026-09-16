<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('leave_requests', function (Blueprint $table) {
            $table->time('hora_salida')->nullable()->after('return_date');
            $table->time('hora_retorno')->nullable()->after('hora_salida');
            $table->text('nota_revision')->nullable()->after('reviewed_at');
        });
    }

    public function down(): void
    {
        Schema::table('leave_requests', function (Blueprint $table) {
            $table->dropColumn(['hora_salida', 'hora_retorno', 'nota_revision']);
        });
    }
};
