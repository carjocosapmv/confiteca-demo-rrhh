<?php

namespace App\Http\Controllers\Api;

use App\Models\LeaveRequest;
use App\Models\MedicalLeaveBalance;
use App\Models\Notification;
use App\Models\PersonalLeaveBalance;
use App\Models\RemoteWorkBalance;
use App\Models\VacationBalance;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LeaveRequestController extends ApiController
{
    protected function model(): string
    {
        return LeaveRequest::class;
    }

    protected function rules(): array
    {
        return [
            'request_type' => ['required', 'in:vacation,remote_work,personal,medical,hourly'],
            'start_date' => ['required', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'return_date' => ['nullable', 'date', 'after:end_date'],
            'hora_salida' => ['nullable', 'date_format:H:i'],
            'hora_retorno' => ['nullable', 'date_format:H:i', 'after:hora_salida'],
            'days_requested' => ['required', 'integer', 'min:0'],
            'days_charged' => ['required', 'integer', 'min:0'],
            'weekend_days_included' => ['integer', 'min:0'],
            'uses_weekend_rule' => ['boolean'],
            'notes' => ['nullable', 'string'],
        ];
    }

    protected function updateRules($model): array
    {
        // Only pending requests can be modified by the user
        if ($model->status === 'pending' && !auth()->user()->isAdmin()) {
            return [
                'start_date' => ['required', 'date'],
                'end_date' => ['required', 'date', 'after_or_equal:start_date'],
                'return_date' => ['nullable', 'date', 'after:end_date'],
                'days_requested' => ['required', 'integer', 'min:0'],
                'days_charged' => ['required', 'integer', 'min:0'],
                'weekend_days_included' => ['integer', 'min:0'],
                'uses_weekend_rule' => ['boolean'],
                'notes' => ['nullable', 'string'],
            ];
        }

        return [
            'status' => ['required', 'in:pending,approved,rejected'],
            'reviewed_by' => ['nullable', 'uuid', 'exists:users,id'],
        ];
    }

    protected function defaultLoads(): array
    {
        return ['user', 'reviewer'];
    }

    protected function applyFilters(Builder $query, Request $request): Builder
    {
        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('request_type')) {
            $query->where('request_type', $request->input('request_type'));
        }

        if ($request->filled('user_id')) {
            $query->where('user_id', $request->input('user_id'));
        }

        // Non-admins can only see their own requests
        $user = auth()->user();
        if (!$user->isAdmin() && !$user->isSuperAdmin()) {
            $query->where('user_id', $user->id);
        }

        return $query;
    }

    protected function defaultSort(): array
    {
        return ['created_at', 'desc'];
    }

    protected function beforeCreate(array $validated, Request $request): array
    {
        $validated['user_id'] = auth()->id();
        $validated['status'] = 'pending';

        return $validated;
    }

    protected function beforeDelete($model): void
    {
        // Only pending requests can be deleted by the user
        if ($model->status !== 'pending' && !auth()->user()->isAdmin()) {
            abort(403, 'Only pending requests can be deleted.');
        }

        if ($model->user_id !== auth()->id() && !auth()->user()->isAdmin()) {
            abort(403, 'You can only delete your own requests.');
        }
    }

    /**
     * Review (approve/reject) a leave request.
     */
    public function review(Request $request, LeaveRequest $leaveRequest): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['required', 'in:approved,rejected'],
            'nota_revision' => ['nullable', 'string'],
        ]);

        if ($leaveRequest->status !== 'pending') {
            return response()->json(['message' => 'Only pending requests can be reviewed'], 400);
        }

        $leaveRequest->update([
            'status' => $validated['status'],
            'reviewed_by' => auth()->id(),
            'reviewed_at' => now(),
            'nota_revision' => $validated['nota_revision'] ?? null,
        ]);

        // If approved, update balances
        if ($validated['status'] === 'approved') {
            $typeLabels = [
                'vacation' => 'Vacaciones',
                'remote_work' => 'Teletrabajo',
                'personal' => 'Permiso personal',
                'medical' => 'Visita médica',
                'hourly' => 'Permiso por horas',
            ];

            $balance = match ($leaveRequest->request_type) {
                'vacation' => VacationBalance::where('user_id', $leaveRequest->user_id)
                    ->where('year', now()->year)
                    ->first(),
                'remote_work' => RemoteWorkBalance::where('user_id', $leaveRequest->user_id)
                    ->latest('created_at')
                    ->first(),
                'personal' => PersonalLeaveBalance::where('user_id', $leaveRequest->user_id)
                    ->latest('created_at')
                    ->first(),
                'medical' => MedicalLeaveBalance::where('user_id', $leaveRequest->user_id)
                    ->latest('created_at')
                    ->first(),
                default => null,
            };

            if ($balance) {
                $balance->increment('used_days', $leaveRequest->days_charged);
                if ($leaveRequest->request_type === 'vacation' && $leaveRequest->uses_weekend_rule) {
                    $balance->increment('weekend_rule_uses');
                }
            }
        }

        $typeLabels = [
            'vacation' => 'vacaciones',
            'remote_work' => 'teletrabajo',
            'personal' => 'permiso personal',
            'medical' => 'visita médica',
            'hourly' => 'permiso por horas',
        ];
        $label = $typeLabels[$leaveRequest->request_type] ?? $leaveRequest->request_type;

        // Create notification for the requester
        Notification::create([
            'user_id' => $leaveRequest->user_id,
            'title' => $validated['status'] === 'approved' ? 'Solicitud aprobada' : 'Solicitud rechazada',
            'message' => sprintf(
                'Tu solicitud de %s ha sido %s.',
                $label,
                $validated['status'] === 'approved' ? 'aprobada' : 'rechazada'
            ),
            'type' => $validated['status'] === 'approved' ? 'success' : 'error',
            'reference_id' => $leaveRequest->id,
            'reference_type' => 'leave_request',
        ]);

        return response()->json([
            'message' => 'Request reviewed successfully',
            'status' => $validated['status'],
        ]);
    }
}
