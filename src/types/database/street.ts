import type { Database } from './supabase';

export type Street = Database['public']['Tables']['streets']['Row'];
export type StreetInsert = Database['public']['Tables']['streets']['Insert'];
