import { nowISO } from '@/helpers/date';
import { supabase } from '@/helpers/supabase';
import type { SettingKey } from '@/types/database';

export function fetchSettings(tenantId: string, branchId: string) {
  return supabase.from('settings').select('*').eq('tenant_id', tenantId).eq('branch_id', branchId);
}

export function upsertSetting(tenantId: string, branchId: string, key: SettingKey, value: string) {
  return supabase
    .from('settings')
    .upsert({ tenant_id: tenantId, branch_id: branchId, key, value, updated_at: nowISO() })
    .eq('tenant_id', tenantId)
    .eq('branch_id', branchId)
    .eq('key', key);
}
