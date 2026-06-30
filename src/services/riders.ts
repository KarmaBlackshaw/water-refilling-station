import { supabase } from '@/helpers/supabase';

/** List riders (users with role 'rider') for a tenant + branch. */
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

/** Assign primary + backup rider to one or more customers. */
export function assignRider(customerIds: string[], riderId: string | null, backupRiderId: string | null) {
  return supabase.from('customers').update({ rider_id: riderId, backup_rider_id: backupRiderId }).in('id', customerIds);
}
