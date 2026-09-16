<?php

namespace App\Providers;

use App\Models\BusinessUnit;
use App\Models\InductionActivity;
use App\Models\InductionProgram;
use App\Models\JobDescription;
use App\Models\JobDescriptionVersion;
use App\Models\LeaveRequest;
use App\Models\MedicalLeaveBalance;
use App\Models\Notification;
use App\Models\OnboardingChapter;
use App\Models\OnboardingProgress;
use App\Models\OnboardingVideo;
use App\Models\PersonalLeaveBalance;
use App\Models\Puesto;
use App\Models\RemoteWorkBalance;
use App\Models\RolePermission;
use App\Models\User;
use App\Models\UserRelationship;
use App\Models\UserRole;
use App\Models\UserUnitAssignment;
use App\Models\VacancyRequest;
use App\Models\VacationBalance;
use App\Policies\BusinessUnitPolicy;
use App\Policies\ModelPolicy;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Gate;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * The model to policy mappings for the application.
     *
     * @var array<class-string, class-string>
     */
    protected $policies = [
        BusinessUnit::class => BusinessUnitPolicy::class,

        InductionActivity::class => ModelPolicy::class,
        InductionProgram::class => ModelPolicy::class,
        JobDescription::class => ModelPolicy::class,
        JobDescriptionVersion::class => ModelPolicy::class,
        LeaveRequest::class => ModelPolicy::class,
        MedicalLeaveBalance::class => ModelPolicy::class,
        Notification::class => ModelPolicy::class,
        OnboardingChapter::class => ModelPolicy::class,
        OnboardingProgress::class => ModelPolicy::class,
        OnboardingVideo::class => ModelPolicy::class,
        PersonalLeaveBalance::class => ModelPolicy::class,
        Puesto::class => ModelPolicy::class,
        RemoteWorkBalance::class => ModelPolicy::class,
        RolePermission::class => ModelPolicy::class,
        User::class => ModelPolicy::class,
        UserRelationship::class => ModelPolicy::class,
        UserRole::class => ModelPolicy::class,
        UserUnitAssignment::class => ModelPolicy::class,
        VacancyRequest::class => ModelPolicy::class,
        VacationBalance::class => ModelPolicy::class,
    ];

    /**
     * Register any authentication / authorization services.
     */
    public function boot(): void
    {
        // Superadmin bypass
        Gate::before(function ($user, $ability) {
            if ($user->isAdmin()) {
                return true;
            }

            return null;
        });
    }
}
