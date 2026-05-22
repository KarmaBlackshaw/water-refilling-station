import { nowISO } from '@/helpers/date';
import { supabase } from '@/helpers/supabase';
import type { Area } from '@/types/database';

export function listAreas(tenantId: string, branchId: string) {
  return supabase
    .from('areas')
    .select('*, primary_rider:users!primary_rider_id(id, full_name)')
    .eq('tenant_id', tenantId)
    .eq('branch_id', branchId)
    .is('deleted_at', null)
    .order('name');
}

export function createArea(data: { tenant_id: string; branch_id: string; name: string; notes?: string | null; primary_rider_id?: string | null }) {
  return supabase.from('areas').insert(data).select().single();
}

export function updateArea(id: string, data: Partial<Pick<Area, 'name' | 'notes' | 'primary_rider_id'>>) {
  return supabase.from('areas').update(data).eq('id', id).select().single();
}

export function softDeleteArea(id: string, deletedBy: string) {
  return supabase.from('areas').update({ deleted_at: nowISO(), deleted_by: deletedBy }).eq('id', id);
}

// Coverage records
export function listCoverageRecords(areaId: string) {
  return supabase
    .from('area_coverage_records')
    .select('*, covering_rider:users!covering_rider_id(id, full_name)')
    .eq('area_id', areaId)
    .is('deleted_at', null)
    .order('starts_on', { ascending: false });
}

export function createCoverageRecord(data: {
  tenant_id: string;
  branch_id: string;
  area_id: string;
  covering_rider_id: string;
  starts_on: string;
  ends_on?: string | null;
}) {
  return supabase.from('area_coverage_records').insert(data).select().single();
}

export function endCoverageRecord(id: string, endsOn: string) {
  return supabase.from('area_coverage_records').update({ ends_on: endsOn }).eq('id', id).select().single();
}

export function softDeleteCoverageRecord(id: string, deletedBy: string) {
  return supabase.from('area_coverage_records').update({ deleted_at: nowISO(), deleted_by: deletedBy }).eq('id', id);
}

// Resolve active rider for an area on a given date (ISO date string 'YYYY-MM-DD')
export async function getActiveRiderForArea(areaId: string, date: string): Promise<{ riderId: string | null; isCovering: boolean }> {
  // Check for active coverage record on this date
  const { data: coverage } = await supabase
    .from('area_coverage_records')
    .select('covering_rider_id')
    .eq('area_id', areaId)
    .is('deleted_at', null)
    .lte('starts_on', date)
    .or(`ends_on.is.null,ends_on.gte.${date}`)
    .limit(1)
    .maybeSingle();

  if (coverage) {
    return { riderId: coverage.covering_rider_id, isCovering: true };
  }

  // Fall back to primary rider
  const { data: area } = await supabase.from('areas').select('primary_rider_id').eq('id', areaId).maybeSingle();

  return { riderId: area?.primary_rider_id ?? null, isCovering: false };
}

// List riders (users with role 'rider') for a tenant
export function listRiders(tenantId: string, branchId: string) {
  return supabase
    .from('users')
    .select('id, full_name, role')
    .eq('tenant_id', tenantId)
    .eq('branch_id', branchId)
    .eq('role', 'rider')
    .is('deleted_at', null)
    .order('full_name');
}
