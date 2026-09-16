<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MedicalVisit extends Model
{
    use HasUuids;

    protected $fillable = [
        'user_id',
        'atendido_por',
        'fecha',
        'tipo',
        'motivo',
        'diagnostico',
        'cie10',
        'reposo_dias',
        'relacionado_trabajo',
        'derivado',
        'observaciones',
    ];

    protected $casts = [
        'fecha' => 'date',
        'relacionado_trabajo' => 'boolean',
        'derivado' => 'boolean',
        'reposo_dias' => 'integer',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function medico(): BelongsTo
    {
        return $this->belongsTo(User::class, 'atendido_por');
    }
}
