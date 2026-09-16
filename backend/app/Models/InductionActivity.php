<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InductionActivity extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'program_id', 'dia', 'area_competencia', 'contenido',
        'fecha', 'lugar', 'horario', 'facilitador', 'status', 'observaciones',
    ];

    public function program(): BelongsTo
    {
        return $this->belongsTo(InductionProgram::class, 'program_id');
    }
}
