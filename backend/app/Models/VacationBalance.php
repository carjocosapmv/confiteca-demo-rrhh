<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VacationBalance extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = ['user_id', 'year', 'total_days', 'used_days', 'weekend_rule_uses', 'renewal_date'];

    protected $casts = ['renewal_date' => 'date'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function remainingDays(): int
    {
        return $this->total_days - $this->used_days;
    }
}
