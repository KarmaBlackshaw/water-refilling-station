export type BookingCadence = 'weekly' | 'bi_weekly' | 'monthly';
export type BookingStatus = 'pending' | 'fulfilled' | 'cancelled';

export interface BookingTemplate {
  id: string;
  tenant_id: string;
  branch_id: string;
  customer_id: string;
  address_id: string | null;
  rider_id: string | null;
  cadence: BookingCadence;
  day_of_week: number;
  active: boolean;
  created_at: string;
  deleted_at: string | null;
  deleted_by: string | null;
}

export interface BookingTemplateItem {
  id: string;
  tenant_id: string;
  branch_id: string;
  template_id: string;
  product_id: string;
  container_type_id: string;
  quantity: number;
  is_new_container: boolean;
}

export interface Booking {
  id: string;
  tenant_id: string;
  branch_id: string;
  template_id: string | null;
  customer_id: string;
  address_id: string | null;
  rider_id: string | null;
  scheduled_date: string;
  status: BookingStatus;
  sale_id: string | null;
  created_at: string;
  deleted_at: string | null;
  deleted_by: string | null;
}

export interface BookingItem {
  id: string;
  tenant_id: string;
  branch_id: string;
  booking_id: string;
  product_id: string;
  container_type_id: string;
  quantity: number;
  is_new_container: boolean;
}
