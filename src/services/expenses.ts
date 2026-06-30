import { nowISO } from '@/helpers/date';
import { supabase } from '@/helpers/supabase';
import { getCurrentUserId } from '@/helpers/supabase';
import type { OperationalExpense, ExpenseCategory } from '@/types/database';

export function getExpenses(tenantId: string, branchId: string) {
  return supabase.from('operational_expenses').select('*, employees(full_name)').eq('tenant_id', tenantId).eq('branch_id', branchId).is('deleted_at', null);
}

export type ExpenseWithPayee = NonNullable<Awaited<ReturnType<typeof getExpenses>>['data']>[number];

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
    .single();

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
  const { data: row, error } = await supabase.from('operational_expenses').update(data).eq('id', id).select().single();

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
  const { data, error } = await getExpenses(tenantId, branchId).gte('expense_date', from).lte('expense_date', to);

  if (error) {
    throw error;
  }

  const by_category: Record<string, number> = {};
  let total_centavos = 0;

  for (const e of data ?? []) {
    total_centavos += e.amount_centavos;
    by_category[e.category] = (by_category[e.category] ?? 0) + e.amount_centavos;
  }
  return { total_centavos, by_category };
}

export type ExpenseSearchRow = ExpenseWithPayee;

export async function listExpenses(params: {
  tenantId: string;
  branchId: string;
  from?: string;
  to?: string;
  category?: ExpenseCategory;
  search?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ rows: ExpenseSearchRow[]; count: number }> {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 20;
  const rangeFrom = (page - 1) * pageSize;
  const rangeTo = rangeFrom + pageSize - 1;

  let query = supabase
    .from('operational_expenses')
    .select('*, employees(full_name)', { count: 'exact' })
    .eq('tenant_id', params.tenantId)
    .eq('branch_id', params.branchId)
    .is('deleted_at', null);

  if (params.from) {
    query = query.gte('expense_date', params.from);
  }

  if (params.to) {
    query = query.lte('expense_date', params.to);
  }

  if (params.category) {
    query = query.eq('category', params.category);
  }

  const q = params.search?.trim();

  if (q) {
    query = query.ilike('description', `%${q}%`);
  }

  query = query.order('expense_date', { ascending: false }).range(rangeFrom, rangeTo);

  const { data, error, count } = await query;

  if (error) {
    throw error;
  }

  return { rows: data ?? [], count: count ?? 0 };
}
