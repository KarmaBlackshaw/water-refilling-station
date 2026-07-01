import { daysInMonth, nowISO } from '@/helpers/date';
import { supabase } from '@/helpers/supabase';
import type { AttendanceStatus, Employee, UserRole } from '@/types/database';

/**
 * List all employees for the given tenant/branch, with optional server-side search.
 * Search matches against `full_name` OR `phone` (case-insensitive).
 */
export async function getEmployees(tenantId: string, branchId: string, filters?: { search?: string }): Promise<Employee[]> {
  let query = supabase.from('employees').select('*').eq('tenant_id', tenantId).eq('branch_id', branchId).is('deleted_at', null).order('full_name');

  if (filters?.search) {
    const s = filters.search;

    query = query.or('full_name.ilike.%' + s + '%,phone.ilike.%' + s + '%');
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data ?? [];
}

export function getEmployee(id: string) {
  return supabase.from('employees').select('*').eq('id', id).single();
}

export function createEmployee(data: {
  tenant_id: string;
  branch_id: string;
  user_id: string;
  full_name: string;
  phone?: string;
  hire_date?: string;
  role: UserRole;
  monthly_salary_centavos: number;
  daily_quota_jugs?: number | null;
  rest_days?: number[];
}) {
  return supabase.from('employees').insert(data).select().single();
}

export function updateEmployee(
  id: string,
  data: Partial<Pick<Employee, 'full_name' | 'phone' | 'hire_date' | 'monthly_salary_centavos' | 'daily_quota_jugs' | 'rest_days' | 'active' | 'user_id'>>,
) {
  return supabase.from('employees').update(data).eq('id', id).select().single();
}

/**
 * List rider-role employees for the given tenant/branch, with optional server-side search.
 * `user_id` links to the user that `customers.rider_id` points at.
 */
export function listRiderEmployees(tenantId: string, branchId: string, filters?: { search?: string }) {
  let query = supabase
    .from('employees')
    .select('id, user_id, full_name, rest_days, daily_quota_jugs')
    .eq('tenant_id', tenantId)
    .eq('branch_id', branchId)
    .eq('role', 'rider')
    .is('deleted_at', null)
    .order('full_name');

  if (filters?.search) {
    query = query.ilike('full_name', `%${filters.search}%`);
  }

  return query;
}

export function softDeleteEmployee(id: string, deletedBy: string) {
  return supabase.from('employees').update({ deleted_at: nowISO(), deleted_by: deletedBy }).eq('id', id);
}

/** Fetch a single attendance record for an employee on a given date. */
export function getAttendance(employeeId: string, date: string) {
  return supabase.from('employee_attendance').select('*').eq('employee_id', employeeId).eq('attendance_date', date).maybeSingle();
}

/** List all attendance records for an employee within a calendar month. */
export function listAttendanceForMonth(employeeId: string, year: number, month: number) {
  const start = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = daysInMonth(year, month);
  const end = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

  return supabase.from('employee_attendance').select('*').eq('employee_id', employeeId).gte('attendance_date', start).lte('attendance_date', end);
}

export function upsertAttendance(data: { tenant_id: string; branch_id: string; employee_id: string; attendance_date: string; status: AttendanceStatus }) {
  return supabase.from('employee_attendance').upsert(data, { onConflict: 'employee_id,attendance_date' }).select().single();
}

export function listAttendanceForDate(tenantId: string, branchId: string, date: string) {
  return supabase
    .from('employee_attendance')
    .select('employee_id, attendance_date, status')
    .eq('tenant_id', tenantId)
    .eq('branch_id', branchId)
    .eq('attendance_date', date);
}

/** List salary records for an employee, most recent first. */
export function listSalaryRecords(employeeId: string) {
  return supabase.from('salary_records').select('*').eq('employee_id', employeeId).order('period_start', { ascending: false });
}

export function createSalaryRecord(data: {
  tenant_id: string;
  branch_id: string;
  employee_id: string;
  period_start: string;
  period_end: string;
  base_pay_centavos: number;
  commission_centavos: number;
  gross_centavos: number;
  net_centavos: number;
  notes?: string;
}) {
  return supabase.from('salary_records').insert(data).select().single();
}

export function submitSalaryRecord(id: string, paidBy: string) {
  return supabase.from('salary_records').update({ paid_at: nowISO(), paid_by: paidBy }).eq('id', id).select().single();
}

/** Sum of jugs delivered by a rider on a given date (completed deliveries only). */
export async function getRiderJugsDelivered(riderId: string, date: string): Promise<number> {
  const { data } = await supabase
    .from('sale_lines')
    .select('quantity, sale:sales!sale_id(rider_id, status, sale_date)')
    .eq('sale.rider_id', riderId)
    .eq('sale.sale_date', date)
    .eq('sale.status', 'completed');

  if (!data) {
    return 0;
  }

  return data.reduce((sum, line) => sum + line.quantity, 0);
}
