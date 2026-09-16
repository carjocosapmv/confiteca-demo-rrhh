<?php

namespace Database\Seeders;

use App\Models\RolePermission;
use Illuminate\Database\Seeder;

/**
 * Module permission matrix.
 *
 * Declarative on purpose: the previous version hardcoded one row per
 * role/module pair (80+ literals) which made adding a module a merge conflict
 * waiting to happen. Adding a module now means one line in MODULES.
 */
class RolePermissionSeeder extends Seeder
{
    /** Every module key the SPA can guard, in sidebar order */
    public const MODULES = [
        // Inherited, already implemented
        'dashboard',
        'vacaciones',
        'vacantes',
        'onboarding',
        'induccion',
        // Confiteca scope
        'rotacion',
        'copilot',
        'onboarding_ia',
        'documentos',
        'dispensario',
        'evaluacion',
        'nomina',
        'reclutamiento',
        'cartera',
        // Administration
        'admin_usuarios',
        'admin_permisos',
    ];

    /** module => [can_view, can_edit] for the "user" (colaborador) role */
    private const USER_ACCESS = [
        'dashboard' => [true, false],
        'vacaciones' => [true, true],
        'onboarding' => [true, false],
        'induccion' => [true, false],
        'onboarding_ia' => [true, true],
        'documentos' => [true, true],
        'evaluacion' => [true, true],
        'copilot' => [true, true],
        'dispensario' => [true, false],
    ];

    /** module => [can_view, can_edit] for the read-only "viewer" role */
    private const VIEWER_ACCESS = [
        'dashboard' => [true, false],
        'vacaciones' => [true, false],
        'rotacion' => [true, false],
        'evaluacion' => [true, false],
        'onboarding' => [true, false],
    ];

    public function run(): void
    {
        foreach (self::MODULES as $module) {
            foreach (['superadmin', 'admin', 'user', 'viewer'] as $role) {
                [$canView, $canEdit] = $this->accessFor($role, $module);

                RolePermission::updateOrCreate(
                    ['role' => $role, 'module_key' => $module],
                    ['can_view' => $canView, 'can_edit' => $canEdit]
                );
            }
        }

        $this->command->info('  ✓ '.count(self::MODULES).' módulos × 4 roles');
    }

    /** @return array{0:bool,1:bool} */
    private function accessFor(string $role, string $module): array
    {
        return match ($role) {
            // Superadmin bypasses Gates anyway; the rows keep the admin UI honest.
            'superadmin' => [true, true],

            // Admin runs HR but cannot grant itself privileges.
            'admin' => in_array($module, ['admin_usuarios', 'admin_permisos'], true)
                ? [false, false]
                : [true, true],

            'user' => self::USER_ACCESS[$module] ?? [false, false],

            'viewer' => self::VIEWER_ACCESS[$module] ?? [false, false],

            default => [false, false],
        };
    }
}
