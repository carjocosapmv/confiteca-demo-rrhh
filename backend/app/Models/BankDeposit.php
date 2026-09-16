<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BankDeposit extends Model
{
    use HasUuids;

    protected $fillable = [
        'vendedor_id',
        'fecha_deposito',
        'fecha_venta_referencia',
        'banco',
        'numero_documento',
        'monto',
        'estado',
    ];

    protected $casts = [
        'fecha_deposito' => 'date',
        'fecha_venta_referencia' => 'date',
        'monto' => 'decimal:2',
    ];

    public function vendedor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'vendedor_id');
    }
}
