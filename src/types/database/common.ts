export type UserRole = 'admin' | 'manager' | 'cashier' | 'rider';

export type SettingKey = 'staleness_days_delivery' | 'staleness_days_walkin' | 'booking_horizon_days' | 'default_quota_jugs' | 'commission_per_jug_centavos';

export interface Tenant {
  id: string;
  name: string;
  created_at: string;
}

export interface Branch {
  id: string;
  tenant_id: string;
  name: string;
  created_at: string;
}

export interface User {
  id: string;
  tenant_id: string;
  branch_id: string;
  full_name: string;
  phone: string | null;
  role: UserRole;
  active: boolean;
  created_at: string;
  deleted_at: string | null;
  deleted_by: string | null;
}

export interface Setting {
  id: string;
  tenant_id: string;
  branch_id: string;
  key: SettingKey;
  value: string;
  updated_at: string;
  updated_by: string | null;
}
