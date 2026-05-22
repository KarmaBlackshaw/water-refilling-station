export interface Product {
  id: string;
  tenant_id: string;
  branch_id: string;
  name: string;
  active: boolean;
  sort_order: number;
  created_at: string;
  deleted_at: string | null;
  deleted_by: string | null;
}

export interface ContainerType {
  id: string;
  tenant_id: string;
  branch_id: string;
  name: string;
  deposit_centavos: number;
  active: boolean;
  sort_order: number;
  created_at: string;
  deleted_at: string | null;
  deleted_by: string | null;
}

export interface ProductPricing {
  id: string;
  tenant_id: string;
  branch_id: string;
  product_id: string;
  container_type_id: string;
  refill_price_centavos: number;
  new_container_price_centavos: number;
  effective_from: string;
  created_at: string;
}
