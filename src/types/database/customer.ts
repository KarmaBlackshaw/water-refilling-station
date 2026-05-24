import type { Database } from './supabase';

export type CustomerType = Database['public']['Enums']['customer_type'];

export type Customer = Database['public']['Tables']['customers']['Row'];
export type CustomerAddress = Database['public']['Tables']['customer_addresses']['Row'];
export type CustomerPriceOverride = Database['public']['Tables']['customer_price_overrides']['Row'];
