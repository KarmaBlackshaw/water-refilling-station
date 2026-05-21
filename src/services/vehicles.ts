import { nowISO } from '@/helpers/date';
import { supabase } from '@/helpers/supabase';
import { getCurrentUserId } from '@/helpers/supabase';
import type { Vehicle, MaintenanceTask } from '@/types/database';

export async function listVehicles(): Promise<Vehicle[]> {
  const { data, error } = await supabase.from('vehicles').select('*').is('deleted_at', null).order('brand_model');

  if (error) {
    throw error;
  }

  return data as Vehicle[];
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

  return data as MaintenanceTask[];
}

export async function createVehicle(data: {
  type: string;
  brand_model: string;
  plate_number: string;
  year?: number | null;
  notes?: string | null;
}): Promise<Vehicle> {
  const { data: row, error } = await supabase.from('vehicles').insert(data).select().single();

  if (error) {
    throw error;
  }

  return row as Vehicle;
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

  return row as Vehicle;
}

export async function deleteVehicle(id: string): Promise<void> {
  const userId = await getCurrentUserId();
  const { error } = await supabase.from('vehicles').update({ deleted_at: nowISO(), deleted_by: userId }).eq('id', id);

  if (error) {
    throw error;
  }
}
