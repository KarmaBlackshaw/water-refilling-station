-- =============================================================
-- ENUMS
-- =============================================================

CREATE TYPE user_role AS ENUM ('admin', 'manager', 'cashier', 'rider');
CREATE TYPE customer_type AS ENUM ('residential', 'commercial');
CREATE TYPE sale_source AS ENUM ('walk_in', 'delivery', 'booking_fulfilled');
CREATE TYPE sale_status AS ENUM ('pending_delivery', 'completed', 'void');
CREATE TYPE payment_method AS ENUM ('cash', 'gcash', 'on_account');
CREATE TYPE container_movement_type AS ENUM ('out', 'in', 'lost', 'adjustment');
CREATE TYPE booking_cadence AS ENUM ('weekly', 'bi_weekly', 'monthly');
CREATE TYPE booking_status AS ENUM ('pending', 'fulfilled', 'cancelled');
CREATE TYPE attendance_status AS ENUM ('present', 'absent');
CREATE TYPE maintenance_scope AS ENUM ('water_plant', 'vehicle');
CREATE TYPE schedule_kind AS ENUM ('time', 'usage');
CREATE TYPE expense_category AS ENUM ('gasoline', 'parts', 'supplies', 'utilities', 'other');

-- =============================================================
-- TENANT SCAFFOLDING
-- =============================================================

