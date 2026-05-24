import type { Database } from './supabase';

export type UserRole = Database['public']['Enums']['user_role'];

export type SettingKey = 'staleness_days_delivery' | 'staleness_days_walkin' | 'booking_horizon_days' | 'default_quota_jugs' | 'commission_per_jug_centavos';

export type Tenant = Database['public']['Tables']['tenants']['Row'];
export type Branch = Database['public']['Tables']['branches']['Row'];
export type User = Database['public']['Tables']['users']['Row'];
export type Setting = Database['public']['Tables']['settings']['Row'];
