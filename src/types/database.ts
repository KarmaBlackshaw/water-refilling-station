export type UserRole = 'admin' | 'manager' | 'cashier' | 'rider';
export type CustomerType = 'residential' | 'commercial';
export type SaleSource = 'walk_in' | 'delivery' | 'booking_fulfilled';
export type SaleStatus = 'pending_delivery' | 'completed' | 'void';
export type PaymentMethod = 'cash' | 'gcash' | 'on_account';
export type ContainerMovementType = 'out' | 'in' | 'lost' | 'adjustment';
export type BookingCadence = 'weekly' | 'bi_weekly' | 'monthly';
export type BookingStatus = 'pending' | 'fulfilled' | 'cancelled';
export type AttendanceStatus = 'present' | 'absent';
export type MaintenanceScope = 'water_plant' | 'vehicle';
export type ScheduleKind = 'time' | 'usage';
export type ExpenseCategory = 'gasoline' | 'parts' | 'supplies' | 'utilities' | 'other';

// Settings keys
export type SettingKey = 'staleness_days_delivery' | 'staleness_days_walkin' | 'booking_horizon_days' | 'default_quota_jugs' | 'commission_per_jug_centavos';

export interface Tenant {
  id: string;
  name: string;
  created_at: string;
}

export interface Branch {
  id: string;
  tenant_id: string;
  name: string;
  created_at: string;
}

export interface User {
  id: string;
  tenant_id: string;
  branch_id: string;
  full_name: string;
  phone: string | null;
  role: UserRole;
  active: boolean;
  created_at: string;
  deleted_at: string | null;
  deleted_by: string | null;
}

export interface Setting {
  id: string;
  tenant_id: string;
  branch_id: string;
  key: SettingKey;
  value: string;
  updated_at: string;
  updated_by: string | null;
}

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

export interface Area {
  id: string;
  tenant_id: string;
  branch_id: string;
  name: string;
  notes: string | null;
  primary_rider_id: string | null;
  created_at: string;
  deleted_at: string | null;
  deleted_by: string | null;
}

export interface AreaCoverageRecord {
  id: string;
  tenant_id: string;
  branch_id: string;
  area_id: string;
  covering_rider_id: string;
  starts_on: string;
  ends_on: string | null;
  created_at: string;
  deleted_at: string | null;
  deleted_by: string | null;
}

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

export interface Employee {
  id: string;
  tenant_id: string;
  branch_id: string;
  user_id: string | null;
  full_name: string;
  phone: string | null;
  hire_date: string | null;
  role: UserRole;
  monthly_salary_centavos: number;
  daily_quota_jugs: number | null;
  active: boolean;
  created_at: string;
  deleted_at: string | null;
  deleted_by: string | null;
}

export interface EmployeeAttendance {
  id: string;
  tenant_id: string;
  branch_id: string;
  employee_id: string;
  attendance_date: string;
  status: AttendanceStatus;
  created_at: string;
}

export interface SalaryRecord {
  id: string;
  tenant_id: string;
  branch_id: string;
  employee_id: string;
  period_start: string;
  period_end: string;
  base_pay_centavos: number;
  commission_centavos: number;
  gross_centavos: number;
  net_centavos: number;
  notes: string | null;
  paid_at: string | null;
  paid_by: string | null;
  created_at: string;
}

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

export interface ContainerMovement {
  id: string;
  tenant_id: string;
  branch_id: string;
  customer_id: string | null;
  container_type_id: string;
  sale_id: string | null;
  movement_type: ContainerMovementType;
  quantity: number;
  movement_date: string;
  notes: string | null;
  created_at: string;
  deleted_at: string | null;
  deleted_by: string | null;
}

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

export interface Vehicle {
  id: string;
  tenant_id: string;
  branch_id: string;
  type: string;
  brand_model: string | null;
  plate_number: string | null;
  year: number | null;
  notes: string | null;
  created_at: string;
  deleted_at: string | null;
  deleted_by: string | null;
}

export interface MaintenanceTask {
  id: string;
  tenant_id: string;
  branch_id: string;
  scope: MaintenanceScope;
  vehicle_id: string | null;
  task_type: string;
  schedule_kind: ScheduleKind;
  interval_days: number | null;
  interval_usage: number | null;
  last_done_at: string | null;
  next_due_at: string | null;
  active: boolean;
  created_at: string;
  deleted_at: string | null;
  deleted_by: string | null;
}

export interface MaintenanceLog {
  id: string;
  tenant_id: string;
  branch_id: string;
  task_id: string;
  performed_at: string;
  performed_by: string | null;
  cost_centavos: number | null;
  notes: string | null;
  created_at: string;
}

export interface OperationalExpense {
  id: string;
  tenant_id: string;
  branch_id: string;
  expense_date: string;
  category: ExpenseCategory;
  amount_centavos: number;
  payee_employee_id: string | null;
  description: string | null;
  reference_number: string | null;
  created_at: string;
  deleted_at: string | null;
  deleted_by: string | null;
}
