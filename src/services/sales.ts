import { nowISO } from '@/helpers/date';
import { supabase, getCurrentUserId } from '@/helpers/supabase';
import type { Sale, SaleLine, SalePayment } from '@/types/database';

type SaleWithCustomer = Sale & { customer?: { name: string } | null };
type SaleLineWithJoins = SaleLine & { product?: { name: string }; container_type?: { name: string } };

export async function listSales(params?: { source?: string; status?: string; from?: string; to?: string; customerId?: string }): Promise<SaleWithCustomer[]> {
  let query = supabase.from('sales').select('*, customer:customers(name)').is('deleted_at', null).order('created_at', { ascending: false }).limit(100);

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

  const { data, error } = await query.returns<SaleWithCustomer[]>();

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function getSale(id: string): Promise<{
  sale: SaleWithCustomer;
  lines: SaleLineWithJoins[];
  payments: SalePayment[];
} | null> {
  const [saleRes, linesRes, paymentsRes] = await Promise.all([
    supabase.from('sales').select('*, customer:customers(name)').eq('id', id).single().returns<SaleWithCustomer>(),
    supabase.from('sale_lines').select('*, product:products(name), container_type:container_types(name)').eq('sale_id', id).returns<SaleLineWithJoins[]>(),
    supabase.from('sale_payments').select('*').eq('sale_id', id).returns<SalePayment[]>(),
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
    method: string;
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
    .single()
    .returns<Sale>();

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
