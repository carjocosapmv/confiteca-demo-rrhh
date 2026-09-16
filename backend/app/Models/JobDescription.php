<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class JobDescription extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'nombre_cargo', 'empresa', 'area', 'jefe_inmediato',
        'mision_cargo', 'funciones',
        'nivel_formacion', 'area_estudios', 'certificaciones',
        'anios_experiencia', 'experiencia_descripcion',
        'competencias_tecnicas', 'competencias_conductuales',
        'elaborado_por_nombre', 'elaborado_por_cargo',
        'fecha_elaboracion', 'estado', 'version_actual',
        'vinculado_requisicion',
    ];

    protected $casts = [
        'funciones' => 'array',
        'competencias_tecnicas' => 'array',
        'competencias_conductuales' => 'array',
        'fecha_elaboracion' => 'date',
        'vinculado_requisicion' => 'boolean',
    ];

    public function versions(): HasMany
    {
        return $this->hasMany(JobDescriptionVersion::class, 'job_description_id')->orderBy('version', 'desc');
    }
}
