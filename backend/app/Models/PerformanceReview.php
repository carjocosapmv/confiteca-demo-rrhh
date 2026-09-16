<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PerformanceReview extends Model
{
    use HasUuids;

    protected $fillable = [
        'user_id',
        'periodo',
        'score',
        'calificacion',
        'potencial',
        'nine_box',
    ];

    protected $casts = [
        'score' => 'float',
        'potencial' => 'float',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
