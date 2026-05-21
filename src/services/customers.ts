import { dayjs, nowISO } from '@/helpers/date';
import { supabase } from '@/helpers/supabase';
import type { Customer, CustomerAddress, CustomerPriceOverride, CustomerType } from '@/types/database';

export async function listCustomers(tenantId: string, branchId: string) {
  return supabase.from('customers').select('*, area:areas(id, name)').eq('tenant_id', tenantId).eq('branch_id', branchId).is('deleted_at', null).order('name');
}

export async function getCustomer(id: string) {
  return supabase.from('customers').select('*, area:areas(id, name)').eq('id', id).single();
}

export async function createCustomer(data: {
  tenant_id: string;
  branch_id: string;
  name: string;
  phone?: string | null;
  type: CustomerType;
  area_id?: string | null;
  notes?: string | null;
}) {
  return supabase.from('customers').insert(data).select().single();
}

export async function updateCustomer(id: string, data: Partial<Pick<Customer, 'name' | 'phone' | 'type' | 'area_id' | 'notes' | 'active'>>) {
  return supabase.from('customers').update(data).eq('id', id).select().single();
}

export async function softDeleteCustomer(id: string, deletedBy: string) {
  return supabase.from('customers').update({ deleted_at: nowISO(), deleted_by: deletedBy }).eq('id', id);
}

// Addresses
export async function listAddresses(customerId: string) {
  return supabase.from('customer_addresses').select('*').eq('customer_id', customerId).is('deleted_at', null).order('is_default', { ascending: false });
}

export async function createAddress(data: {
  tenant_id: string;
  branch_id: string;
  customer_id: string;
  label: string;
  address_line: string;
  lat?: number | null;
  lng?: number | null;
  is_default?: boolean;
}) {
  return supabase.from('customer_addresses').insert(data).select().single();
}

export async function updateAddress(id: string, data: Partial<Pick<CustomerAddress, 'label' | 'address_line' | 'lat' | 'lng' | 'is_default'>>) {
  return supabase.from('customer_addresses').update(data).eq('id', id).select().single();
}

export async function softDeleteAddress(id: string, deletedBy: string) {
  return supabase.from('customer_addresses').update({ deleted_at: nowISO(), deleted_by: deletedBy }).eq('id', id);
}

// Price overrides
export async function listPriceOverrides(customerId: string) {
  return supabase
    .from('customer_price_overrides')
    .select('*, product:products(name), container_type:container_types(name)')
    .eq('customer_id', customerId)
    .is('deleted_at', null);
}

export async function upsertPriceOverride(data: {
  tenant_id: string;
  branch_id: string;
  customer_id: string;
  product_id: string;
  container_type_id: string;
  refill_price_centavos: number;
  new_container_price_centavos: number;
}) {
  return supabase.from('customer_price_overrides').upsert(data, { onConflict: 'customer_id,product_id,container_type_id' }).select().single();
}

export async function softDeletePriceOverride(id: string, deletedBy: string) {
  return supabase.from('customer_price_overrides').update({ deleted_at: nowISO(), deleted_by: deletedBy }).eq('id', id);
}

// Derived: container balance per customer per container type
export async function getContainerBalance(customerId: string): Promise<Record<string, number>> {
  const { data } = await supabase
    .from('container_movements')
    .select('container_type_id, movement_type, quantity')
    .eq('customer_id', customerId)
    .is('deleted_at', null);

  const balance: Record<string, number> = {};

  for (const row of data ?? []) {
    const current = balance[row.container_type_id] ?? 0;

    if (row.movement_type === 'out' || row.movement_type === 'lost') {
      balance[row.container_type_id] = current + row.quantity;
    } else if (row.movement_type === 'in') {
      balance[row.container_type_id] = current - row.quantity;
    } else {
      // adjustment: quantity can be positive or negative
      balance[row.container_type_id] = current + row.quantity;
    }
  }
  return balance;
}

// Derived: AR balance (on_account payments) via join through sales
export async function getARBalance(customerId: string): Promise<number> {
  const { data: payments } = await supabase
    .from('sale_payments')
    .select('amount_centavos, sale:sales!sale_id(customer_id)')
    .eq('method', 'on_account')
    .eq('sale.customer_id', customerId);

  return (payments ?? []).reduce((sum, p) => sum + p.amount_centavos, 0);
}

// Last order date
export async function getLastOrderDate(customerId: string): Promise<string | null> {
  const { data } = await supabase
    .from('sales')
    .select('sale_date')
    .eq('customer_id', customerId)
    .is('deleted_at', null)
    .order('sale_date', { ascending: false })
    .limit(1)
    .maybeSingle();

  return data?.sale_date ?? null;
}

// List sales for a customer
export async function listCustomerSales(customerId: string) {
  return supabase
    .from('sales')
    .select('*, sale_lines(*), sale_payments(*)')
    .eq('customer_id', customerId)
    .is('deleted_at', null)
    .order('sale_date', { ascending: false })
    .limit(20);
}

// Explicit re-export for type usage in service consumers
export type { Customer, CustomerAddress, CustomerPriceOverride };

// Customer staleness rules
export function getDaysSinceOrder(lastOrderDate: string | null): number | null {
  if (!lastOrderDate) {
    return null;
  }

  return dayjs().startOf('day').diff(dayjs(lastOrderDate).startOf('day'), 'day');
}

export function isCustomerStale(
  lastOrderDate: string | null,
  type: 'delivery' | 'walkin',
  deliveryThreshold: number,
  walkinThreshold: number,
): boolean {
  const days = getDaysSinceOrder(lastOrderDate);

  if (days === null) {
    return false;
  }

  const threshold = type === 'delivery' ? deliveryThreshold : walkinThreshold;

  return days >= threshold;
}
