import type { Database } from './supabase';

export type Vehicle = Database['public']['Tables']['vehicles']['Row'];
