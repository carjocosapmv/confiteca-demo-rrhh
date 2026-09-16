<?php

namespace App\Services;

use App\Models\LeaveRequest;
use App\Models\Notification;
use App\Models\RemoteWorkBalance;
use App\Models\User;
use App\Models\VacationBalance;
use Illuminate\Support\Facades\DB;

class VacationService
{
    /**
     * Calculate vacation days between two dates, excluding weekends.
     *
     * Weekend rule: if the leave spans a weekend, weekend days are not
     * charged against the vacation balance.
     */
    public function calculateVacationDays(string $startDate, string $endDate): array
    {
        $start = \Carbon\Carbon::parse($startDate);
        $end = \Carbon\Carbon::parse($endDate);
        $totalDays = $start->diffInDays($end) + 1;

        $weekendDays = 0;
        $current = $start->copy();

        while ($current->lte($end)) {
            if ($current->isWeekend()) {
                $weekendDays++;
            }
            $current->addDay();
        }

        $businessDays = $totalDays - $weekendDays;

        return [
            'total_days' => $totalDays,
            'weekend_days' => $weekendDays,
            'business_days' => $businessDays,
            'uses_weekend_rule' => $weekendDays > 0,
        ];
    }

    /**
     * Calculate return date based on business days.
     */
    public function calculateReturnDate(string $startDate, int $businessDays): string
    {
        $start = \Carbon\Carbon::parse($startDate);
        $current = $start->copy();
        $counted = 0;

        while ($counted < $businessDays) {
            $current->addDay();
            if ($current->isWeekday()) {
                $counted++;
            }
        }

        return $current->format('Y-m-d');
    }

    /**
     * Process a leave request approval.
     * Deducts days from the appropriate balance.
     */
    public function approveLeaveRequest(LeaveRequest $request): bool
    {
        return DB::transaction(function () use ($request) {
            $user = User::find($request->user_id);
            if (!$user) {
                return false;
            }

            $year = \Carbon\Carbon::parse($request->start_date)->year;

            if ($request->request_type === 'vacation') {
                return $this->deductVacationDays($user, $year, $request->days_charged, $request->uses_weekend_rule);
            }

            if ($request->request_type === 'remote_work') {
                return $this->deductRemoteWorkDays($user, $request->days_charged);
            }

            return false;
        });
    }

    /**
     * Deduct vacation days from user's balance.
     */
    private function deductVacationDays(User $user, int $year, int $days, bool $usesWeekendRule): bool
    {
        $balance = VacationBalance::where('user_id', $user->id)
            ->where('year', $year)
            ->first();

        if (!$balance) {
            return false;
        }

        $remaining = $balance->total_days - $balance->used_days;

        if ($days > $remaining) {
            return false;
        }

        $balance->increment('used_days', $days);

        if ($usesWeekendRule) {
            $balance->increment('weekend_rule_uses');
        }

        return true;
    }

    /**
     * Deduct remote work days from user's balance.
     */
    private function deductRemoteWorkDays(User $user, int $days): bool
    {
        $balance = RemoteWorkBalance::where('user_id', $user->id)->first();

        if (!$balance) {
            return false;
        }

        $remaining = $balance->total_days - $balance->used_days;

        if ($days > $remaining) {
            return false;
        }

        $balance->increment('used_days', $days);

        return true;
    }

    /**
     * Reject a leave request and restore days if it was previously approved.
     */
    public function rejectLeaveRequest(LeaveRequest $request): bool
    {
        if ($request->status !== 'approved') {
            $request->update(['status' => 'rejected']);
            return true;
        }

        return DB::transaction(function () use ($request) {
            $user = User::find($request->user_id);
            $year = \Carbon\Carbon::parse($request->start_date)->year;

            if ($request->request_type === 'vacation') {
                $balance = VacationBalance::where('user_id', $user->id)
                    ->where('year', $year)
                    ->first();

                if ($balance) {
                    $balance->decrement('used_days', $request->days_charged);
                }
            }

            if ($request->request_type === 'remote_work') {
                $balance = RemoteWorkBalance::where('user_id', $user->id)->first();

                if ($balance) {
                    $balance->decrement('used_days', $request->days_charged);
                }
            }

            $request->update(['status' => 'rejected']);

            return true;
        });
    }

    /**
     * Get vacation balance for a user and year.
     */
    public function getVacationBalance(User $user, int $year): array
    {
        $balance = VacationBalance::where('user_id', $user->id)
            ->where('year', $year)
            ->first();

        if (!$balance) {
            return [
                'total_days' => 0,
                'used_days' => 0,
                'remaining_days' => 0,
                'weekend_rule_uses' => 0,
            ];
        }

        return [
            'total_days' => $balance->total_days,
            'used_days' => $balance->used_days,
            'remaining_days' => $balance->total_days - $balance->used_days,
            'weekend_rule_uses' => $balance->weekend_rule_uses,
        ];
    }

    /**
     * Get remote work balance for a user.
     */
    public function getRemoteWorkBalance(User $user): array
    {
        $balance = RemoteWorkBalance::where('user_id', $user->id)->first();

        if (!$balance) {
            return [
                'total_days' => 6,
                'used_days' => 0,
                'remaining_days' => 6,
            ];
        }

        return [
            'total_days' => $balance->total_days,
            'used_days' => $balance->used_days,
            'remaining_days' => $balance->total_days - $balance->used_days,
        ];
    }

    /**
     * Notify relevant users about a leave request status change.
     */
    public function notifyLeaveRequestStatus(LeaveRequest $request): void
    {
        $user = $request->user;

        $title = $request->status === 'approved'
            ? 'Solicitud aprobada'
            : 'Solicitud rechazada';

        $message = $request->status === 'approved'
            ? "Tu solicitud de {$request->request_type} del {$request->start_date} al {$request->end_date} ha sido aprobada."
            : "Tu solicitud de {$request->request_type} del {$request->start_date} al {$request->end_date} ha sido rechazada.";

        Notification::create([
            'user_id' => $user->id,
            'title' => $title,
            'message' => $message,
            'type' => $request->status === 'approved' ? 'success' : 'warning',
            'reference_id' => (string) $request->id,
            'reference_type' => 'leave_request',
        ]);
    }
}
