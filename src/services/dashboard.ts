import { addDays, today } from '@/helpers/date';
import { supabase } from '@/helpers/supabase';
import { listTasks } from '@/services/maintenance';
import type { MaintenanceTask } from '@/types/database';

export async function getActiveCustomerCount(): Promise<number> {
  const { count } = await supabase.from('customers').select('id', { count: 'exact', head: true }).is('deleted_at', null);

  return count ?? 0;
}

export async function getPendingDeliveryCount(): Promise<number> {
  const { count } = await supabase
    .from('sales')
    .select('id', { count: 'exact', head: true })
    .in('source', ['delivery', 'booking_fulfilled'])
    .eq('status', 'pending_delivery')
    .is('deleted_at', null)
    .eq('sale_date', today());

  return count ?? 0;
}

export async function getUpcomingBookingCount(): Promise<number> {
  const start = today();
  const end = addDays(start, 3);
  const { count } = await supabase
    .from('bookings')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pending')
    .gte('booking_date', start)
    .lte('booking_date', end);

  return count ?? 0;
}

export async function getMaintenanceAlertCount(): Promise<number> {
  const [plantTasks, vehicleTasks] = await Promise.all([listTasks('water_plant'), listTasks('vehicle')]);
  const allTasks: MaintenanceTask[] = [...plantTasks, ...vehicleTasks];
  const todayISO = today();

  return allTasks.filter((t) => t.next_due_at !== null && t.next_due_at < todayISO).length;
}
