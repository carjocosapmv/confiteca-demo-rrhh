<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Termination extends Model
{
    use HasUuids;

    protected $fillable = [
        'user_id',
        'fecha',
        'tipo',
        'motivo',
        'es_lamentable',
        'comentario_entrevista',
    ];

    protected $casts = [
        'fecha' => 'date',
        'es_lamentable' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
