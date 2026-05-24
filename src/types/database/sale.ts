import type { Database } from './supabase';

export type SaleSource = Database['public']['Enums']['sale_source'];
export type SaleStatus = Database['public']['Enums']['sale_status'];
export type PaymentMethod = Database['public']['Enums']['payment_method'];

export type Sale = Database['public']['Tables']['sales']['Row'];
export type SaleLine = Database['public']['Tables']['sale_lines']['Row'];
export type SalePayment = Database['public']['Tables']['sale_payments']['Row'];
