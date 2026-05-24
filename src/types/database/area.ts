import type { Database } from './supabase';

export type Area = Database['public']['Tables']['areas']['Row'];
export type AreaCoverageRecord = Database['public']['Tables']['area_coverage_records']['Row'];
