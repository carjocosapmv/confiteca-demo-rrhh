<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DailySale extends Model
{
    use HasUuids;

    protected $fillable = [
        'vendedor_id',
        'fecha',
        'ruta',
        'total_vendido',
        'cobrado_efectivo',
        'cobrado_transferencia',
        'credito_otorgado',
        'num_facturas',
    ];

    protected $casts = [
        'fecha' => 'date',
        'total_vendido' => 'decimal:2',
        'cobrado_efectivo' => 'decimal:2',
        'cobrado_transferencia' => 'decimal:2',
        'credito_otorgado' => 'decimal:2',
    ];

    public function vendedor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'vendedor_id');
    }
}
