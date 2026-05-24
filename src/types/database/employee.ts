import type { Database } from './supabase';

export type AttendanceStatus = Database['public']['Enums']['attendance_status'];

export type Employee = Database['public']['Tables']['employees']['Row'];
export type EmployeeAttendance = Database['public']['Tables']['employee_attendance']['Row'];
export type SalaryRecord = Database['public']['Tables']['salary_records']['Row'];
