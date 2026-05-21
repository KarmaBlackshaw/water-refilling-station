import { dayjs, daysInMonth } from '@/helpers/date';
import type { Dayjs } from 'dayjs';

type DateLike = string | Date | Dayjs;

// Monday=0 through Saturday=5 are workdays; Sunday=6 is rest day
function isWorkday(date: Dayjs): boolean {
  const dow = date.day(); // 0=Sun, 1=Mon, ..., 6=Sat

  return dow >= 1 && dow <= 6;
}

export function countWorkdays(start: DateLike, end: DateLike): number {
  const startDay = dayjs(start).startOf('day');
  const endDay = dayjs(end).startOf('day');
  let count = 0;
  let current = startDay;

  while (current.isBefore(endDay) || current.isSame(endDay, 'day')) {
    if (isWorkday(current)) {
      count++;
    }

    current = current.add(1, 'day');
  }

  return count;
}

export function dailyRateCentavos(monthlyCentavos: number, year: number, month: number): number {
  const firstDay = dayjs(`${year}-${String(month).padStart(2, '0')}-01`);
  const lastDay = firstDay.date(daysInMonth(year, month));
  const workdays = countWorkdays(firstDay, lastDay);

  if (workdays === 0) {
    return 0;
  }

  return Math.floor(monthlyCentavos / workdays);
}

export function isWorkdayDate(date: DateLike): boolean {
  return isWorkday(dayjs(date));
}

// Returns array of workday ISO date strings (YYYY-MM-DD) between start and end inclusive
export function getWorkdays(start: DateLike, end: DateLike): string[] {
  const startDay = dayjs(start).startOf('day');
  const endDay = dayjs(end).startOf('day');
  const days: string[] = [];
  let current = startDay;

  while (current.isBefore(endDay) || current.isSame(endDay, 'day')) {
    if (isWorkday(current)) {
      days.push(current.format('YYYY-MM-DD'));
    }

    current = current.add(1, 'day');
  }

  return days;
}
