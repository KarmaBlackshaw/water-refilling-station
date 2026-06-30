import { dayjs, daysInMonth } from '@/helpers/date';
import type { Dayjs } from 'dayjs';

type DateLike = string | Date | Dayjs;

/** A day is a workday when its weekday (0=Sun..6=Sat) is not one of the employee's rest days. */
function isWorkday(date: Dayjs, restDays: number[]): boolean {
  return !restDays.includes(date.day());
}

export function countWorkdays(start: DateLike, end: DateLike, restDays: number[]): number {
  const startDay = dayjs(start).startOf('day');
  const endDay = dayjs(end).startOf('day');
  let count = 0;
  let current = startDay;

  while (current.isBefore(endDay) || current.isSame(endDay, 'day')) {
    if (isWorkday(current, restDays)) {
      count++;
    }

    current = current.add(1, 'day');
  }

  return count;
}

export function dailyRateCentavos(monthlyCentavos: number, year: number, month: number, restDays: number[]): number {
  const firstDay = dayjs(`${year}-${String(month).padStart(2, '0')}-01`);
  const lastDay = firstDay.date(daysInMonth(year, month));
  const workdays = countWorkdays(firstDay, lastDay, restDays);

  if (workdays === 0) {
    return 0;
  }

  return Math.floor(monthlyCentavos / workdays);
}

export function isWorkdayDate(date: DateLike, restDays: number[]): boolean {
  return isWorkday(dayjs(date), restDays);
}

/** Returns array of workday ISO date strings (YYYY-MM-DD) between start and end inclusive. */
export function getWorkdays(start: DateLike, end: DateLike, restDays: number[]): string[] {
  const startDay = dayjs(start).startOf('day');
  const endDay = dayjs(end).startOf('day');
  const days: string[] = [];
  let current = startDay;

  while (current.isBefore(endDay) || current.isSame(endDay, 'day')) {
    if (isWorkday(current, restDays)) {
      days.push(current.format('YYYY-MM-DD'));
    }

    current = current.add(1, 'day');
  }

  return days;
}
