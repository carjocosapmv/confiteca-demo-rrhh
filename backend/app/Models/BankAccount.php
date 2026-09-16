<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BankAccount extends Model
{
    use HasUuids;

    protected $fillable = [
        'user_id',
        'banco',
        'numero_cuenta',
        'tipo_cuenta',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
