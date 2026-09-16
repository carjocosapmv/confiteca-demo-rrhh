<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class OnboardingChapter extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'titulo', 'descripcion', 'icono', 'orden', 'activo',
    ];

    protected $casts = [
        'activo' => 'boolean',
    ];

    public function videos(): HasMany
    {
        return $this->hasMany(OnboardingVideo::class, 'chapter_id')->orderBy('orden');
    }
}
