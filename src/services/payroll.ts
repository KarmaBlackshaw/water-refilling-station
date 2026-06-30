import { dayjs } from '@/helpers/date';
import { dailyRateCentavos, getWorkdays } from '@/helpers/workday';
import type { Employee, EmployeeAttendance } from '@/types/database';

export interface IncomeBreakdown {
  basePayCentavos: number;
  commissionCentavos: number;
  grossCentavos: number;
  workdaysPresent: number;
  totalWorkdays: number;
}

export function computeIncome(
  employee: Employee,
  periodStart: string,
  periodEnd: string,
  attendanceRecords: EmployeeAttendance[],
  dailyCommissions: Record<string, number>,
): IncomeBreakdown {
  const start = dayjs(periodStart);
  const year = start.year();
  const month = start.month() + 1;
  const dailyRate = dailyRateCentavos(employee.monthly_salary_centavos, year, month, employee.rest_days);

  const workdays = getWorkdays(periodStart, periodEnd, employee.rest_days);
  const attendanceMap = new Map(attendanceRecords.map((a) => [a.attendance_date, a.status]));

  let workdaysPresent = 0;
  let commissionCentavos = 0;

  for (const dateStr of workdays) {
    const status = attendanceMap.get(dateStr);

    if (status === 'present') {
      workdaysPresent++;
    }

    commissionCentavos += dailyCommissions[dateStr] ?? 0;
  }

  const basePayCentavos = dailyRate * workdaysPresent;
  const grossCentavos = basePayCentavos + commissionCentavos;

  return {
    basePayCentavos,
    commissionCentavos,
    grossCentavos,
    workdaysPresent,
    totalWorkdays: workdays.length,
  };
}

export function getPeriodDates(period: 'today' | 'this_week' | 'this_month'): {
  start: string;
  end: string;
} {
  const now = dayjs().startOf('day');

  if (period === 'today') {
    return { start: now.format('YYYY-MM-DD'), end: now.format('YYYY-MM-DD') };
  }

  if (period === 'this_week') {
    const day = now.day();
    const mondayOffset = day === 0 ? -6 : 1 - day;
    const monday = now.add(mondayOffset, 'day');
    const saturday = monday.add(5, 'day');
    const end = saturday.isAfter(now) ? now : saturday;

    return { start: monday.format('YYYY-MM-DD'), end: end.format('YYYY-MM-DD') };
  }

  return { start: now.startOf('month').format('YYYY-MM-DD'), end: now.format('YYYY-MM-DD') };
}
