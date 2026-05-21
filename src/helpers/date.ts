import dayjs, { type Dayjs } from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

export const MANILA_TZ = 'Asia/Manila';

export { dayjs };

export type DateInput = string | Date | Dayjs | null | undefined;

export function formatDate(date: DateInput, format = 'YYYY-MM-DD'): string {
  if (!date) {
    return '';
  }

  return dayjs(date).format(format);
}

export function formatDateTime(date: DateInput): string {
  if (!date) {
    return '';
  }

  return dayjs(date).format('YYYY-MM-DD HH:mm');
}

export function formatDateDisplay(date: DateInput): string {
  if (!date) {
    return '';
  }

  return dayjs(date).format('MMM D, YYYY');
}

export function formatDateLong(date: DateInput): string {
  if (!date) {
    return '-';
  }

  return dayjs(date).format('MMMM D, YYYY');
}

export function formatMonthShortDay(date: DateInput): string {
  if (!date) {
    return '';
  }

  return dayjs(date).format('MMM D');
}

export function formatWeekdayShort(date: DateInput): string {
  if (!date) {
    return '';
  }

  return dayjs(date).format('ddd');
}

export function formatMonthLong(date: DateInput): string {
  if (!date) {
    return '';
  }

  return dayjs(date).format('MMMM YYYY');
}

export function addDays(date: string | Date | Dayjs, days: number): string {
  return dayjs(date).add(days, 'day').format('YYYY-MM-DD');
}

export function subtractDays(date: string | Date | Dayjs, days: number): string {
  return dayjs(date).subtract(days, 'day').format('YYYY-MM-DD');
}

export function today(): string {
  return dayjs().tz(MANILA_TZ).format('YYYY-MM-DD');
}

export function nowISO(): string {
  return dayjs().toISOString();
}

export function toISODate(date: string | Date | Dayjs): string {
  return dayjs(date).format('YYYY-MM-DD');
}

export function startOfMonth(date?: DateInput): string {
  return dayjs(date ?? undefined).startOf('month').format('YYYY-MM-DD');
}

export function endOfMonth(date?: DateInput): string {
  return dayjs(date ?? undefined).endOf('month').format('YYYY-MM-DD');
}

export function currentYear(): number {
  return dayjs().tz(MANILA_TZ).year();
}

export function currentMonth(): number {
  return dayjs().tz(MANILA_TZ).month() + 1;
}

export function daysInMonth(year: number, month: number): number {
  return dayjs(`${year}-${String(month).padStart(2, '0')}-01`).daysInMonth();
}

export function isValidDate(date: DateInput): boolean {
  if (!date) {
    return false;
  }

  return dayjs(date).isValid();
}

export function diffInDays(date1: string | Date | Dayjs, date2: string | Date | Dayjs): number {
  return dayjs(date1).diff(dayjs(date2), 'day');
}

export function getNextBillingDate(checkInDate: string | Date | Dayjs): string {
  const checkIn = dayjs(checkInDate);
  const todayDate = dayjs();

  let billingDay = checkIn.date();

  const daysInCurrentMonth = todayDate.daysInMonth();

  if (billingDay > daysInCurrentMonth) {
    billingDay = daysInCurrentMonth;
  }

  let nextBilling = todayDate.date(billingDay);

  if (nextBilling.isBefore(todayDate) || nextBilling.isSame(todayDate, 'day')) {
    nextBilling = nextBilling.add(1, 'month');
    const daysInNextMonth = nextBilling.daysInMonth();
    const originalBillingDay = checkIn.date();

    if (originalBillingDay > daysInNextMonth) {
      nextBilling = nextBilling.date(daysInNextMonth);
    } else {
      nextBilling = nextBilling.date(originalBillingDay);
    }
  }

  return nextBilling.format('YYYY-MM-DD');
}

export function getDaysUntilBilling(checkInDate: string | Date | Dayjs): number {
  const nextBilling = getNextBillingDate(checkInDate);

  return dayjs(nextBilling).diff(dayjs(), 'day');
}

export function formatCurrency(amount: number): string {
  return `₱${amount.toLocaleString()}`;
}
