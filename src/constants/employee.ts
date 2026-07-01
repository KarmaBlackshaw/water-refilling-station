import type { Option, UserRole } from '@/types';

export type EmployeeForm = {
  full_name: string;
  phone: string;
  hire_date: string;
  role: UserRole;
  monthly_salary_display: string;
  daily_quota_jugs: string;
};

export type EmployeeAccountForm = {
  username: string;
  password: string;
};

export const ROLE_OPTIONS: Option<UserRole>[] = [
  { label: 'Rider', value: 'rider' },
  { label: 'Cashier', value: 'cashier' },
  { label: 'Manager', value: 'manager' },
  { label: 'Admin', value: 'admin' },
];

/** Username: 3–30 chars, letters, numbers, underscore, dot only. */
export const USERNAME_PATTERN = /^[a-zA-Z0-9_.]{3,30}$/;
