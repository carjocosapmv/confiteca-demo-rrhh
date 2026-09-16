<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmploymentRecord extends Model
{
    use HasUuids;

    protected $fillable = [
        'user_id',
        'employee_code',
        'cedula',
        'pais',
        'ciudad',
        'area',
        'business_unit_id',
        'puesto_id',
        'supervisor_id',
        'nivel',
        'tipo_contrato',
        'modalidad',
        'genero',
        'fecha_nacimiento',
        'fecha_ingreso',
        'fecha_salida',
        'estado',
    ];

    protected $casts = [
        'fecha_nacimiento' => 'date',
        'fecha_ingreso' => 'date',
        'fecha_salida' => 'date',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function supervisor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'supervisor_id');
    }

    public function businessUnit(): BelongsTo
    {
        return $this->belongsTo(BusinessUnit::class);
    }

    public function puesto(): BelongsTo
    {
        return $this->belongsTo(Puesto::class);
    }
}
