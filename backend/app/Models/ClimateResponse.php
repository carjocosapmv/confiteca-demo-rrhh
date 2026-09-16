<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ClimateResponse extends Model
{
    use HasUuids;

    protected $fillable = [
        'user_id',
        'periodo',
        'enps',
        'satisfaccion',
        'liderazgo',
        'carga_laboral',
    ];

    protected $casts = [
        'enps' => 'integer',
        'satisfaccion' => 'float',
        'liderazgo' => 'float',
        'carga_laboral' => 'float',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
