import type { Database } from './supabase';

export type Product = Database['public']['Tables']['products']['Row'];
export type ContainerType = Database['public']['Tables']['container_types']['Row'];
export type ProductPricing = Database['public']['Tables']['product_pricing']['Row'];
