import { nowISO } from '@/helpers/date';
import { supabase } from '@/helpers/supabase';
import { getCurrentUserId } from '@/helpers/supabase';
import type { Vehicle, MaintenanceTask } from '@/types/database';

/**
 * List all non-deleted vehicles, optionally filtered by a search term.
 *
 * @param filters.search - Case-insensitive substring matched against `brand_model` OR `plate_number`.
 */
export async function listVehicles(filters?: { search?: string }): Promise<Vehicle[]> {
  let query = supabase.from('vehicles').select('*').is('deleted_at', null).order('brand_model');

  if (filters?.search) {
    const s = filters.search;

    query = query.or('brand_model.ilike.%' + s + '%,plate_number.ilike.%' + s + '%');
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function listVehicleMaintenanceTasks(vehicleIds: string[]): Promise<MaintenanceTask[]> {
  if (vehicleIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from('maintenance_tasks')
    .select('*')
    .eq('scope', 'vehicle')
    .in('vehicle_id', vehicleIds)
    .eq('active', true)
    .is('deleted_at', null);

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function createVehicle(
  tenantId: string,
  branchId: string,
  data: {
    type: string;
    brand_model: string;
    plate_number: string;
    year?: number | null;
    notes?: string | null;
  },
): Promise<Vehicle> {
  const { data: row, error } = await supabase
    .from('vehicles')
    .insert({ tenant_id: tenantId, branch_id: branchId, ...data })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return row;
}

export async function updateVehicle(
  id: string,
  data: {
    type?: string;
    brand_model?: string;
    plate_number?: string;
    year?: number | null;
    notes?: string | null;
  },
): Promise<Vehicle> {
  const { data: row, error } = await supabase.from('vehicles').update(data).eq('id', id).select().single();

  if (error) {
    throw error;
  }

  return row;
}

export async function deleteVehicle(id: string): Promise<void> {
  const userId = await getCurrentUserId();
  const { error } = await supabase.from('vehicles').update({ deleted_at: nowISO(), deleted_by: userId }).eq('id', id);

  if (error) {
    throw error;
  }
}
