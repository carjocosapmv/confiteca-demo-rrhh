<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CommissionRecord extends Model
{
    use HasUuids;

    protected $fillable = [
        'user_id',
        'periodo',
        'concepto',
        'base_calculo',
        'porcentaje',
        'monto',
    ];

    protected $casts = [
        'base_calculo' => 'decimal:2',
        'porcentaje' => 'float',
        'monto' => 'decimal:2',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
