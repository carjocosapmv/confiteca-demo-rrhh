<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RolePermission extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = ['role', 'module_key', 'can_view', 'can_edit'];

    protected $casts = [
        'can_view' => 'boolean',
        'can_edit' => 'boolean',
    ];
}
