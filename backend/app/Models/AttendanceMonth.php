<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AttendanceMonth extends Model
{
    use HasUuids;

    protected $table = 'attendance_months';

    protected $fillable = [
        'user_id',
        'periodo',
        'dias_laborables',
        'dias_ausencia_justificada',
        'dias_ausencia_injustificada',
        'horas_extra',
        'atrasos_minutos',
    ];

    protected $casts = [
        'dias_ausencia_justificada' => 'float',
        'dias_ausencia_injustificada' => 'float',
        'horas_extra' => 'float',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
