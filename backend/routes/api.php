<?php

use App\Http\Controllers\Api\AdminUserController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BusinessUnitController;
use App\Http\Controllers\Api\LeaveRequestController;
use App\Http\Controllers\Api\NominaController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\MedicalLeaveBalanceController;
use App\Http\Controllers\Api\DescriptivoCargoController;
use App\Http\Controllers\Api\InduccionController;
use App\Http\Controllers\Api\OnboardingController;
use App\Http\Controllers\Api\PersonalLeaveBalanceController;
use App\Http\Controllers\Api\PuestoController;
use App\Http\Controllers\Api\RemoteWorkBalanceController;
use App\Http\Controllers\Api\RolePermissionController;
use App\Http\Controllers\Api\RotacionController;
use App\Http\Controllers\Api\VacationBalanceController;
use App\Http\Controllers\Api\PermisoVacacionController;
use App\Http\Controllers\Api\RequisicionPersonalController;
use App\Http\Controllers\Api\VacationController;
use Illuminate\Support\Facades\Route;

// Public routes
Route::post('/login', [AuthController::class, 'login'])->middleware(['web', 'throttle:login']);

// Protected routes
Route::middleware(['auth:sanctum', 'throttle:api'])->group(function () {
    // Auth
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/register', [AuthController::class, 'register']);

    // Catalog (used by User profiles)
    Route::apiResource('business-units', BusinessUnitController::class);
    Route::apiResource('puestos', PuestoController::class);

    // HR: Leave & Absences
    Route::apiResource('leave-requests', LeaveRequestController::class);
    Route::post('/leave-requests/{leave_request}/review', [LeaveRequestController::class, 'review']);
    Route::apiResource('vacation-balances', VacationBalanceController::class);
    Route::apiResource('remote-work-balances', RemoteWorkBalanceController::class);
    Route::apiResource('personal-leave-balances', PersonalLeaveBalanceController::class);
    Route::apiResource('medical-leave-balances', MedicalLeaveBalanceController::class);

    // Notifications
    Route::apiResource('notifications', NotificationController::class)->only(['index', 'store', 'show', 'update', 'destroy']);
    Route::post('/notifications/{notification}/read', [NotificationController::class, 'markAsRead']);
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllAsRead']);
    Route::post('/notifications/mark-all-read', [NotificationController::class, 'markAllAsRead']);
    Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);

    // Admin
    Route::prefix('admin')->middleware('throttle:admin')->group(function () {
        Route::apiResource('users', AdminUserController::class);
        Route::get('/user-roles', [AdminUserController::class, 'getUserRoles']);
        Route::get('/user-unit-assignments', [AdminUserController::class, 'getUserUnitAssignments']);
        Route::post('/users/{user}/change-role', [AdminUserController::class, 'changeRole']);
        Route::post('/users/{user}/assign-units', [AdminUserController::class, 'assignUnits']);
        Route::delete('/users/{user}/units/{unitId}', [AdminUserController::class, 'removeUnit']);
        Route::put('/users/{user}/financial-admin', [AdminUserController::class, 'toggleFinancialAdmin']);
        Route::put('/users/{user}/security-watermark', [AdminUserController::class, 'toggleSecurityWatermark']);

        Route::get('/role-permissions', [RolePermissionController::class, 'index']);
        Route::get('/role-permissions/{role}', [RolePermissionController::class, 'getByRole']);
        Route::put('/role-permissions', [RolePermissionController::class, 'updateBulk']);
        Route::put('/role-permissions/{role}/{moduleKey}', [RolePermissionController::class, 'updateSingle']);
    });

    // Vacancy Requests / Requisición de Personal
    Route::apiResource('vacancy-requests', RequisicionPersonalController::class);
    Route::post('/vacancy-requests/{vacancy_request}/enviar', [RequisicionPersonalController::class, 'enviar']);
    Route::post('/vacancy-requests/{vacancy_request}/aprobar-gerente', [RequisicionPersonalController::class, 'aprobarGerente']);
    Route::post('/vacancy-requests/{vacancy_request}/aprobar-th', [RequisicionPersonalController::class, 'aprobarTH']);
    Route::post('/vacancy-requests/{vacancy_request}/recibir-seleccion', [RequisicionPersonalController::class, 'recibirSeleccion']);
    Route::post('/vacancy-requests/{vacancy_request}/revision-final', [RequisicionPersonalController::class, 'revisionFinal']);
    Route::post('/vacancy-requests/{vacancy_request}/rechazar', [RequisicionPersonalController::class, 'rechazar']);

    // Onboarding
    Route::prefix('onboarding')->group(function () {
        Route::get('/videos', [OnboardingController::class, 'videos']);
        Route::post('/mark-watched', [OnboardingController::class, 'markWatched']);
        Route::post('/mark-unwatched', [OnboardingController::class, 'markUnwatched']);
        Route::get('/rrhh', [OnboardingController::class, 'rrhhIndex']);
        Route::get('/assigned-users', [OnboardingController::class, 'assignedUsers']);
        Route::post('/users/{user}/toggle-assignment', [OnboardingController::class, 'toggleAssignment']);

        // Admin: manage content
        Route::get('/admin/chapters', [OnboardingController::class, 'adminChapters']);
        Route::post('/admin/chapters', [OnboardingController::class, 'storeChapter']);
        Route::put('/admin/chapters/{chapter}', [OnboardingController::class, 'updateChapter']);
        Route::delete('/admin/chapters/{chapter}', [OnboardingController::class, 'deleteChapter']);
        Route::post('/admin/videos', [OnboardingController::class, 'storeVideo']);
        Route::put('/admin/videos/{video}', [OnboardingController::class, 'updateVideo']);
        Route::delete('/admin/videos/{video}', [OnboardingController::class, 'deleteVideo']);
        Route::post('/admin/users/{user}/reset-progress', [OnboardingController::class, 'resetUserProgress']);
    });

    // Inducción (programa por actividades)
    Route::prefix('induccion')->group(function () {
        Route::get('/mi-programa', [InduccionController::class, 'miPrograma']);
        Route::post('/encuesta', [InduccionController::class, 'guardarEncuesta']);
        Route::post('/certificado', [InduccionController::class, 'generarCertificado']);

        Route::get('/facilitador/colaboradores', [InduccionController::class, 'facilitadorColaboradores']);
        Route::put('/actividades/{induction_activity}', [InduccionController::class, 'updateActividad']);

        Route::get('/th/resumen', [InduccionController::class, 'thResumen']);
        Route::get('/th', [InduccionController::class, 'thIndex']);
        Route::get('/th/{id}', [InduccionController::class, 'thDetalle']);
        Route::post('/th/programas', [InduccionController::class, 'thCrearPrograma']);
        Route::get('/th/catalogos/empresas', [InduccionController::class, 'thEmpresas']);
        Route::get('/th/catalogos/areas', [InduccionController::class, 'thAreas']);
        Route::get('/th/catalogos/facilitadores', [InduccionController::class, 'thFacilitadores']);
    });

    // Rotación y analítica de talento
    Route::prefix('rotacion')->group(function () {
        Route::get('/dashboard', [RotacionController::class, 'dashboard']);
        Route::get('/colaboradores', [RotacionController::class, 'colaboradores']);
        Route::get('/riesgo', [RotacionController::class, 'riesgo']);
        Route::get('/dimension/{dimension}', [RotacionController::class, 'dimension']);
    });

    // Nómina — calculadora de estimados (solo lectura).
    //
    // Unlike the other modules, this one enforces the module permission on the
    // SERVER too: these endpoints expose individual salaries, so frontend-only
    // gating would leave the data one guessed URL away. `nomina` is granted to
    // admin/superadmin only (see RolePermissionSeeder).
    Route::prefix('nomina')->middleware('permission:nomina')->group(function () {
        Route::get('/dashboard', [NominaController::class, 'dashboard']);
        Route::get('/colaboradores', [NominaController::class, 'colaboradores']);
        Route::get('/supuestos', [NominaController::class, 'supuestos']);
        Route::get('/colaboradores/{userId}', [NominaController::class, 'detalle']);
    });

    // Vacation endpoints
    Route::prefix('vacation')->group(function () {
        Route::post('/calculate-days', [VacationController::class, 'calculateDays']);
        Route::get('/balance', [VacationController::class, 'getBalance']);
        Route::get('/remote-balance', [VacationController::class, 'getRemoteBalance']);
        Route::post('/leave-requests/{leaveRequest}/approve', [VacationController::class, 'approve']);
        Route::post('/leave-requests/{leaveRequest}/reject', [VacationController::class, 'reject']);
        Route::get('/calendar', [VacationController::class, 'calendar']);
        Route::get('/rrhh-dashboard', [VacationController::class, 'rrhhDashboard']);
    });

    // Descriptivos de Cargo
    Route::prefix('descriptivos')->group(function () {
        Route::get('/', [DescriptivoCargoController::class, 'index']);
        Route::post('/', [DescriptivoCargoController::class, 'store']);
        Route::get('/{id}', [DescriptivoCargoController::class, 'show']);
        Route::put('/{id}', [DescriptivoCargoController::class, 'update']);
        Route::delete('/{id}', [DescriptivoCargoController::class, 'destroy']);
        Route::post('/{id}/cambiar-estado', [DescriptivoCargoController::class, 'cambiarEstado']);
        Route::get('/{id}/comparar/{v1}/{v2}', [DescriptivoCargoController::class, 'comparar']);
        Route::get('/catalogos/empresas', [DescriptivoCargoController::class, 'empresas']);
        Route::get('/catalogos/areas', [DescriptivoCargoController::class, 'areas']);
    });

    // Permisos y Vacaciones (extended module)
    Route::prefix('permisos-vacaciones')->group(function () {
        Route::get('/solicitudes', [PermisoVacacionController::class, 'index']);
        Route::get('/mis-solicitudes', [PermisoVacacionController::class, 'misSolicitudes']);
        Route::get('/pendientes-jefe', [PermisoVacacionController::class, 'pendientesJefe']);
        Route::get('/pendientes-th', [PermisoVacacionController::class, 'pendientesTH']);
        Route::post('/permisos', [PermisoVacacionController::class, 'storePermiso']);
        Route::post('/vacaciones', [PermisoVacacionController::class, 'storeVacacion']);
        Route::post('/{leave_request}/aprobar-jefe', [PermisoVacacionController::class, 'aprobarJefe']);
        Route::post('/{leave_request}/aprobar-th', [PermisoVacacionController::class, 'aprobarTH']);
        Route::post('/{leave_request}/rechazar', [PermisoVacacionController::class, 'rechazar']);
        Route::get('/calendario', [PermisoVacacionController::class, 'calendario']);
        Route::get('/saldo', [PermisoVacacionController::class, 'saldoMockeado']);
    });
});
