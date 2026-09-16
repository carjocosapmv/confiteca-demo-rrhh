<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LeaveRequest;
use App\Models\User;
use App\Models\VacationBalance;
use App\Services\VacationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class VacationController extends Controller
{
    protected VacationService $vacationService;

    public function __construct(VacationService $vacationService)
    {
        $this->vacationService = $vacationService;
    }

    /**
     * Calculate vacation days between two dates.
     */
    public function calculateDays(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
        ]);

        $result = $this->vacationService->calculateVacationDays(
            $validated['start_date'],
            $validated['end_date']
        );

        return response()->json($result);
    }

    /**
     * Get vacation balance for authenticated user.
     */
    public function getBalance(Request $request): JsonResponse
    {
        $year = (int) $request->input('year', now()->year);
        $user = auth()->user();

        $balance = $this->vacationService->getVacationBalance($user, $year);

        return response()->json([
            'year' => $year,
            'balance' => $balance,
        ]);
    }

    /**
     * Get remote work balance for authenticated user.
     */
    public function getRemoteBalance(): JsonResponse
    {
        $user = auth()->user();
        $balance = $this->vacationService->getRemoteWorkBalance($user);

        return response()->json(['balance' => $balance]);
    }

    /**
     * Approve a leave request.
     */
    public function approve(LeaveRequest $leaveRequest): JsonResponse
    {
        $success = $this->vacationService->approveLeaveRequest($leaveRequest);

        if (!$success) {
            return response()->json([
                'message' => 'Failed to approve. Insufficient balance or invalid request.',
            ], 422);
        }

        $leaveRequest->update([
            'status' => 'approved',
            'reviewed_by' => auth()->id(),
            'reviewed_at' => now(),
        ]);

        $this->vacationService->notifyLeaveRequestStatus($leaveRequest);

        return response()->json([
            'message' => 'Leave request approved',
            'leave_request' => $leaveRequest->load('user'),
        ]);
    }

    /**
     * Reject a leave request.
     */
    public function reject(LeaveRequest $leaveRequest): JsonResponse
    {
        $success = $this->vacationService->rejectLeaveRequest($leaveRequest);

        if (!$success) {
            return response()->json([
                'message' => 'Failed to reject request.',
            ], 422);
        }

        $leaveRequest->update([
            'reviewed_by' => auth()->id(),
            'reviewed_at' => now(),
        ]);

        $this->vacationService->notifyLeaveRequestStatus($leaveRequest);

        return response()->json([
            'message' => 'Leave request rejected',
            'leave_request' => $leaveRequest->load('user'),
        ]);
    }

    /**
     * Get all approved absences for a given month (calendar view).
     */
    public function calendar(Request $request): JsonResponse
    {
        $request->validate([
            'month' => ['required', 'date_format:Y-m'],
            'departamento' => ['nullable', 'string'],
        ]);

        $month = $request->input('month');
        $query = LeaveRequest::with(['user', 'reviewer'])
            ->where('status', 'approved')
            ->where(function ($q) use ($month) {
                $q->whereMonth('start_date', substr($month, 5, 2))
                  ->whereYear('start_date', substr($month, 0, 4));
            });

        if ($request->filled('departamento')) {
            $query->whereHas('user', function ($q) use ($request) {
                $q->whereHas('businessUnit', function ($q2) use ($request) {
                    $q2->where('nombre', $request->input('departamento'));
                });
            });
        }

        return response()->json($query->get());
    }

    /**
     * RRHH Dashboard: summary of balances, pending requests, today's absences.
     */
    public function rrhhDashboard(): JsonResponse
    {
        $today = now()->format('Y-m-d');
        $year = now()->year;

        $pendingRequests = LeaveRequest::with(['user', 'reviewer'])
            ->where('status', 'pending')
            ->latest()
            ->get();

        $todayAbsences = LeaveRequest::with('user')
            ->where('status', 'approved')
            ->whereDate('start_date', '<=', $today)
            ->where(function ($q) use ($today) {
                $q->whereDate('end_date', '>=', $today)
                  ->orWhereNull('end_date');
            })
            ->get();

        $balances = VacationBalance::with('user')
            ->where('year', $year)
            ->get()
            ->map(function ($b) {
                return [
                    'user' => $b->user ? ['id' => $b->user->id, 'display_name' => $b->user->display_name] : null,
                    'total_days' => $b->total_days,
                    'used_days' => $b->used_days,
                    'available_days' => $b->total_days - $b->used_days,
                ];
            });

        return response()->json([
            'pending_requests' => $pendingRequests,
            'today_absences' => $todayAbsences,
            'balances' => $balances,
        ]);
    }
}