CREATE TABLE tenants (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE branches (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES tenants(id),
  name        text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE users (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id   uuid NOT NULL REFERENCES tenants(id),
  branch_id   uuid NOT NULL REFERENCES branches(id),
  full_name   text NOT NULL,
  phone       text,
  role        user_role NOT NULL DEFAULT 'admin',
  active      boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  deleted_at  timestamptz,
  deleted_by  uuid REFERENCES users(id)
);

-- =============================================================
-- SETTINGS (key-value per tenant+branch)
-- =============================================================

CREATE TABLE settings (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES tenants(id),
  branch_id   uuid NOT NULL REFERENCES branches(id),
  key         text NOT NULL,
  value       text NOT NULL,
  updated_at  timestamptz NOT NULL DEFAULT now(),
  updated_by  uuid REFERENCES users(id),
  UNIQUE (tenant_id, branch_id, key)
);

-- =============================================================
-- PRODUCTS & CONTAINERS
-- =============================================================

CREATE TABLE products (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES tenants(id),
  branch_id   uuid NOT NULL REFERENCES branches(id),
  name        text NOT NULL,
  active      boolean NOT NULL DEFAULT true,
  sort_order  smallint NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  deleted_at  timestamptz,
  deleted_by  uuid REFERENCES users(id)
);

CREATE TABLE container_types (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id            uuid NOT NULL REFERENCES tenants(id),
  branch_id            uuid NOT NULL REFERENCES branches(id),
  name                 text NOT NULL,
  deposit_centavos     integer NOT NULL DEFAULT 0,
  active               boolean NOT NULL DEFAULT true,
  sort_order           smallint NOT NULL DEFAULT 0,
  created_at           timestamptz NOT NULL DEFAULT now(),
  deleted_at           timestamptz,
  deleted_by           uuid REFERENCES users(id)
);

CREATE TABLE product_pricing (
  id                              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                       uuid NOT NULL REFERENCES tenants(id),
  branch_id                       uuid NOT NULL REFERENCES branches(id),
  product_id                      uuid NOT NULL REFERENCES products(id),
  container_type_id               uuid NOT NULL REFERENCES container_types(id),
  refill_price_centavos           integer NOT NULL,
  new_container_price_centavos    integer NOT NULL,
  effective_from                  date NOT NULL,
  created_at                      timestamptz NOT NULL DEFAULT now()
);

-- =============================================================
-- AREAS
-- =============================================================

CREATE TABLE areas (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         uuid NOT NULL REFERENCES tenants(id),
  branch_id         uuid NOT NULL REFERENCES branches(id),
  name              text NOT NULL,
  notes             text,
  primary_rider_id  uuid REFERENCES users(id),
  created_at        timestamptz NOT NULL DEFAULT now(),
  deleted_at        timestamptz,
  deleted_by        uuid REFERENCES users(id)
);

CREATE TABLE area_coverage_records (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         uuid NOT NULL REFERENCES tenants(id),
  branch_id         uuid NOT NULL REFERENCES branches(id),
  area_id           uuid NOT NULL REFERENCES areas(id),
  covering_rider_id uuid NOT NULL REFERENCES users(id),
  starts_on         date NOT NULL,
  ends_on           date,
  created_at        timestamptz NOT NULL DEFAULT now(),
  deleted_at        timestamptz,
  deleted_by        uuid REFERENCES users(id)
);

-- =============================================================
-- CUSTOMERS
-- =============================================================

CREATE TABLE customers (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES tenants(id),
  branch_id   uuid NOT NULL REFERENCES branches(id),
  name        text NOT NULL,
  phone       text,
  type        customer_type NOT NULL DEFAULT 'residential',
  area_id     uuid REFERENCES areas(id),
  notes       text,
  active      boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  deleted_at  timestamptz,
  deleted_by  uuid REFERENCES users(id)
);

CREATE TABLE customer_addresses (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid NOT NULL REFERENCES tenants(id),
  branch_id     uuid NOT NULL REFERENCES branches(id),
  customer_id   uuid NOT NULL REFERENCES customers(id),
  label         text NOT NULL DEFAULT 'Default',
  address_line  text NOT NULL,
  lat           numeric(10, 7),
  lng           numeric(10, 7),
  is_default    boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now(),
  deleted_at    timestamptz,
  deleted_by    uuid REFERENCES users(id)
);

CREATE TABLE customer_price_overrides (
  id                              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                       uuid NOT NULL REFERENCES tenants(id),
  branch_id                       uuid NOT NULL REFERENCES branches(id),
  customer_id                     uuid NOT NULL REFERENCES customers(id),
  product_id                      uuid NOT NULL REFERENCES products(id),
  container_type_id               uuid NOT NULL REFERENCES container_types(id),
  refill_price_centavos           integer NOT NULL,
  new_container_price_centavos    integer NOT NULL,
  created_at                      timestamptz NOT NULL DEFAULT now(),
  deleted_at                      timestamptz,
  deleted_by                      uuid REFERENCES users(id),
  UNIQUE (customer_id, product_id, container_type_id)
);

-- =============================================================
-- EMPLOYEES
-- =============================================================

CREATE TABLE employees (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                uuid NOT NULL REFERENCES tenants(id),
  branch_id                uuid NOT NULL REFERENCES branches(id),
  user_id                  uuid REFERENCES users(id),
  full_name                text NOT NULL,
  phone                    text,
  hire_date                date,
  role                     user_role NOT NULL DEFAULT 'rider',
  monthly_salary_centavos  integer NOT NULL,
  daily_quota_jugs         integer,
  active                   boolean NOT NULL DEFAULT true,
  created_at               timestamptz NOT NULL DEFAULT now(),
  deleted_at               timestamptz,
  deleted_by               uuid REFERENCES users(id)
);

CREATE TABLE employee_attendance (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        uuid NOT NULL REFERENCES tenants(id),
  branch_id        uuid NOT NULL REFERENCES branches(id),
  employee_id      uuid NOT NULL REFERENCES employees(id),
  attendance_date  date NOT NULL,
  status           attendance_status NOT NULL,
  created_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (employee_id, attendance_date)
);

CREATE TABLE salary_records (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             uuid NOT NULL REFERENCES tenants(id),
  branch_id             uuid NOT NULL REFERENCES branches(id),
  employee_id           uuid NOT NULL REFERENCES employees(id),
  period_start          date NOT NULL,
  period_end            date NOT NULL,
  base_pay_centavos     integer NOT NULL,
  commission_centavos   integer NOT NULL DEFAULT 0,
  gross_centavos        integer NOT NULL,
  net_centavos          integer NOT NULL,
  notes                 text,
  paid_at               timestamptz,
  paid_by               uuid REFERENCES users(id),
  created_at            timestamptz NOT NULL DEFAULT now()
);

-- =============================================================
-- SALES
-- =============================================================

CREATE TABLE sales (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id            uuid NOT NULL REFERENCES tenants(id),
  branch_id            uuid NOT NULL REFERENCES branches(id),
  source               sale_source NOT NULL,
  status               sale_status NOT NULL DEFAULT 'completed',
  customer_id          uuid REFERENCES customers(id),
  address_id           uuid REFERENCES customer_addresses(id),
  rider_id             uuid REFERENCES users(id),
  cashier_id           uuid REFERENCES users(id),
  delivered_by_name    text,
  booking_id           uuid,
  sale_date            date NOT NULL,
  notes                text,
  created_at           timestamptz NOT NULL DEFAULT now(),
  deleted_at           timestamptz,
  deleted_by           uuid REFERENCES users(id)
);

CREATE TABLE sale_lines (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                uuid NOT NULL REFERENCES tenants(id),
  branch_id                uuid NOT NULL REFERENCES branches(id),
  sale_id                  uuid NOT NULL REFERENCES sales(id),
  product_id               uuid NOT NULL REFERENCES products(id),
  container_type_id        uuid NOT NULL REFERENCES container_types(id),
  quantity                 integer NOT NULL CHECK (quantity > 0),
  unit_price_centavos      integer NOT NULL,
  is_new_container         boolean NOT NULL DEFAULT false,
  created_at               timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE sale_payments (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        uuid NOT NULL REFERENCES tenants(id),
  branch_id        uuid NOT NULL REFERENCES branches(id),
  sale_id          uuid NOT NULL REFERENCES sales(id),
  method           payment_method NOT NULL,
  amount_centavos  integer NOT NULL,
  gcash_ref        text,
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- =============================================================
-- CONTAINER MOVEMENTS (event-sourced)
-- =============================================================

CREATE TABLE container_movements (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id          uuid NOT NULL REFERENCES tenants(id),
  branch_id          uuid NOT NULL REFERENCES branches(id),
  customer_id        uuid REFERENCES customers(id),
  container_type_id  uuid NOT NULL REFERENCES container_types(id),
  sale_id            uuid REFERENCES sales(id),
  movement_type      container_movement_type NOT NULL,
  quantity           integer NOT NULL,
  movement_date      date NOT NULL,
  notes              text,
  created_at         timestamptz NOT NULL DEFAULT now(),
  deleted_at         timestamptz,
  deleted_by         uuid REFERENCES users(id)
);

-- =============================================================
-- BOOKINGS
-- =============================================================

CREATE TABLE booking_templates (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    uuid NOT NULL REFERENCES tenants(id),
  branch_id    uuid NOT NULL REFERENCES branches(id),
  customer_id  uuid NOT NULL REFERENCES customers(id),
  address_id   uuid REFERENCES customer_addresses(id),
  rider_id     uuid REFERENCES users(id),
  cadence      booking_cadence NOT NULL,
  day_of_week  smallint NOT NULL CHECK (day_of_week BETWEEN 0 AND 5),
  active       boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now(),
  deleted_at   timestamptz,
  deleted_by   uuid REFERENCES users(id)
);

CREATE TABLE booking_template_items (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id          uuid NOT NULL REFERENCES tenants(id),
  branch_id          uuid NOT NULL REFERENCES branches(id),
  template_id        uuid NOT NULL REFERENCES booking_templates(id),
  product_id         uuid NOT NULL REFERENCES products(id),
  container_type_id  uuid NOT NULL REFERENCES container_types(id),
  quantity           integer NOT NULL CHECK (quantity > 0),
  is_new_container   boolean NOT NULL DEFAULT false
);

CREATE TABLE bookings (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL REFERENCES tenants(id),
  branch_id       uuid NOT NULL REFERENCES branches(id),
  template_id     uuid REFERENCES booking_templates(id),
  customer_id     uuid NOT NULL REFERENCES customers(id),
  address_id      uuid REFERENCES customer_addresses(id),
  rider_id        uuid REFERENCES users(id),
  scheduled_date  date NOT NULL,
  status          booking_status NOT NULL DEFAULT 'pending',
  sale_id         uuid REFERENCES sales(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  deleted_at      timestamptz,
  deleted_by      uuid REFERENCES users(id)
);

CREATE TABLE booking_items (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id          uuid NOT NULL REFERENCES tenants(id),
  branch_id          uuid NOT NULL REFERENCES branches(id),
  booking_id         uuid NOT NULL REFERENCES bookings(id),
  product_id         uuid NOT NULL REFERENCES products(id),
  container_type_id  uuid NOT NULL REFERENCES container_types(id),
  quantity           integer NOT NULL CHECK (quantity > 0),
  is_new_container   boolean NOT NULL DEFAULT false
);

-- Add FK for sales.booking_id now that bookings table exists
ALTER TABLE sales ADD CONSTRAINT sales_booking_id_fkey
  FOREIGN KEY (booking_id) REFERENCES bookings(id);

-- =============================================================
-- VEHICLES & MAINTENANCE
-- =============================================================

CREATE TABLE vehicles (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    uuid NOT NULL REFERENCES tenants(id),
  branch_id    uuid NOT NULL REFERENCES branches(id),
  type         text NOT NULL,
  brand_model  text,
  plate_number text,
  year         smallint,
  notes        text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  deleted_at   timestamptz,
  deleted_by   uuid REFERENCES users(id)
);

CREATE TABLE maintenance_tasks (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL REFERENCES tenants(id),
  branch_id       uuid NOT NULL REFERENCES branches(id),
  scope           maintenance_scope NOT NULL,
  vehicle_id      uuid REFERENCES vehicles(id),
  task_type       text NOT NULL,
  schedule_kind   schedule_kind NOT NULL DEFAULT 'time',
  interval_days   integer,
  interval_usage  integer,
  last_done_at    date,
  next_due_at     date,
  active          boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  deleted_at      timestamptz,
  deleted_by      uuid REFERENCES users(id)
);

CREATE TABLE maintenance_logs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid NOT NULL REFERENCES tenants(id),
  branch_id     uuid NOT NULL REFERENCES branches(id),
  task_id       uuid NOT NULL REFERENCES maintenance_tasks(id),
  performed_at  date NOT NULL,
  performed_by  uuid REFERENCES users(id),
  cost_centavos integer,
  notes         text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- =============================================================
-- OPERATIONAL EXPENSES
-- =============================================================

CREATE TABLE operational_expenses (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id            uuid NOT NULL REFERENCES tenants(id),
  branch_id            uuid NOT NULL REFERENCES branches(id),
  expense_date         date NOT NULL,
  category             expense_category NOT NULL,
  amount_centavos      integer NOT NULL,
  payee_employee_id    uuid REFERENCES employees(id),
  description          text,
  reference_number     text,
  created_at           timestamptz NOT NULL DEFAULT now(),
  deleted_at           timestamptz,
  deleted_by           uuid REFERENCES users(id)
);

-- =============================================================
-- INDEXES
-- =============================================================

-- Tenant-scoped filtered indexes (most common query pattern)
CREATE INDEX idx_users_tenant ON users (tenant_id, branch_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_products_tenant ON products (tenant_id, branch_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_container_types_tenant ON container_types (tenant_id, branch_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_areas_tenant ON areas (tenant_id, branch_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_customers_tenant ON customers (tenant_id, branch_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_customers_phone ON customers (tenant_id, branch_id, phone) WHERE deleted_at IS NULL;
CREATE INDEX idx_employees_tenant ON employees (tenant_id, branch_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_vehicles_tenant ON vehicles (tenant_id, branch_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_expenses_tenant ON operational_expenses (tenant_id, branch_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_booking_templates_tenant ON booking_templates (tenant_id, branch_id) WHERE deleted_at IS NULL;

-- Sales by date (most common operational query)
CREATE INDEX idx_sales_date ON sales (tenant_id, branch_id, sale_date) WHERE deleted_at IS NULL;
CREATE INDEX idx_sales_status ON sales (tenant_id, branch_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_sales_customer ON sales (customer_id, sale_date) WHERE deleted_at IS NULL;

-- Container balance computation
CREATE INDEX idx_container_movements_customer ON container_movements (customer_id, container_type_id, movement_date);

-- Booking materialization
CREATE INDEX idx_bookings_date ON bookings (tenant_id, branch_id, scheduled_date, status) WHERE deleted_at IS NULL;

-- Coverage lookups
CREATE INDEX idx_coverage_area ON area_coverage_records (area_id, starts_on, ends_on) WHERE deleted_at IS NULL;

-- Attendance by employee+date
CREATE INDEX idx_attendance_employee ON employee_attendance (employee_id, attendance_date);

-- Price overrides lookup
CREATE INDEX idx_price_overrides_customer ON customer_price_overrides (customer_id, product_id, container_type_id) WHERE deleted_at IS NULL;

-- Maintenance due tasks
CREATE INDEX idx_maintenance_due ON maintenance_tasks (tenant_id, branch_id, next_due_at) WHERE deleted_at IS NULL AND active = true;

-- =============================================================
-- ROW LEVEL SECURITY
-- =============================================================

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE container_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE area_coverage_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_price_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE container_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_template_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE operational_expenses ENABLE ROW LEVEL SECURITY;

-- RLS policies: admin role sees their own tenant's data
-- app_metadata.tenant_id and app_metadata.branch_id are set on sign-up (NEVER user_metadata)

CREATE POLICY "tenant_isolation" ON tenants
  FOR ALL USING (id = ((auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid));

CREATE POLICY "tenant_isolation" ON branches
  FOR ALL USING (tenant_id = ((auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid));

CREATE POLICY "tenant_isolation" ON users
  FOR ALL USING (tenant_id = ((auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid));

CREATE POLICY "tenant_isolation" ON settings
  FOR ALL USING (tenant_id = ((auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid));

CREATE POLICY "tenant_isolation" ON products
  FOR ALL USING (tenant_id = ((auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid));

CREATE POLICY "tenant_isolation" ON container_types
  FOR ALL USING (tenant_id = ((auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid));

CREATE POLICY "tenant_isolation" ON product_pricing
  FOR ALL USING (tenant_id = ((auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid));

CREATE POLICY "tenant_isolation" ON areas
  FOR ALL USING (tenant_id = ((auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid));

CREATE POLICY "tenant_isolation" ON area_coverage_records
  FOR ALL USING (tenant_id = ((auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid));

CREATE POLICY "tenant_isolation" ON customers
  FOR ALL USING (tenant_id = ((auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid));

CREATE POLICY "tenant_isolation" ON customer_addresses
  FOR ALL USING (tenant_id = ((auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid));

CREATE POLICY "tenant_isolation" ON customer_price_overrides
  FOR ALL USING (tenant_id = ((auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid));

CREATE POLICY "tenant_isolation" ON employees
  FOR ALL USING (tenant_id = ((auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid));

CREATE POLICY "tenant_isolation" ON employee_attendance
  FOR ALL USING (tenant_id = ((auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid));

CREATE POLICY "tenant_isolation" ON salary_records
  FOR ALL USING (tenant_id = ((auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid));

CREATE POLICY "tenant_isolation" ON sales
  FOR ALL USING (tenant_id = ((auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid));

CREATE POLICY "tenant_isolation" ON sale_lines
  FOR ALL USING (tenant_id = ((auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid));

CREATE POLICY "tenant_isolation" ON sale_payments
  FOR ALL USING (tenant_id = ((auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid));

CREATE POLICY "tenant_isolation" ON container_movements
  FOR ALL USING (tenant_id = ((auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid));

CREATE POLICY "tenant_isolation" ON booking_templates
  FOR ALL USING (tenant_id = ((auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid));

CREATE POLICY "tenant_isolation" ON booking_template_items
  FOR ALL USING (tenant_id = ((auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid));

CREATE POLICY "tenant_isolation" ON bookings
  FOR ALL USING (tenant_id = ((auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid));

CREATE POLICY "tenant_isolation" ON booking_items
  FOR ALL USING (tenant_id = ((auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid));

CREATE POLICY "tenant_isolation" ON vehicles
  FOR ALL USING (tenant_id = ((auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid));

CREATE POLICY "tenant_isolation" ON maintenance_tasks
  FOR ALL USING (tenant_id = ((auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid));

CREATE POLICY "tenant_isolation" ON maintenance_logs
  FOR ALL USING (tenant_id = ((auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid));

CREATE POLICY "tenant_isolation" ON operational_expenses
  FOR ALL USING (tenant_id = ((auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid));

-- =============================================================
-- DEFAULT SETTINGS SEED FUNCTION
-- Called after tenant+branch creation to populate default settings
-- =============================================================

CREATE OR REPLACE FUNCTION insert_default_settings(p_tenant_id uuid, p_branch_id uuid)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO settings (tenant_id, branch_id, key, value) VALUES
    (p_tenant_id, p_branch_id, 'staleness_days_delivery', '7'),
    (p_tenant_id, p_branch_id, 'staleness_days_walkin', '14'),
    (p_tenant_id, p_branch_id, 'booking_horizon_days', '7'),
    (p_tenant_id, p_branch_id, 'default_quota_jugs', '150'),
    (p_tenant_id, p_branch_id, 'commission_per_jug_centavos', '100')
  ON CONFLICT (tenant_id, branch_id, key) DO NOTHING;
END;
$$;
