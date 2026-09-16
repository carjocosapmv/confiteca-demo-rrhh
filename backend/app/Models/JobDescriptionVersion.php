<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class JobDescriptionVersion extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'job_description_id', 'version', 'estado', 'data', 'creado_por_nombre',
    ];

    protected $casts = [
        'data' => 'array',
    ];

    public function jobDescription(): BelongsTo
    {
        return $this->belongsTo(JobDescription::class, 'job_description_id');
    }
}
