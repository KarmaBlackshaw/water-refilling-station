import { nowISO } from '@/helpers/date';
import { supabase, getCurrentUserId } from '@/helpers/supabase';
import type { PaymentMethod, Sale, SaleSource, SaleStatus } from '@/types/database';

export type SaleWithCustomer = Awaited<ReturnType<typeof listSales>>[number];
export type SaleDetail = NonNullable<Awaited<ReturnType<typeof getSale>>>;

export async function listSales(params?: { source?: SaleSource; status?: SaleStatus; from?: string; to?: string; customerId?: string; search?: string }) {
  /** Left-join by default so walk-in sales with a null customer stay in the list; inner-join only when searching by customer name (null-customer rows can't match a name anyway). */
  const base = params?.search
    ? supabase.from('sales').select('*, customer:customers!inner(name)')
    : supabase.from('sales').select('*, customer:customers(name)');

  let query = base.is('deleted_at', null).order('created_at', { ascending: false }).limit(100);

  if (params?.source) {
    query = query.eq('source', params.source);
  }

  if (params?.status) {
    query = query.eq('status', params.status);
  }

  if (params?.from) {
    query = query.gte('sale_date', params.from);
  }

  if (params?.to) {
    query = query.lte('sale_date', params.to);
  }

  if (params?.customerId) {
    query = query.eq('customer_id', params.customerId);
  }

  if (params?.search) {
    query = query.ilike('customer.name', `%${params.search}%`);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function getSale(id: string) {
  const [saleRes, linesRes, paymentsRes] = await Promise.all([
    supabase.from('sales').select('*, customer:customers(name)').eq('id', id).single(),
    supabase.from('sale_lines').select('*, product:products(name), container_type:container_types(name)').eq('sale_id', id),
    supabase.from('sale_payments').select('*').eq('sale_id', id),
  ]);

  if (saleRes.error || !saleRes.data) {
    return null;
  }

  return {
    sale: saleRes.data,
    lines: linesRes.data ?? [],
    payments: paymentsRes.data ?? [],
  };
}

export async function createWalkInSale(data: {
  tenant_id: string;
  branch_id: string;
  customer_id?: string | null;
  sale_date: string;
  notes?: string | null;
  cashier_id?: string | null;
  lines: Array<{
    product_id: string;
    container_type_id: string;
    quantity: number;
    unit_price_centavos: number;
    is_new_container: boolean;
  }>;
  payments: Array<{
    method: PaymentMethod;
    amount_centavos: number;
    gcash_ref?: string | null;
  }>;
}): Promise<Sale> {
  const { lines, payments, ...saleData } = data;

  const { data: sale, error: saleError } = await supabase
    .from('sales')
    .insert({
      ...saleData,
      source: 'walk_in',
      status: 'completed',
    })
    .select()
    .single();

  if (saleError || !sale) {
    throw saleError ?? new Error('Failed to create sale');
  }

  const saleId = sale.id;

  const lineRows = lines.map((l) => ({
    sale_id: saleId,
    tenant_id: data.tenant_id,
    branch_id: data.branch_id,
    product_id: l.product_id,
    container_type_id: l.container_type_id,
    quantity: l.quantity,
    unit_price_centavos: l.unit_price_centavos,
    is_new_container: l.is_new_container,
  }));

  const { error: linesError } = await supabase.from('sale_lines').insert(lineRows);

  if (linesError) {
    throw linesError;
  }

  const paymentRows = payments.map((p) => ({
    sale_id: saleId,
    tenant_id: data.tenant_id,
    branch_id: data.branch_id,
    method: p.method,
    amount_centavos: p.amount_centavos,
    gcash_ref: p.gcash_ref ?? null,
  }));

  const { error: paymentsError } = await supabase.from('sale_payments').insert(paymentRows);

  if (paymentsError) {
    throw paymentsError;
  }

  return sale;
}

export async function voidSale(id: string): Promise<void> {
  const userId = await getCurrentUserId();
  const { error } = await supabase
    .from('sales')
    .update({
      status: 'void',
      deleted_at: nowISO(),
      deleted_by: userId,
    })
    .eq('id', id);

  if (error) {
    throw error;
  }
}
