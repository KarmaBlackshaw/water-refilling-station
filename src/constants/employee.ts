import { z } from 'zod';
import type { Option, UserRole } from '@/types';

export type EmployeeForm = {
  full_name: string;
  phone: string;
  hire_date: string;
  role: UserRole;
  /** Pesos; '' while the field is blank. Persisted as centavos. */
  monthly_salary: number | '';
  /** Jugs per day; '' while blank. Required for riders. */
  daily_quota_jugs: number | '';
  /** Rest-day weekdays (0=Sun..6=Sat), kept sorted. */
  rest_days: number[];
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

/** Native number inputs emit '' when cleared — treat that as "not provided". */
const blankToUndefined = (v: unknown) => (v === '' ? undefined : v);

export const employeeDetailsSchema = z
  .object({
    full_name: z.string().trim().min(1, 'Full name is required'),
    phone: z.string(),
    hire_date: z.string(),
    role: z.string(),
    monthly_salary: z.preprocess(blankToUndefined, z.number({ error: 'Monthly salary is required' }).positive('Enter a valid amount')),
    daily_quota_jugs: z.preprocess(blankToUndefined, z.number().int('Must be a whole number').positive('Must be a positive number').optional()),
  })
  .refine((v) => v.role !== 'rider' || v.daily_quota_jugs != null, {
    error: 'Daily quota is required for riders',
    path: ['daily_quota_jugs'],
  });

export const employeeAccountSchema = z.object({
  username: z.string().regex(USERNAME_PATTERN, 'Username must be 3–30 characters: letters, numbers, underscore, dot only.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
});
