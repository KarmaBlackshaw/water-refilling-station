import { nowISO } from '@/helpers/date';
import { supabase } from '@/helpers/supabase';
import type { Product, ContainerType } from '@/types/database';

// Products
export async function listProducts(tenantId: string, branchId: string) {
  return supabase.from('products').select('*').eq('tenant_id', tenantId).eq('branch_id', branchId).is('deleted_at', null).order('sort_order');
}

export async function createProduct(data: { tenant_id: string; branch_id: string; name: string; sort_order?: number }) {
  return supabase.from('products').insert(data).select().single();
}

export async function updateProduct(id: string, data: Partial<Pick<Product, 'name' | 'active' | 'sort_order'>>) {
  return supabase.from('products').update(data).eq('id', id).select().single();
}

export async function softDeleteProduct(id: string, deletedBy: string) {
  return supabase.from('products').update({ deleted_at: nowISO(), deleted_by: deletedBy }).eq('id', id);
}

// Container types
export async function listContainerTypes(tenantId: string, branchId: string) {
  return supabase.from('container_types').select('*').eq('tenant_id', tenantId).eq('branch_id', branchId).is('deleted_at', null).order('sort_order');
}

export async function createContainerType(data: { tenant_id: string; branch_id: string; name: string; deposit_centavos: number; sort_order?: number }) {
  return supabase.from('container_types').insert(data).select().single();
}

export async function updateContainerType(id: string, data: Partial<Pick<ContainerType, 'name' | 'active' | 'deposit_centavos' | 'sort_order'>>) {
  return supabase.from('container_types').update(data).eq('id', id).select().single();
}

export async function softDeleteContainerType(id: string, deletedBy: string) {
  return supabase.from('container_types').update({ deleted_at: nowISO(), deleted_by: deletedBy }).eq('id', id);
}

// Product pricing
export async function listProductPricing(tenantId: string, branchId: string) {
  return supabase.from('product_pricing').select('*').eq('tenant_id', tenantId).eq('branch_id', branchId).order('effective_from', { ascending: false });
}

export async function upsertProductPricing(data: {
  tenant_id: string;
  branch_id: string;
  product_id: string;
  container_type_id: string;
  refill_price_centavos: number;
  new_container_price_centavos: number;
  effective_from: string;
}) {
  return supabase.from('product_pricing').insert(data).select().single();
}
