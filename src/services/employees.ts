import { daysInMonth, nowISO } from '@/helpers/date';
import { supabase } from '@/helpers/supabase';
import type { Employee, EmployeeAttendance, SalaryRecord, UserRole } from '@/types/database';

// Employees
export async function getEmployees(tenantId: string, branchId: string): Promise<Employee[]> {
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('branch_id', branchId)
    .is('deleted_at', null)
    .order('full_name');

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function getEmployee(id: string) {
  return supabase.from('employees').select('*').eq('id', id).single();
}

export async function createEmployee(data: {
  tenant_id: string;
  branch_id: string;
  full_name: string;
  phone?: string;
  hire_date?: string;
  role: UserRole;
  monthly_salary_centavos: number;
  daily_quota_jugs?: number | null;
}) {
  return supabase.from('employees').insert(data).select().single();
}

export async function updateEmployee(
  id: string,
  data: Partial<Pick<Employee, 'full_name' | 'phone' | 'hire_date' | 'monthly_salary_centavos' | 'daily_quota_jugs' | 'active'>>,
) {
  return supabase.from('employees').update(data).eq('id', id).select().single();
}

export async function softDeleteEmployee(id: string, deletedBy: string) {
  return supabase.from('employees').update({ deleted_at: nowISO(), deleted_by: deletedBy }).eq('id', id);
}

// Attendance
export async function getAttendance(employeeId: string, date: string) {
  return supabase.from('employee_attendance').select('*').eq('employee_id', employeeId).eq('attendance_date', date).maybeSingle();
}

export async function listAttendanceForMonth(employeeId: string, year: number, month: number) {
  const start = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = daysInMonth(year, month);
  const end = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

  return supabase.from('employee_attendance').select('*').eq('employee_id', employeeId).gte('attendance_date', start).lte('attendance_date', end);
}

export async function upsertAttendance(data: {
  tenant_id: string;
  branch_id: string;
  employee_id: string;
  attendance_date: string;
  status: 'present' | 'absent';
}) {
  return supabase.from('employee_attendance').upsert(data, { onConflict: 'employee_id,attendance_date' }).select().single();
}

// Salary records
export async function listSalaryRecords(employeeId: string) {
  return supabase.from('salary_records').select('*').eq('employee_id', employeeId).order('period_start', { ascending: false });
}

export async function createSalaryRecord(data: {
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

export async function submitSalaryRecord(id: string, paidBy: string) {
  return supabase.from('salary_records').update({ paid_at: nowISO(), paid_by: paidBy }).eq('id', id).select().single();
}

// Get jugs delivered by a rider on a date (sum of sale_lines quantities for completed deliveries)
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
