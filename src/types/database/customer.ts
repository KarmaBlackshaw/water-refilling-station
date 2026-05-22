export type CustomerType = 'residential' | 'commercial';

export interface Customer {
  id: string;
  tenant_id: string;
  branch_id: string;
  name: string;
  phone: string | null;
  type: CustomerType;
  area_id: string | null;
  notes: string | null;
  active: boolean;
  created_at: string;
  deleted_at: string | null;
  deleted_by: string | null;
}

export interface CustomerAddress {
  id: string;
  tenant_id: string;
  branch_id: string;
  customer_id: string;
  label: string;
  address_line: string;
  lat: number | null;
  lng: number | null;
  is_default: boolean;
  created_at: string;
  deleted_at: string | null;
  deleted_by: string | null;
}

export interface CustomerPriceOverride {
  id: string;
  tenant_id: string;
  branch_id: string;
  customer_id: string;
  product_id: string;
  container_type_id: string;
  refill_price_centavos: number;
  new_container_price_centavos: number;
  created_at: string;
  deleted_at: string | null;
  deleted_by: string | null;
}
