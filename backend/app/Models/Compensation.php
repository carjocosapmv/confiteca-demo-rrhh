<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Compensation extends Model
{
    use HasUuids;

    protected $fillable = [
        'user_id',
        'vigente_desde',
        'salario_base',
        'variable_objetivo',
        'esquema',
        'moneda',
        'motivo',
    ];

    protected $casts = [
        'vigente_desde' => 'date',
        'salario_base' => 'decimal:2',
        'variable_objetivo' => 'decimal:2',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
