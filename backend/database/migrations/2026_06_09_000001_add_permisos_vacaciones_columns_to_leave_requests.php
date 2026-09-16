<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('leave_requests', function (Blueprint $table) {
            $table->string('tipo_permiso')->nullable()->after('request_type');
            $table->text('razon')->nullable()->after('notes');
            $table->string('attachment_path')->nullable()->after('razon');
            $table->integer('dias_solicitados')->default(0)->after('days_charged');
            $table->date('fecha_reintegro')->nullable()->after('return_date');
            $table->string('etapa_aprobacion')->default('borrador')->after('status');
            $table->foreignUuid('aprobado_por_jefe_id')->nullable()->constrained('users')->nullOnDelete()->after('reviewed_at');
            $table->timestamp('aprobado_por_jefe_at')->nullable()->after('aprobado_por_jefe_id');
            $table->foreignUuid('aprobado_por_th_id')->nullable()->constrained('users')->nullOnDelete()->after('aprobado_por_jefe_at');
            $table->timestamp('aprobado_por_th_at')->nullable()->after('aprobado_por_th_id');
            $table->string('rechazado_por')->nullable()->after('aprobado_por_th_at');
            $table->string('nota_rechazo')->nullable()->after('rechazado_por');
            $table->string('saldo_vacaciones_disponible')->nullable()->after('nota_rechazo');
        });
    }

    public function down(): void
    {
        Schema::table('leave_requests', function (Blueprint $table) {
            $table->dropColumn([
                'tipo_permiso', 'razon', 'attachment_path', 'dias_solicitados',
                'fecha_reintegro', 'etapa_aprobacion',
                'aprobado_por_jefe_id', 'aprobado_por_jefe_at',
                'aprobado_por_th_id', 'aprobado_por_th_at',
                'rechazado_por', 'nota_rechazo', 'saldo_vacaciones_disponible',
            ]);
        });
    }
};
