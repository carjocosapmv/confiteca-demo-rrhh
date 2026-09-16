<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class OnboardingVideo extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'titulo', 'departamento', 'chapter_id', 'duracion_minutos', 'url',
        'descripcion', 'orden', 'activo',
    ];

    protected $casts = [
        'activo' => 'boolean',
    ];

    public function chapter(): BelongsTo
    {
        return $this->belongsTo(OnboardingChapter::class, 'chapter_id');
    }

    public function progress(): HasMany
    {
        return $this->hasMany(OnboardingProgress::class, 'video_id');
    }
}
