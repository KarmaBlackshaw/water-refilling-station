export type SaleSource = 'walk_in' | 'delivery' | 'booking_fulfilled';
export type SaleStatus = 'pending_delivery' | 'completed' | 'void';
export type PaymentMethod = 'cash' | 'gcash' | 'on_account';

export interface Sale {
  id: string;
  tenant_id: string;
  branch_id: string;
  source: SaleSource;
  status: SaleStatus;
  customer_id: string | null;
  address_id: string | null;
  rider_id: string | null;
  cashier_id: string | null;
  delivered_by_name: string | null;
  booking_id: string | null;
  sale_date: string;
  notes: string | null;
  created_at: string;
  deleted_at: string | null;
  deleted_by: string | null;
}

export interface SaleLine {
  id: string;
  tenant_id: string;
  branch_id: string;
  sale_id: string;
  product_id: string;
  container_type_id: string;
  quantity: number;
  unit_price_centavos: number;
  is_new_container: boolean;
  created_at: string;
}

export interface SalePayment {
  id: string;
  tenant_id: string;
  branch_id: string;
  sale_id: string;
  method: PaymentMethod;
  amount_centavos: number;
  gcash_ref: string | null;
  created_at: string;
}
