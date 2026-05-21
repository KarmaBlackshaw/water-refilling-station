import { addDays, dayjs, nowISO, today } from '@/helpers/date';
import { supabase, getCurrentUserId } from '@/helpers/supabase';
import type { Booking, BookingTemplate, BookingTemplateItem, BookingItem } from '@/types/database';
import type { Dayjs } from 'dayjs';

// ─── Extended row types ───────────────────────────────────────────────────────

export interface BookingRow extends Booking {
  customer: { name: string } | null;
  rider: { full_name: string } | null;
  items: (BookingItem & {
    product: { name: string } | null;
    container_type: { name: string } | null;
  })[];
}

export interface TemplateRow extends BookingTemplate {
  customer: { name: string; phone: string | null } | null;
  rider: { full_name: string } | null;
  items: (BookingTemplateItem & {
    product: { name: string } | null;
    container_type: { name: string } | null;
  })[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Day-of-week mapping: 0=Mon..5=Sat (no Sunday)
function jsToMon0(jsDay: number): number {
  // dayjs.day(): 0=Sun,1=Mon..6=Sat → Mon=0..Sat=5, Sun excluded
  return (jsDay + 6) % 7;
}

function matchesCadence(template: TemplateRow, date: Dayjs, from: Dayjs): boolean {
  const dow = jsToMon0(date.day());

  if (dow !== template.day_of_week) {
    return false;
  }

  if (template.cadence === 'weekly') {
    return true;
  }

  if (template.cadence === 'bi_weekly') {
    const weeksDiff = Math.round(date.diff(from, 'day') / 7);

    return weeksDiff % 2 === 0;
  }

  if (template.cadence === 'monthly') {
    // First matching day_of_week in the calendar month
    let d = date.startOf('month');

    while (jsToMon0(d.day()) !== template.day_of_week) {
      d = d.add(1, 'day');
    }
    return d.date() === date.date();
  }

  return false;
}

// ─── List bookings ────────────────────────────────────────────────────────────

export async function listBookings(params?: { from?: string; to?: string; status?: string; customerId?: string }): Promise<BookingRow[]> {
  const start = today();
  const defaultTo = addDays(start, 14);

  let query = supabase
    .from('bookings')
    .select(
      '*, customer:customers(name), rider:users!rider_id(full_name), items:booking_items(*, product:products(name), container_type:container_types(name))',
    )
    .is('deleted_at', null)
    .order('scheduled_date');

  const from = params?.from ?? start;
  const to = params?.to ?? defaultTo;

  query = query.gte('scheduled_date', from).lte('scheduled_date', to);

  if (params?.status) {
    query = query.eq('status', params.status);
  } else {
    query = query.neq('status', 'cancelled');
  }

  if (params?.customerId) {
    query = query.eq('customer_id', params.customerId);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data ?? []) as BookingRow[];
}

// ─── List templates ───────────────────────────────────────────────────────────

export async function listTemplates(): Promise<TemplateRow[]> {
  const { data, error } = await supabase
    .from('booking_templates')
    .select(
      '*, customer:customers(name, phone), rider:users!rider_id(full_name), items:booking_template_items(*, product:products(name), container_type:container_types(name))',
    )
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as TemplateRow[];
}

// ─── Create template ──────────────────────────────────────────────────────────

export async function createTemplate(
  tenantId: string,
  branchId: string,
  data: {
    customer_id: string;
    address_id?: string | null;
    rider_id?: string | null;
    cadence: string;
    day_of_week: number;
    items: Array<{
      product_id: string;
      container_type_id: string;
      quantity: number;
      is_new_container: boolean;
    }>;
  },
): Promise<BookingTemplate> {
  const { items, ...templateData } = data;

  const { data: template, error } = await supabase
    .from('booking_templates')
    .insert({
      tenant_id: tenantId,
      branch_id: branchId,
      customer_id: templateData.customer_id,
      address_id: templateData.address_id ?? null,
      rider_id: templateData.rider_id ?? null,
      cadence: templateData.cadence,
      day_of_week: templateData.day_of_week,
    })
    .select()
    .single();

  if (error || !template) {
    throw error ?? new Error('Failed to create template');
  }

  const itemRows = items.map((item) => ({
    template_id: template.id,
    tenant_id: tenantId,
    branch_id: branchId,
    product_id: item.product_id,
    container_type_id: item.container_type_id,
    quantity: item.quantity,
    is_new_container: item.is_new_container,
  }));

  const { error: itemsError } = await supabase.from('booking_template_items').insert(itemRows);

  if (itemsError) {
    throw itemsError;
  }

  return template as BookingTemplate;
}

// ─── Update template ──────────────────────────────────────────────────────────

export async function updateTemplate(
  id: string,
  data: {
    address_id?: string | null;
    rider_id?: string | null;
    cadence?: string;
    day_of_week?: number;
    active?: boolean;
  },
): Promise<BookingTemplate> {
  const { data: template, error } = await supabase.from('booking_templates').update(data).eq('id', id).select().single();

  if (error || !template) {
    throw error ?? new Error('Failed to update template');
  }

  return template as BookingTemplate;
}

// ─── Delete template (soft) ───────────────────────────────────────────────────

export async function deleteTemplate(id: string): Promise<void> {
  const userId = await getCurrentUserId();
  const { error } = await supabase
    .from('booking_templates')
    .update({
      active: false,
      deleted_at: nowISO(),
      deleted_by: userId,
    })
    .eq('id', id);

  if (error) {
    throw error;
  }
}

// ─── Create one-off booking ───────────────────────────────────────────────────

export async function createBooking(
  tenantId: string,
  branchId: string,
  data: {
    template_id?: string | null;
    customer_id: string;
    address_id?: string | null;
    rider_id?: string | null;
    scheduled_date: string;
    items: Array<{
      product_id: string;
      container_type_id: string;
      quantity: number;
      is_new_container: boolean;
    }>;
  },
): Promise<Booking> {
  const { items, ...bookingData } = data;

  const { data: booking, error } = await supabase
    .from('bookings')
    .insert({
      tenant_id: tenantId,
      branch_id: branchId,
      template_id: bookingData.template_id ?? null,
      customer_id: bookingData.customer_id,
      address_id: bookingData.address_id ?? null,
      rider_id: bookingData.rider_id ?? null,
      scheduled_date: bookingData.scheduled_date,
      status: 'pending',
    })
    .select()
    .single();

  if (error || !booking) {
    throw error ?? new Error('Failed to create booking');
  }

  const itemRows = items.map((item) => ({
    booking_id: booking.id,
    tenant_id: tenantId,
    branch_id: branchId,
    product_id: item.product_id,
    container_type_id: item.container_type_id,
    quantity: item.quantity,
    is_new_container: item.is_new_container,
  }));

  const { error: itemsError } = await supabase.from('booking_items').insert(itemRows);

  if (itemsError) {
    throw itemsError;
  }

  return booking as Booking;
}

// ─── Cancel booking ───────────────────────────────────────────────────────────

export async function cancelBooking(id: string): Promise<void> {
  const userId = await getCurrentUserId();
  const { error } = await supabase
    .from('bookings')
    .update({
      status: 'cancelled',
      deleted_at: nowISO(),
      deleted_by: userId,
    })
    .eq('id', id);

  if (error) {
    throw error;
  }
}

// ─── Materialize bookings from templates ──────────────────────────────────────

export async function materializeBookings(tenantId: string, branchId: string, from: string, to: string): Promise<number> {
  // Load all active templates with their items
  const { data: templates, error: templatesError } = await supabase
    .from('booking_templates')
    .select(
      '*, customer:customers(name, phone), rider:users!rider_id(full_name), items:booking_template_items(*, product:products(name), container_type:container_types(name))',
    )
    .eq('tenant_id', tenantId)
    .eq('branch_id', branchId)
    .eq('active', true)
    .is('deleted_at', null);

  if (templatesError) {
    throw templatesError;
  }

  if (!templates || templates.length === 0) {
    return 0;
  }

  const fromDate = dayjs(from);
  const toDate = dayjs(to);

  // Collect all (template_id, date) combos that should exist
  const needed: Array<{ template: TemplateRow; date: string }> = [];

  for (const template of templates as TemplateRow[]) {
    let cur = fromDate;

    while (cur.isBefore(toDate) || cur.isSame(toDate, 'day')) {
      if (matchesCadence(template, cur, fromDate)) {
        needed.push({ template, date: cur.format('YYYY-MM-DD') });
      }

      cur = cur.add(1, 'day');
    }
  }

  if (needed.length === 0) {
    return 0;
  }

  // Load existing bookings for this range to avoid duplicates
  const { data: existing, error: existingError } = await supabase
    .from('bookings')
    .select('template_id, scheduled_date')
    .eq('tenant_id', tenantId)
    .eq('branch_id', branchId)
    .gte('scheduled_date', from)
    .lte('scheduled_date', to)
    .is('deleted_at', null);

  if (existingError) {
    throw existingError;
  }

  const existingSet = new Set((existing ?? []).map((b) => `${b.template_id}|${b.scheduled_date}`));

  // Filter to only truly new bookings
  const toCreate = needed.filter(({ template, date }) => !existingSet.has(`${template.id}|${date}`));

  if (toCreate.length === 0) {
    return 0;
  }

  // Insert bookings in one batch
  const bookingRows = toCreate.map(({ template, date }) => ({
    tenant_id: tenantId,
    branch_id: branchId,
    template_id: template.id,
    customer_id: template.customer_id,
    address_id: template.address_id,
    rider_id: template.rider_id,
    scheduled_date: date,
    status: 'pending' as const,
  }));

  const { data: createdBookings, error: createError } = await supabase.from('bookings').insert(bookingRows).select('id, template_id, scheduled_date');

  if (createError) {
    throw createError;
  }

  // Match created bookings back to their templates to insert items
  if (createdBookings && createdBookings.length > 0) {
    const templateMap = new Map((templates as TemplateRow[]).map((t) => [t.id, t]));

    const allItemRows: Array<{
      booking_id: string;
      tenant_id: string;
      branch_id: string;
      product_id: string;
      container_type_id: string;
      quantity: number;
      is_new_container: boolean;
    }> = [];

    for (const booking of createdBookings) {
      const template = templateMap.get(booking.template_id);

      if (!template) {
        continue;
      }

      for (const item of template.items) {
        allItemRows.push({
          booking_id: booking.id,
          tenant_id: tenantId,
          branch_id: branchId,
          product_id: item.product_id,
          container_type_id: item.container_type_id,
          quantity: item.quantity,
          is_new_container: item.is_new_container,
        });
      }
    }

    if (allItemRows.length > 0) {
      const { error: itemsError } = await supabase.from('booking_items').insert(allItemRows);

      if (itemsError) {
        throw itemsError;
      }
    }
  }

  return toCreate.length;
}

// ─── Fulfill booking ──────────────────────────────────────────────────────────

export async function fulfillBooking(
  tenantId: string,
  branchId: string,
  bookingId: string,
  prices: Array<{
    product_id: string;
    container_type_id: string;
    unit_price_centavos: number;
  }>,
): Promise<string> {
  // 1. Load booking + items
  const { data: booking, error: bookingError } = await supabase.from('bookings').select('*, items:booking_items(*)').eq('id', bookingId).single();

  if (bookingError || !booking) {
    throw bookingError ?? new Error('Booking not found');
  }

  const items = (booking.items ?? []) as BookingItem[];

  // 2. Create sale
  const { data: sale, error: saleError } = await supabase
    .from('sales')
    .insert({
      tenant_id: tenantId,
      branch_id: branchId,
      source: 'booking_fulfilled',
      status: 'pending_delivery',
      customer_id: booking.customer_id,
      address_id: booking.address_id,
      rider_id: booking.rider_id,
      booking_id: bookingId,
      sale_date: booking.scheduled_date,
    })
    .select()
    .single();

  if (saleError || !sale) {
    throw saleError ?? new Error('Failed to create sale');
  }

  // 3. Insert sale lines
  const priceMap = new Map(prices.map((p) => [`${p.product_id}|${p.container_type_id}`, p.unit_price_centavos]));

  const saleLines = items.map((item) => ({
    sale_id: sale.id,
    tenant_id: tenantId,
    branch_id: branchId,
    product_id: item.product_id,
    container_type_id: item.container_type_id,
    quantity: item.quantity,
    unit_price_centavos: priceMap.get(`${item.product_id}|${item.container_type_id}`) ?? 0,
    is_new_container: item.is_new_container,
  }));

  if (saleLines.length > 0) {
    const { error: linesError } = await supabase.from('sale_lines').insert(saleLines);

    if (linesError) {
      throw linesError;
    }
  }

  // 4. Update booking
  const { error: updateError } = await supabase.from('bookings').update({ status: 'fulfilled', sale_id: sale.id }).eq('id', bookingId);

  if (updateError) {
    throw updateError;
  }

  return sale.id;
}
