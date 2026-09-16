<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('Sembrando demo Confiteca...');

        $this->call([
            // Permission matrix first: everything else assumes modules exist.
            RolePermissionSeeder::class,

            // Master dataset. Every other seeder reads people from here.
            ConfitecaWorkforceSeeder::class,
            ConfitecaOperationsSeeder::class,

            // Module-specific demo narratives.
            ConfitecaRequestsSeeder::class,
            InduccionSeeder::class,
            DescriptivoCargoSeeder::class,
            OnboardingChapterSeeder::class,
        ]);

        $this->command->info('Demo lista. Ingreso: admin@confiteca.com / demo123');
    }
}
