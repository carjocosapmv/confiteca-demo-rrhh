<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VacancyRequest extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'user_id',
        'fecha_requerimiento', 'cargo_solicitante', 'area_solicitante',
        'cargo_reporta', 'cargo_requerimiento', 'num_vacantes',
        'horario_trabajo', 'turno', 'disponibilidad_viajar', 'requiere_vehiculo',
        'ciudad', 'fecha_tentativa_ingreso', 'empresa',
        'grupo_ocupacional',
        'rango_edad', 'nacionalidad', 'genero', 'estado_civil',
        'carga_familiar', 'discapacidad', 'caracteristicas_jefe',
        'experiencia_requerida', 'experiencia_sectores', 'especificaciones_hunting',
        'justificativo_contratacion', 'tipo_contratacion', 'motivo_salida',
        'tipo_contrato', 'remuneracion_base', 'remuneracion_variable',
        'modo_pago_variable', 'remuneracion_total', 'movilizacion',
        'movilizacion_monto', 'otros_rubros',
        'candidato_interno', 'candidato_nombre', 'candidato_area', 'candidato_cargo_actual',
        'departamento', 'motivo', 'nivel_urgencia', 'status', 'etapa_aprobacion',
        'reviewed_by', 'nota_revision', 'reviewed_at',
        'aprobado_por_gerente_id', 'aprobado_por_gerente_at', 'nota_gerente',
        'aprobado_por_th_id', 'aprobado_por_th_at', 'nota_th',
        'recibido_seleccion_id', 'recibido_seleccion_at', 'nota_seleccion',
        'revision_final_id', 'revision_final_at', 'nota_revision_final',
    ];

    protected $casts = [
        'fecha_requerimiento' => 'date',
        'fecha_tentativa_ingreso' => 'date',
        'reviewed_at' => 'datetime',
        'aprobado_por_gerente_at' => 'datetime',
        'aprobado_por_th_at' => 'datetime',
        'recibido_seleccion_at' => 'datetime',
        'revision_final_at' => 'datetime',
        'disponibilidad_viajar' => 'boolean',
        'requiere_vehiculo' => 'boolean',
        'movilizacion' => 'boolean',
        'candidato_interno' => 'boolean',
        'experiencia_sectores' => 'array',
        'remuneracion_base' => 'float',
        'remuneracion_variable' => 'float',
        'remuneracion_total' => 'float',
        'movilizacion_monto' => 'float',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function aprobadoPorGerente(): BelongsTo
    {
        return $this->belongsTo(User::class, 'aprobado_por_gerente_id');
    }

    public function aprobadoPorTH(): BelongsTo
    {
        return $this->belongsTo(User::class, 'aprobado_por_th_id');
    }

    public function recibidoSeleccion(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recibido_seleccion_id');
    }

    public function revisionFinal(): BelongsTo
    {
        return $this->belongsTo(User::class, 'revision_final_id');
    }
}
