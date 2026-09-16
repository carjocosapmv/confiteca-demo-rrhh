import {
  addDays, eachDayOfInterval, isWeekend, isFriday, isMonday,
  format
} from 'date-fns';

export type RequestType = 'vacation' | 'remote_work' | 'personal' | 'medical' | 'hourly';

export const REQUEST_TYPE_LABELS: Record<RequestType, string> = {
  vacation: 'Vacaciones',
  remote_work: 'Teletrabajo',
  personal: 'Permiso personal',
  medical: 'Visita médica',
  hourly: 'Permiso por horas',
};

interface WeekendRuleResult {
  daysRequested: number;
  daysCharged: number;
  weekendDaysIncluded: number;
  usesWeekendRule: boolean;
  returnDate: Date;
  dateRange: Date[];
}

/**
 * Calculate vacation days considering the weekend rule.
 * Rule: If a request includes a Friday or Monday contiguous to a weekend,
 * the weekend days count as vacation days. This applies max 2 times per year.
 */
export function calculateVacationDays(
  startDate: Date,
  endDate: Date,
  currentWeekendRuleUses: number
): WeekendRuleResult {
  const allDays = eachDayOfInterval({ start: startDate, end: endDate });
  const businessDays = allDays.filter(d => !isWeekend(d));
  const daysRequested = businessDays.length;

  let weekendDaysIncluded = 0;
  let usesWeekendRule = false;

  if (currentWeekendRuleUses < 2) {
    for (let i = 0; i < allDays.length; i++) {
      const day = allDays[i];
      if (isFriday(day)) {
        const sat = addDays(day, 1);
        if (!allDays.find(d => d.getTime() === sat.getTime())) {
          weekendDaysIncluded += 2;
          usesWeekendRule = true;
        }
      }
      if (isMonday(day) && i === 0) {
        weekendDaysIncluded += 2;
        usesWeekendRule = true;
      }
    }

    const weekendDaysInRange = allDays.filter(d => isWeekend(d));
    if (weekendDaysInRange.length > 0) {
      weekendDaysIncluded = weekendDaysInRange.length;
      usesWeekendRule = true;
    }
  }

  const daysCharged = usesWeekendRule
    ? daysRequested + weekendDaysIncluded
    : daysRequested;

  let returnDate = addDays(endDate, 1);
  while (isWeekend(returnDate)) {
    returnDate = addDays(returnDate, 1);
  }

  return {
    daysRequested,
    daysCharged,
    weekendDaysIncluded,
    usesWeekendRule,
    returnDate,
    dateRange: allDays,
  };
}

export function calculateBusinessDays(startDate: Date, endDate: Date): number {
  const allDays = eachDayOfInterval({ start: startDate, end: endDate });
  return allDays.filter(d => !isWeekend(d)).length;
}

export function formatDateES(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'dd/MM/yyyy');
}
