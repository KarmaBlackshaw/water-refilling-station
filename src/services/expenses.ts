import { nowISO } from '@/helpers/date';
import { supabase } from '@/helpers/supabase';
import { getCurrentUserId } from '@/helpers/supabase';
import type { OperationalExpense, ExpenseCategory } from '@/types/database';

type ExpenseWithPayee = OperationalExpense & {
  employees: { full_name: string } | null;
};

export async function listExpenses(params: { tenantId: string; branchId: string; from: string; to: string; category?: string }): Promise<ExpenseWithPayee[]> {
  let query = supabase
    .from('operational_expenses')
    .select('*, employees(full_name)')
    .eq('tenant_id', params.tenantId)
    .eq('branch_id', params.branchId)
    .is('deleted_at', null)
    .gte('expense_date', params.from)
    .lte('expense_date', params.to)
    .order('expense_date', { ascending: false });

  if (params.category) {
    query = query.eq('category', params.category);
  }

  const { data, error } = await query.returns<ExpenseWithPayee[]>();

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function createExpense(
  tenantId: string,
  branchId: string,
  data: {
    expense_date: string;
    category: ExpenseCategory;
    amount_centavos: number;
    payee_employee_id?: string | null;
    description?: string | null;
    reference_number?: string | null;
  },
): Promise<OperationalExpense> {
  const { data: row, error } = await supabase
    .from('operational_expenses')
    .insert({ tenant_id: tenantId, branch_id: branchId, ...data })
    .select()
    .single()
    .returns<OperationalExpense>();

  if (error) {
    throw error;
  }

  return row;
}

export async function updateExpense(
  id: string,
  data: {
    expense_date?: string;
    category?: ExpenseCategory;
    amount_centavos?: number;
    payee_employee_id?: string | null;
    description?: string | null;
    reference_number?: string | null;
  },
): Promise<OperationalExpense> {
  const { data: row, error } = await supabase.from('operational_expenses').update(data).eq('id', id).select().single().returns<OperationalExpense>();

  if (error) {
    throw error;
  }

  return row;
}

export async function deleteExpense(id: string): Promise<void> {
  const userId = await getCurrentUserId();
  const { error } = await supabase.from('operational_expenses').update({ deleted_at: nowISO(), deleted_by: userId }).eq('id', id);

  if (error) {
    throw error;
  }
}

export async function getExpenseSummary(
  tenantId: string,
  branchId: string,
  from: string,
  to: string,
): Promise<{ total_centavos: number; by_category: Record<string, number> }> {
  const expenses = await listExpenses({ tenantId, branchId, from, to });
  const by_category: Record<string, number> = {};
  let total_centavos = 0;

  for (const e of expenses) {
    total_centavos += e.amount_centavos;
    by_category[e.category] = (by_category[e.category] ?? 0) + e.amount_centavos;
  }
  return { total_centavos, by_category };
}
