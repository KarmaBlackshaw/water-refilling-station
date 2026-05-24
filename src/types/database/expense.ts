import type { Database } from './supabase';

export type ExpenseCategory = Database['public']['Enums']['expense_category'];

export type OperationalExpense = Database['public']['Tables']['operational_expenses']['Row'];
