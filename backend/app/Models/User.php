<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, HasUuids, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'email',
        'password',
        'display_name',
        'avatar_url',
        'hire_date',
        'is_financial_admin',
        'security_watermark_enabled',
        'business_unit_id',
        'puesto_id',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'hire_date' => 'date',
            'is_financial_admin' => 'boolean',
            'security_watermark_enabled' => 'boolean',
        ];
    }

    // ── Relationships ──────────────────────────────────────────────

    public function roles(): HasMany
    {
        return $this->hasMany(UserRole::class);
    }

    public function unitAssignments(): HasMany
    {
        return $this->hasMany(UserUnitAssignment::class);
    }

    public function businessUnit(): BelongsTo
    {
        return $this->belongsTo(BusinessUnit::class);
    }

    public function puesto(): BelongsTo
    {
        return $this->belongsTo(Puesto::class);
    }

    public function relationships(): HasOne
    {
        return $this->hasOne(UserRelationship::class);
    }

    public function vacationBalance(): HasMany
    {
        return $this->hasMany(VacationBalance::class);
    }

    public function remoteWorkBalance(): HasOne
    {
        return $this->hasOne(RemoteWorkBalance::class);
    }

    public function personalLeaveBalance(): HasOne
    {
        return $this->hasOne(PersonalLeaveBalance::class);
    }

    public function medicalLeaveBalance(): HasOne
    {
        return $this->hasOne(MedicalLeaveBalance::class);
    }

    public function leaveRequests(): HasMany
    {
        return $this->hasMany(LeaveRequest::class);
    }

    public function notifications(): HasMany
    {
        return $this->hasMany(Notification::class);
    }

    public function onboardingProgress(): HasMany
    {
        return $this->hasMany(OnboardingProgress::class);
    }

    // ── HR analytics ───────────────────────────────────────────────

    public function employment(): HasOne
    {
        return $this->hasOne(EmploymentRecord::class);
    }

    public function compensations(): HasMany
    {
        return $this->hasMany(Compensation::class);
    }

    public function termination(): HasOne
    {
        return $this->hasOne(Termination::class);
    }

    public function attendanceMonths(): HasMany
    {
        return $this->hasMany(AttendanceMonth::class);
    }

    public function performanceReviews(): HasMany
    {
        return $this->hasMany(PerformanceReview::class);
    }

    public function climateResponses(): HasMany
    {
        return $this->hasMany(ClimateResponse::class);
    }

    public function medicalVisits(): HasMany
    {
        return $this->hasMany(MedicalVisit::class);
    }

    public function bankAccount(): HasOne
    {
        return $this->hasOne(BankAccount::class);
    }

    public function commissionRecords(): HasMany
    {
        return $this->hasMany(CommissionRecord::class);
    }

    /** Current salary agreement (latest effective compensation row). */
    public function currentCompensation(): HasOne
    {
        return $this->hasOne(Compensation::class)->latestOfMany('vigente_desde');
    }

    // ── Role Helpers ────────────────────────────────────────────────

    public function hasRole(string $role): bool
    {
        return $this->roles()->where('role', $role)->exists();
    }

    public function hasAnyRole(array $roles): bool
    {
        return $this->roles()->whereIn('role', $roles)->exists();
    }

    public function isSuperAdmin(): bool
    {
        return $this->hasRole('superadmin');
    }

    public function isAdmin(): bool
    {
        return $this->isSuperAdmin() || $this->hasRole('admin');
    }

    public function isFinancialAdmin(): bool
    {
        return $this->isSuperAdmin() || $this->is_financial_admin;
    }

    public function isViewer(): bool
    {
        return $this->hasRole('viewer') && ! $this->isAdmin();
    }

    /**
     * Get the highest priority role for this user.
     */
    public function getHighestRole(): ?string
    {
        $priority = ['superadmin', 'admin', 'user', 'viewer'];

        foreach ($priority as $role) {
            if ($this->hasRole($role)) {
                return $role;
            }
        }

        return null;
    }

    // ── Permission Helpers ──────────────────────────────────────────

    public function canAccessModule(string $moduleKey, string $ability = 'view'): bool
    {
        if ($this->isSuperAdmin()) {
            return true;
        }

        $permission = RolePermission::where('module_key', $moduleKey)
            ->whereIn('role', $this->roles()->pluck('role'))
            ->first();

        if (! $permission) {
            return false;
        }

        return $ability === 'view' ? $permission->can_view : $permission->can_edit;
    }

    public function canViewModule(string $moduleKey): bool
    {
        return $this->canAccessModule($moduleKey, 'view');
    }

    public function canEditModule(string $moduleKey): bool
    {
        return $this->canAccessModule($moduleKey, 'edit');
    }

    // ── Unit Access ─────────────────────────────────────────────────

    public function getAssignedUnitIds(): array
    {
        if ($this->isSuperAdmin()) {
            return []; // Superadmin sees all
        }

        return $this->unitAssignments()->pluck('unidad_negocio_id')->toArray();
    }

    // ── Scope ───────────────────────────────────────────────────────

    public function scopeWithRole($query, string $role)
    {
        return $query->whereHas('roles', fn ($q) => $q->where('role', $role));
    }
}
