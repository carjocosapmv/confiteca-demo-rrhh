# Confiteca — Demo de Plataforma de Talento Humano

Demo comercial. **No es un sistema productivo**: no maneja dinero ni datos reales de
personas. Los módulos con cálculo sensible (nómina, IESS, conciliación de cartera) se
resuelven con datos sintéticos y formatos verosímiles, no con integraciones reales.

## Stack

| Capa | Tecnología |
|------|-----------|
| Backend | Laravel 13 · PHP 8.3+ · Sanctum (SPA por cookie) · SQLite |
| Frontend | Vite · React 18 · TypeScript · TanStack Query · Tailwind · shadcn/ui |
| Gráficos | Recharts |

## Correr la demo localmente

```bash
# 1. Backend
cd backend
composer install
cp .env.example .env
php artisan key:generate
touch database/database.sqlite
php artisan migrate:fresh --seed     # ~2 s, genera todo el dataset
php artisan serve --port=8001

# 2. Frontend (otra terminal)
npm install
npm run dev                          # http://localhost:8080
```

El frontend proxea `/api`, `/sanctum`, `/login` y `/logout` al backend en el puerto 8001
(ver `vite.config.ts`), así que las cookies de sesión funcionan sin configuración extra.

### Cuentas de demo

Todas usan la contraseña `demo123`.

| Email | Rol | Para mostrar |
|-------|-----|--------------|
| `admin@confiteca.com` | superadmin | Todo, incluida administración de permisos |
| `th@confiteca.com` | admin | Vista de Talento Humano (aprobador final) |
| `gerencia@confiteca.com` | admin | Vista de dirección |
| `jefe.planta@confiteca.com` | admin | Jefatura de Planta |
| `jefe.ventas@confiteca.com` | admin | Jefatura de Ventas |
| `medico@confiteca.com` | user | Dispensario médico |
| `supervisor@confiteca.com` | user | Supervisión de línea |
| `vendedor@confiteca.com` | user | Vendedor de campo |
| `colaborador@confiteca.com` | user | Colaborador raso |

## Dataset sintético

`ConfitecaWorkforceSeeder` genera ~320 personas con 36 meses de historia: jerarquía,
salarios con ajustes anuales, asistencia mensual, horas extra, desempeño semestral,
clima laboral y bajas. `ConfitecaOperationsSeeder` agrega atenciones médicas, comisiones
y ventas/depósitos diarios.

El dataset **no es ruido**: codifica una historia que el Dashboard de Rotación revela.

- Dos supervisores cuyos equipos se desangran (rotación > 40%, clima de liderazgo < 2.5).
- Curva de antigüedad realista: la rotación se concentra en los primeros 6 meses.
- Contratos temporales rotando muy por encima de los indefinidos.
- Ausentismo que sube en los 3 meses previos a cada renuncia (señal predictiva real).
- Tres vendedores que depositan sistemáticamente menos efectivo del que cobran,
  para el módulo de cartera/antifraude.

La estructura organizacional vive en `backend/app/Support/ConfitecaOrg.php` — es la
única fuente de verdad de unidades, áreas, puestos, bandas salariales y bancos. Seeders
y endpoints de catálogo leen de ahí, de modo que ninguna pantalla muestra un área que
otra desconoce.

**Reproducibilidad:** la semilla aleatoria es fija, pero el ancla de calendario es la
fecha real de ejecución. Una demo comercial siempre tiene que verse actual.

## Módulos

Heredados y funcionando: vacaciones/permisos, requisición de personal (TTHH-12),
inducción por actividades, descriptivos de cargo con versionado, notificaciones,
administración de usuarios y permisos.

Construido en este corte: **Dashboard de Rotación** (`/rotacion`) — 14 dimensiones de
análisis, tendencia mensual, motivos de salida y scoring de riesgo de fuga por reglas
explícitas.

Registrados en la matriz de permisos, pendientes de construcción: `copilot`,
`onboarding_ia`, `documentos`, `dispensario`, `evaluacion`, `nomina`, `reclutamiento`,
`cartera`.

## Scaffold de módulo

`src/components/module/` contiene las piezas que todo módulo nuevo debe reutilizar:
`ModulePage`, `StatCard`, `DataTable` (búsqueda, filtros, orden, paginación),
`DetailDrawer` y `ApprovalBar`. Las páginas heredadas no lo usan todavía porque cada una
reimplementó su propio markup — por eso pesan entre 300 y 750 líneas.

## Deploy

`backend/Dockerfile` + `backend/start.sh` levantan el servicio en cualquier host con
Docker. Todo lo específico del entorno va por variables: `APP_URL`, `DB_CONNECTION`,
`SANCTUM_STATEFUL_DOMAINS`, `CORS_ALLOWED_ORIGINS`, `PORT`.

`DEMO_RESET=true` (default) corre `migrate:fresh --seed` en cada arranque: la demo vuelve
siempre a un estado limpio y guionado. Poner `DEMO_RESET=false` para conservar datos.
