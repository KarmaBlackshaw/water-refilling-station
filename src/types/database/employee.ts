import type { UserRole } from './common';

export type AttendanceStatus = 'present' | 'absent';

export interface Employee {
  id: string;
  tenant_id: string;
  branch_id: string;
  user_id: string | null;
  full_name: string;
  phone: string | null;
  hire_date: string | null;
  role: UserRole;
  monthly_salary_centavos: number;
  daily_quota_jugs: number | null;
  active: boolean;
  created_at: string;
  deleted_at: string | null;
  deleted_by: string | null;
}

export interface EmployeeAttendance {
  id: string;
  tenant_id: string;
  branch_id: string;
  employee_id: string;
  attendance_date: string;
  status: AttendanceStatus;
  created_at: string;
}

export interface SalaryRecord {
  id: string;
  tenant_id: string;
  branch_id: string;
  employee_id: string;
  period_start: string;
  period_end: string;
  base_pay_centavos: number;
  commission_centavos: number;
  gross_centavos: number;
  net_centavos: number;
  notes: string | null;
  paid_at: string | null;
  paid_by: string | null;
  created_at: string;
}
