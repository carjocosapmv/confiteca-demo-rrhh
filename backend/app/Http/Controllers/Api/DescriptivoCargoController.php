<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\JobDescription;
use App\Models\JobDescriptionVersion;
use Illuminate\Http\JsonResponse;
use App\Support\ConfitecaOrg;
use Illuminate\Http\Request;

class DescriptivoCargoController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = JobDescription::query();

        if ($request->filled('empresa')) {
            $query->where('empresa', $request->empresa);
        }
        if ($request->filled('area')) {
            $query->where('area', $request->area);
        }
        if ($request->filled('estado')) {
            $query->where('estado', $request->estado);
        }
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where('nombre_cargo', 'like', "%{$search}%");
        }

        return response()->json([
            'data' => $query->orderBy('updated_at', 'desc')->get(),
        ]);
    }

    public function show(string $id): JsonResponse
    {
        $jd = JobDescription::with('versions')->findOrFail($id);
        return response()->json(['data' => $jd]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $this->validateForm($request);
        $validated['version_actual'] = 1;
        $validated['estado'] = 'borrador';

        $jd = JobDescription::create($validated);

        JobDescriptionVersion::create([
            'job_description_id' => $jd->id,
            'version' => 1,
            'estado' => 'borrador',
            'data' => $validated,
            'creado_por_nombre' => $request->user()->display_name,
        ]);

        return response()->json(['data' => $jd->load('versions'), 'message' => 'Descriptivo creado (v1)'], 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $jd = JobDescription::findOrFail($id);

        if ($jd->estado === 'aprobado') {
            return $this->crearNuevaVersion($jd, $request);
        }

        $validated = $this->validateForm($request);
        $jd->update($validated);

        if ($jd->estado === 'borrador') {
            $version = $jd->versions()->where('version', $jd->version_actual)->first();
            if ($version) {
                $version->update(['data' => $validated]);
            }
        }

        return response()->json(['data' => $jd->fresh()->load('versions'), 'message' => 'Descriptivo actualizado']);
    }

    public function cambiarEstado(Request $request, string $id): JsonResponse
    {
        $jd = JobDescription::findOrFail($id);
        $validated = $request->validate([
            'estado' => ['required', 'in:borrador,en_revision,aprobado,desactualizado'],
        ]);

        $jd->update(['estado' => $validated['estado']]);

        $version = $jd->versions()->where('version', $jd->version_actual)->first();
        if ($version) {
            $version->update(['estado' => $validated['estado']]);
        }

        return response()->json(['data' => $jd->fresh()->load('versions'), 'message' => 'Estado actualizado']);
    }

    public function destroy(string $id): JsonResponse
    {
        JobDescription::findOrFail($id)->delete();
        return response()->json(['message' => 'Eliminado']);
    }

    public function comparar(string $id, int $v1, int $v2): JsonResponse
    {
        $jd = JobDescription::findOrFail($id);
        $version1 = $jd->versions()->where('version', $v1)->firstOrFail();
        $version2 = $jd->versions()->where('version', $v2)->firstOrFail();

        return response()->json([
            'data' => [
                'cargo' => $jd->nombre_cargo,
                'empresa' => $jd->empresa,
                'version_1' => $version1,
                'version_2' => $version2,
            ],
        ]);
    }

    public function empresas(): JsonResponse
    {
        return response()->json(['data' => ConfitecaOrg::empresas()]);
    }

    public function areas(): JsonResponse
    {
        return response()->json(['data' => ConfitecaOrg::areas()]);
    }

    private function crearNuevaVersion(JobDescription $jd, Request $request): JsonResponse
    {
        $validated = $this->validateForm($request);
        $newVersion = $jd->version_actual + 1;

        // Mark current version as desactualizado
        $currentVersion = $jd->versions()->where('version', $jd->version_actual)->first();
        if ($currentVersion) {
            $currentVersion->update(['estado' => 'desactualizado']);
        }

        $jd->update([
            'version_actual' => $newVersion,
            'estado' => 'borrador',
        ]);

        // Update main record
        $jd->update($validated);

        JobDescriptionVersion::create([
            'job_description_id' => $jd->id,
            'version' => $newVersion,
            'estado' => 'borrador',
            'data' => $validated,
            'creado_por_nombre' => $request->user()->display_name,
        ]);

        return response()->json([
            'data' => $jd->fresh()->load('versions'),
            'message' => "Nueva versión v{$newVersion} creada a partir de descriptivo aprobado.",
        ]);
    }

    private function validateForm(Request $request): array
    {
        return $request->validate([
            'nombre_cargo' => ['required', 'string', 'max:255'],
            'empresa' => ['required', 'string', 'max:255'],
            'area' => ['required', 'string', 'max:255'],
            'jefe_inmediato' => ['nullable', 'string', 'max:255'],
            'mision_cargo' => ['nullable', 'string'],
            'funciones' => ['nullable', 'array'],
            'funciones.*.nombre' => ['required_with:funciones', 'string', 'max:255'],
            'funciones.*.actividades' => ['nullable', 'array'],
            'funciones.*.actividades.*' => ['string', 'max:500'],
            'nivel_formacion' => ['nullable', 'string', 'max:255'],
            'area_estudios' => ['nullable', 'string', 'max:255'],
            'certificaciones' => ['nullable', 'string'],
            'anios_experiencia' => ['nullable', 'integer', 'min:0'],
            'experiencia_descripcion' => ['nullable', 'string'],
            'competencias_tecnicas' => ['nullable', 'array'],
            'competencias_tecnicas.*.nombre' => ['required_with:competencias_tecnicas', 'string', 'max:255'],
            'competencias_tecnicas.*.nivel' => ['required_with:competencias_tecnicas', 'in:Alto,Medio,Bajo'],
            'competencias_conductuales' => ['nullable', 'array'],
            'competencias_conductuales.*.nombre' => ['required_with:competencias_conductuales', 'string', 'max:255'],
            'competencias_conductuales.*.nivel' => ['required_with:competencias_conductuales', 'in:Alto,Medio,Bajo'],
            'elaborado_por_nombre' => ['nullable', 'string', 'max:255'],
            'elaborado_por_cargo' => ['nullable', 'string', 'max:255'],
            'fecha_elaboracion' => ['nullable', 'date'],
        ]);
    }
}
