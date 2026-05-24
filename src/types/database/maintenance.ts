import type { Database } from './supabase';

export type MaintenanceScope = Database['public']['Enums']['maintenance_scope'];
export type ScheduleKind = Database['public']['Enums']['schedule_kind'];

export type MaintenanceTask = Database['public']['Tables']['maintenance_tasks']['Row'];
export type MaintenanceLog = Database['public']['Tables']['maintenance_logs']['Row'];
