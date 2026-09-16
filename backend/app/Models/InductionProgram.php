<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class InductionProgram extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'user_id', 'empresa', 'area', 'fecha_ingreso',
        'progreso', 'total_actividades', 'completadas',
        'completed_at', 'survey_rating', 'survey_feedback',
        'survey_commitment', 'certificate_generated_at',
    ];

    protected $casts = [
        'fecha_ingreso' => 'date',
        'completed_at' => 'datetime',
        'certificate_generated_at' => 'datetime',
        'survey_commitment' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function activities(): HasMany
    {
        return $this->hasMany(InductionActivity::class, 'program_id')->orderBy('dia')->orderBy('horario');
    }
}
