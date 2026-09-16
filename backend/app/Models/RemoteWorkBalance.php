<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RemoteWorkBalance extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = ['user_id', 'total_days', 'used_days', 'renewal_date', 'period_start', 'period_end'];

    protected $casts = [
        'renewal_date' => 'date',
        'period_start' => 'date',
        'period_end' => 'date',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function remainingDays(): int
    {
        return $this->total_days - $this->used_days;
    }
}
