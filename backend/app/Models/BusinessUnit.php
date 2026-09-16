<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BusinessUnit extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = ['nombre', 'codigo', 'descripcion', 'responsable_id', 'activo'];

    protected $casts = ['activo' => 'boolean'];

    public function responsable(): BelongsTo
    {
        return $this->belongsTo(User::class, 'responsable_id');
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }
}
