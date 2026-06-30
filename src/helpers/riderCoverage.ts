import { dayjs } from '@/helpers/date';
import type { AttendanceStatus } from '@/types/database';

export type RiderSchedule = { rest_days: number[] };

type RiderSource = 'primary' | 'backup' | 'manual';

export type RiderDayStatus = 'working' | 'rest' | 'absent';

/** Weekday (0=Sun..6=Sat) for an ISO date, matching the rest_days encoding. */
function weekdayOf(date: string): number {
  return dayjs(date).day();
}

/** Rider's scheduled rest day falls on this date. */
function isRestDay(schedule: RiderSchedule, date: string): boolean {
  return schedule.rest_days.includes(weekdayOf(date));
}

/**
 * Index rider schedules by rider USER id (the id customers.rider_id / backup_rider_id point at).
 * Employees with a null user_id can't be matched to a customer rider, so they're skipped.
 */
export function buildScheduleByRider(riderEmployees: { user_id: string | null; rest_days: number[] }[]): Map<string, RiderSchedule> {
  const byRider = new Map<string, RiderSchedule>();

  for (const employee of riderEmployees) {
    // Invariant: one live employee per user (DB unique index employees_user_id_unique). Guard against drift first-wins.
    if (employee.user_id == null || byRider.has(employee.user_id)) {
      continue;
    }

    byRider.set(employee.user_id, { rest_days: employee.rest_days });
  }

  return byRider;
}

/**
 * Map rider USER id -> attendance status for a date, joining the attendance ledger
 * (keyed by employee_id) back to the rider's user_id. Employees with a null user_id
 * or no attendance row for the date are omitted.
 */
export function buildAttendanceByRider(
  riderEmployees: { id: string; user_id: string | null }[],
  attendanceForDate: { employee_id: string; status: AttendanceStatus }[],
): Map<string, AttendanceStatus> {
  const userIdByEmployeeId = new Map<string, string>();
  const seenUserIds = new Set<string>();

  for (const employee of riderEmployees) {
    // Invariant: one live employee per user (DB unique index employees_user_id_unique). Guard against drift first-wins.
    if (employee.user_id == null || seenUserIds.has(employee.user_id)) {
      continue;
    }

    seenUserIds.add(employee.user_id);
    userIdByEmployeeId.set(employee.id, employee.user_id);
  }

  const byRider = new Map<string, AttendanceStatus>();

  for (const row of attendanceForDate) {
    const userId = userIdByEmployeeId.get(row.employee_id);

    if (userId != null) {
      byRider.set(userId, row.status);
    }
  }

  return byRider;
}

/**
 * A rider is absent on `date` (YYYY-MM-DD) when the weekday is a rest day OR attendance
 * is explicitly marked 'absent'. A missing schedule or present/undefined status is not absent.
 */
export function isRiderAbsent(schedule: RiderSchedule | undefined, status: AttendanceStatus | undefined, date: string): boolean {
  if (!schedule) {
    return status === 'absent';
  }

  return isRestDay(schedule, date) || status === 'absent';
}

/**
 * Fine-grained status for a rider on a given date, sharing the same rest-day derivation
 * as `isRiderAbsent`:
 *   - `rest`    — weekday is one of the rider's rest days
 *   - `absent`  — attendance marked 'absent'
 *   - `working` — otherwise (also when the schedule is missing)
 */
export function riderStatus(schedule: RiderSchedule | undefined, status: AttendanceStatus | undefined, date: string): RiderDayStatus {
  if (schedule && isRestDay(schedule, date)) {
    return 'rest';
  }

  if (status === 'absent') {
    return 'absent';
  }

  return 'working';
}

/**
 * Resolve the effective rider for a customer on a given date, two-tier (no chaining):
 *   1. primary set and not absent  -> { riderId: primary, source: 'primary' }
 *   2. backup set and not absent   -> { riderId: backup, source: 'backup' }
 *   3. otherwise                   -> { riderId: null, source: 'manual' }
 */
export function resolveRider(
  customer: { rider_id: string | null; backup_rider_id: string | null },
  scheduleByRider: Map<string, RiderSchedule>,
  attendanceByRider: Map<string, AttendanceStatus>,
  date: string,
): { riderId: string | null; source: RiderSource } {
  const primaryId = customer.rider_id;

  if (primaryId && !isRiderAbsent(scheduleByRider.get(primaryId), attendanceByRider.get(primaryId), date)) {
    return { riderId: primaryId, source: 'primary' };
  }

  const backupId = customer.backup_rider_id;

  if (backupId && !isRiderAbsent(scheduleByRider.get(backupId), attendanceByRider.get(backupId), date)) {
    return { riderId: backupId, source: 'backup' };
  }

  return { riderId: null, source: 'manual' };
}
