<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LeaveRequest extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'user_id', 'request_type', 'tipo_permiso',
        'start_date', 'end_date', 'return_date', 'fecha_reintegro',
        'hora_salida', 'hora_retorno',
        'days_requested', 'days_charged', 'dias_solicitados',
        'weekend_days_included', 'uses_weekend_rule',
        'notes', 'razon', 'attachment_path',
        'status', 'etapa_aprobacion',
        'reviewed_by', 'reviewed_at',
        'nota_revision', 'nota_rechazo',
        'aprobado_por_jefe_id', 'aprobado_por_jefe_at',
        'aprobado_por_th_id', 'aprobado_por_th_at',
        'rechazado_por', 'saldo_vacaciones_disponible',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'return_date' => 'date',
        'fecha_reintegro' => 'date',
        'reviewed_at' => 'datetime',
        'aprobado_por_jefe_at' => 'datetime',
        'aprobado_por_th_at' => 'datetime',
        'uses_weekend_rule' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function aprobadoPorJefe(): BelongsTo
    {
        return $this->belongsTo(User::class, 'aprobado_por_jefe_id');
    }

    public function aprobadoPorTh(): BelongsTo
    {
        return $this->belongsTo(User::class, 'aprobado_por_th_id');
    }
}
