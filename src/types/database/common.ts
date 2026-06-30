import type { Database } from './supabase';

export type UserRole = Database['public']['Enums']['user_role'];
export type SubscriptionPlan = Database['public']['Enums']['subscription_plan'];
export type TenantStatus = Database['public']['Enums']['tenant_status'];

export type SettingKey = 'staleness_days_delivery' | 'staleness_days_walkin' | 'booking_horizon_days' | 'default_quota_jugs' | 'commission_per_jug_centavos';

export type Tenant = Database['public']['Tables']['tenants']['Row'];
export type Branch = Database['public']['Tables']['branches']['Row'];
export type User = Database['public']['Tables']['users']['Row'];
export type Setting = Database['public']['Tables']['settings']['Row'];

/** One client row with aggregated stats, returned by the superadmin_tenant_overview RPC. */
export type TenantOverview = Database['public']['Functions']['superadmin_tenant_overview']['Returns'][number];
