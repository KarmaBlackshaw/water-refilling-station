import { today } from '@/helpers/date';
import { supabase } from '@/helpers/supabase';
import type { Sale, SaleStatus } from '@/types/database';

export type DeliverySaleRow = Awaited<ReturnType<typeof listDeliverySales>>[number];

/** Maps a UI status filter key to the underlying `sales.status` values it covers. */
const DELIVERY_STATUS_MAP: Record<string, SaleStatus[]> = {
  pending: ['pending_delivery'],
  completed: ['completed'],
  void: ['void'],
};

export async function listDeliverySales(date?: string, filters?: { search?: string; status?: string }) {
  const targetDate = date ?? today();

  /** Inner-join customer so a name search filters parent rows (deliveries always have a customer). */
  let query = supabase
    .from('sales')
    .select(
      `
      *,
      customer:customers!inner(name, phone),
      address:customer_addresses(street, barangay, city, landmark, label),
      rider:users!rider_id(full_name),
      lines:sale_lines(*, product:products(name), container_type:container_types(name))
    `,
    )
    .in('source', ['delivery', 'booking_fulfilled'])
    .is('deleted_at', null)
    .eq('sale_date', targetDate)
    .order('created_at', { ascending: true });

  const statuses = filters?.status ? DELIVERY_STATUS_MAP[filters.status] : undefined;

  if (statuses) {
    query = query.in('status', statuses);
  } else {
    query = query.neq('status', 'void');
  }

  if (filters?.search) {
    query = query.ilike('customer.name', `%${filters.search}%`);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data ?? [];
}

/** Assign a customer to a rider for a date. Items + payment are recorded later by the rider. */
export async function createDeliverySale(data: {
  customer_id: string;
  address_id?: string | null;
  rider_id?: string | null;
  sale_date: string;
  tenant_id: string;
  branch_id: string;
  notes?: string | null;
}): Promise<Sale> {
  const { data: sale, error } = await supabase
    .from('sales')
    .insert({
      tenant_id: data.tenant_id,
      branch_id: data.branch_id,
      source: 'delivery',
      status: 'pending_delivery',
      customer_id: data.customer_id,
      address_id: data.address_id ?? null,
      rider_id: data.rider_id ?? null,
      sale_date: data.sale_date,
      notes: data.notes ?? null,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return sale;
}

/** Edit a single delivery's rider / date / address / notes. Pass null to clear rider or address. */
export async function updateDeliverySale(
  id: string,
  data: { rider_id: string | null; address_id: string | null; sale_date: string; notes: string | null },
): Promise<void> {
  const { error } = await supabase.from('sales').update(data).eq('id', id);

  if (error) {
    throw error;
  }
}

export type TopRiderRow = Awaited<ReturnType<typeof listTopRiders>>[number];

export async function listTopRiders(from: string, to: string, limit = 4) {
  const { data, error } = await supabase
    .from('sales')
    .select('rider_id, rider:users!rider_id(full_name)')
    .in('source', ['delivery', 'booking_fulfilled'])
    .eq('status', 'completed')
    .gte('sale_date', from)
    .lte('sale_date', to)
    .not('rider_id', 'is', null)
    .is('deleted_at', null);

  if (error) {
    throw error;
  }

  const counts = new Map<string, { full_name: string; count: number }>();

  for (const row of data ?? []) {
    if (!row.rider_id) {
      continue;
    }

    const existing = counts.get(row.rider_id);

    if (existing) {
      existing.count += 1;
    } else {
      counts.set(row.rider_id, { full_name: row.rider?.full_name ?? 'Unknown', count: 1 });
    }
  }

  return [...counts.entries()]
    .map(([rider_id, v]) => ({ rider_id, full_name: v.full_name, count: v.count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export async function reconcileDelivery(data: {
  saleId: string;
  customerId: string | null;
  tenantId: string;
  branchId: string;
  containersReturned: Array<{
    container_type_id: string;
    quantity: number;
  }>;
  notes?: string | null;
}): Promise<void> {
  const { error: updateError } = await supabase.from('sales').update({ status: 'completed' }).eq('id', data.saleId);

  if (updateError) {
    throw updateError;
  }

  const movements = data.containersReturned.filter((c) => c.quantity > 0);

  if (movements.length === 0) {
    return;
  }

  const { error: movError } = await supabase.from('container_movements').insert(
    movements.map((c) => ({
      tenant_id: data.tenantId,
      branch_id: data.branchId,
      customer_id: data.customerId,
      container_type_id: c.container_type_id,
      sale_id: data.saleId,
      movement_type: 'in' as const,
      quantity: c.quantity,
      movement_date: today(),
      notes: data.notes ?? null,
    })),
  );

  if (movError) {
    throw movError;
  }
}
