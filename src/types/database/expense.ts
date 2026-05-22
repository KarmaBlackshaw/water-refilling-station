export type ExpenseCategory = 'gasoline' | 'parts' | 'supplies' | 'utilities' | 'other';

export interface OperationalExpense {
  id: string;
  tenant_id: string;
  branch_id: string;
  expense_date: string;
  category: ExpenseCategory;
  amount_centavos: number;
  payee_employee_id: string | null;
  description: string | null;
  reference_number: string | null;
  created_at: string;
  deleted_at: string | null;
  deleted_by: string | null;
}
