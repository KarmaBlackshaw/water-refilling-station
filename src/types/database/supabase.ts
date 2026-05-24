export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.5';
  };
  public: {
    Tables: {
      area_coverage_records: {
        Row: {
          area_id: string;
          branch_id: string;
          covering_rider_id: string;
          created_at: string;
          deleted_at: string | null;
          deleted_by: string | null;
          ends_on: string | null;
          id: string;
          starts_on: string;
          tenant_id: string;
        };
        Insert: {
          area_id: string;
          branch_id: string;
          covering_rider_id: string;
          created_at?: string;
          deleted_at?: string | null;
          deleted_by?: string | null;
          ends_on?: string | null;
          id?: string;
          starts_on: string;
          tenant_id: string;
        };
        Update: {
          area_id?: string;
          branch_id?: string;
          covering_rider_id?: string;
          created_at?: string;
          deleted_at?: string | null;
          deleted_by?: string | null;
          ends_on?: string | null;
          id?: string;
          starts_on?: string;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'area_coverage_records_area_id_fkey';
            columns: ['area_id'];
            isOneToOne: false;
            referencedRelation: 'areas';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'area_coverage_records_branch_id_fkey';
            columns: ['branch_id'];
            isOneToOne: false;
            referencedRelation: 'branches';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'area_coverage_records_covering_rider_id_fkey';
            columns: ['covering_rider_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'area_coverage_records_deleted_by_fkey';
            columns: ['deleted_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'area_coverage_records_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          },
        ];
      };
      areas: {
        Row: {
          branch_id: string;
          created_at: string;
          deleted_at: string | null;
          deleted_by: string | null;
          id: string;
          name: string;
          notes: string | null;
          primary_rider_id: string | null;
          tenant_id: string;
        };
        Insert: {
          branch_id: string;
          created_at?: string;
          deleted_at?: string | null;
          deleted_by?: string | null;
          id?: string;
          name: string;
          notes?: string | null;
          primary_rider_id?: string | null;
          tenant_id: string;
        };
        Update: {
          branch_id?: string;
          created_at?: string;
          deleted_at?: string | null;
          deleted_by?: string | null;
          id?: string;
          name?: string;
          notes?: string | null;
          primary_rider_id?: string | null;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'areas_branch_id_fkey';
            columns: ['branch_id'];
            isOneToOne: false;
            referencedRelation: 'branches';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'areas_deleted_by_fkey';
            columns: ['deleted_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'areas_primary_rider_id_fkey';
            columns: ['primary_rider_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'areas_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          },
        ];
      };
      booking_items: {
        Row: {
          booking_id: string;
          branch_id: string;
          container_type_id: string;
          id: string;
          is_new_container: boolean;
          product_id: string;
          quantity: number;
          tenant_id: string;
        };
        Insert: {
          booking_id: string;
          branch_id: string;
          container_type_id: string;
          id?: string;
          is_new_container?: boolean;
          product_id: string;
          quantity: number;
          tenant_id: string;
        };
        Update: {
          booking_id?: string;
          branch_id?: string;
          container_type_id?: string;
          id?: string;
          is_new_container?: boolean;
          product_id?: string;
          quantity?: number;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'booking_items_booking_id_fkey';
            columns: ['booking_id'];
            isOneToOne: false;
            referencedRelation: 'bookings';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'booking_items_branch_id_fkey';
            columns: ['branch_id'];
            isOneToOne: false;
            referencedRelation: 'branches';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'booking_items_container_type_id_fkey';
            columns: ['container_type_id'];
            isOneToOne: false;
            referencedRelation: 'container_types';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'booking_items_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'booking_items_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          },
        ];
      };
      booking_template_items: {
        Row: {
          branch_id: string;
          container_type_id: string;
          id: string;
          is_new_container: boolean;
          product_id: string;
          quantity: number;
          template_id: string;
          tenant_id: string;
        };
        Insert: {
          branch_id: string;
          container_type_id: string;
          id?: string;
          is_new_container?: boolean;
          product_id: string;
          quantity: number;
          template_id: string;
          tenant_id: string;
        };
        Update: {
          branch_id?: string;
          container_type_id?: string;
          id?: string;
          is_new_container?: boolean;
          product_id?: string;
          quantity?: number;
          template_id?: string;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'booking_template_items_branch_id_fkey';
            columns: ['branch_id'];
            isOneToOne: false;
            referencedRelation: 'branches';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'booking_template_items_container_type_id_fkey';
            columns: ['container_type_id'];
            isOneToOne: false;
            referencedRelation: 'container_types';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'booking_template_items_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'booking_template_items_template_id_fkey';
            columns: ['template_id'];
            isOneToOne: false;
            referencedRelation: 'booking_templates';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'booking_template_items_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          },
        ];
      };
      booking_templates: {
        Row: {
          active: boolean;
          address_id: string | null;
          branch_id: string;
          cadence: Database['public']['Enums']['booking_cadence'];
          created_at: string;
          customer_id: string;
          day_of_week: number;
          deleted_at: string | null;
          deleted_by: string | null;
          id: string;
          rider_id: string | null;
          tenant_id: string;
        };
        Insert: {
          active?: boolean;
          address_id?: string | null;
          branch_id: string;
          cadence: Database['public']['Enums']['booking_cadence'];
          created_at?: string;
          customer_id: string;
          day_of_week: number;
          deleted_at?: string | null;
          deleted_by?: string | null;
          id?: string;
          rider_id?: string | null;
          tenant_id: string;
        };
        Update: {
          active?: boolean;
          address_id?: string | null;
          branch_id?: string;
          cadence?: Database['public']['Enums']['booking_cadence'];
          created_at?: string;
          customer_id?: string;
          day_of_week?: number;
          deleted_at?: string | null;
          deleted_by?: string | null;
          id?: string;
          rider_id?: string | null;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'booking_templates_address_id_fkey';
            columns: ['address_id'];
            isOneToOne: false;
            referencedRelation: 'customer_addresses';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'booking_templates_branch_id_fkey';
            columns: ['branch_id'];
            isOneToOne: false;
            referencedRelation: 'branches';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'booking_templates_customer_id_fkey';
            columns: ['customer_id'];
            isOneToOne: false;
            referencedRelation: 'customers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'booking_templates_deleted_by_fkey';
            columns: ['deleted_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'booking_templates_rider_id_fkey';
            columns: ['rider_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'booking_templates_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          },
        ];
      };
      bookings: {
        Row: {
          address_id: string | null;
          branch_id: string;
          created_at: string;
          customer_id: string;
          deleted_at: string | null;
          deleted_by: string | null;
          id: string;
          rider_id: string | null;
          sale_id: string | null;
          scheduled_date: string;
          status: Database['public']['Enums']['booking_status'];
          template_id: string | null;
          tenant_id: string;
        };
        Insert: {
          address_id?: string | null;
          branch_id: string;
          created_at?: string;
          customer_id: string;
          deleted_at?: string | null;
          deleted_by?: string | null;
          id?: string;
          rider_id?: string | null;
          sale_id?: string | null;
          scheduled_date: string;
          status?: Database['public']['Enums']['booking_status'];
          template_id?: string | null;
          tenant_id: string;
        };
        Update: {
          address_id?: string | null;
          branch_id?: string;
          created_at?: string;
          customer_id?: string;
          deleted_at?: string | null;
          deleted_by?: string | null;
          id?: string;
          rider_id?: string | null;
          sale_id?: string | null;
          scheduled_date?: string;
          status?: Database['public']['Enums']['booking_status'];
          template_id?: string | null;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'bookings_address_id_fkey';
            columns: ['address_id'];
            isOneToOne: false;
            referencedRelation: 'customer_addresses';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'bookings_branch_id_fkey';
            columns: ['branch_id'];
            isOneToOne: false;
            referencedRelation: 'branches';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'bookings_customer_id_fkey';
            columns: ['customer_id'];
            isOneToOne: false;
            referencedRelation: 'customers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'bookings_deleted_by_fkey';
            columns: ['deleted_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'bookings_rider_id_fkey';
            columns: ['rider_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'bookings_sale_id_fkey';
            columns: ['sale_id'];
            isOneToOne: false;
            referencedRelation: 'sales';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'bookings_template_id_fkey';
            columns: ['template_id'];
            isOneToOne: false;
            referencedRelation: 'booking_templates';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'bookings_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          },
        ];
      };
      branches: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          tenant_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          tenant_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'branches_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          },
        ];
      };
      container_movements: {
        Row: {
          branch_id: string;
          container_type_id: string;
          created_at: string;
          customer_id: string | null;
          deleted_at: string | null;
          deleted_by: string | null;
          id: string;
          movement_date: string;
          movement_type: Database['public']['Enums']['container_movement_type'];
          notes: string | null;
          quantity: number;
          sale_id: string | null;
          tenant_id: string;
        };
        Insert: {
          branch_id: string;
          container_type_id: string;
          created_at?: string;
          customer_id?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          id?: string;
          movement_date: string;
          movement_type: Database['public']['Enums']['container_movement_type'];
          notes?: string | null;
          quantity: number;
          sale_id?: string | null;
          tenant_id: string;
        };
        Update: {
          branch_id?: string;
          container_type_id?: string;
          created_at?: string;
          customer_id?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          id?: string;
          movement_date?: string;
          movement_type?: Database['public']['Enums']['container_movement_type'];
          notes?: string | null;
          quantity?: number;
          sale_id?: string | null;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'container_movements_branch_id_fkey';
            columns: ['branch_id'];
            isOneToOne: false;
            referencedRelation: 'branches';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'container_movements_container_type_id_fkey';
            columns: ['container_type_id'];
            isOneToOne: false;
            referencedRelation: 'container_types';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'container_movements_customer_id_fkey';
            columns: ['customer_id'];
            isOneToOne: false;
            referencedRelation: 'customers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'container_movements_deleted_by_fkey';
            columns: ['deleted_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'container_movements_sale_id_fkey';
            columns: ['sale_id'];
            isOneToOne: false;
            referencedRelation: 'sales';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'container_movements_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          },
        ];
      };
      container_types: {
        Row: {
          active: boolean;
          branch_id: string;
          created_at: string;
          deleted_at: string | null;
          deleted_by: string | null;
          deposit_centavos: number;
          id: string;
          name: string;
          sort_order: number;
          tenant_id: string;
        };
        Insert: {
          active?: boolean;
          branch_id: string;
          created_at?: string;
          deleted_at?: string | null;
          deleted_by?: string | null;
          deposit_centavos?: number;
          id?: string;
          name: string;
          sort_order?: number;
          tenant_id: string;
        };
        Update: {
          active?: boolean;
          branch_id?: string;
          created_at?: string;
          deleted_at?: string | null;
          deleted_by?: string | null;
          deposit_centavos?: number;
          id?: string;
          name?: string;
          sort_order?: number;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'container_types_branch_id_fkey';
            columns: ['branch_id'];
            isOneToOne: false;
            referencedRelation: 'branches';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'container_types_deleted_by_fkey';
            columns: ['deleted_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'container_types_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          },
        ];
      };
      customer_addresses: {
        Row: {
          address_line: string;
          branch_id: string;
          created_at: string;
          customer_id: string;
          deleted_at: string | null;
          deleted_by: string | null;
          id: string;
          is_default: boolean;
          label: string;
          lat: number | null;
          lng: number | null;
          tenant_id: string;
        };
        Insert: {
          address_line: string;
          branch_id: string;
          created_at?: string;
          customer_id: string;
          deleted_at?: string | null;
          deleted_by?: string | null;
          id?: string;
          is_default?: boolean;
          label?: string;
          lat?: number | null;
          lng?: number | null;
          tenant_id: string;
        };
        Update: {
          address_line?: string;
          branch_id?: string;
          created_at?: string;
          customer_id?: string;
          deleted_at?: string | null;
          deleted_by?: string | null;
          id?: string;
          is_default?: boolean;
          label?: string;
          lat?: number | null;
          lng?: number | null;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'customer_addresses_branch_id_fkey';
            columns: ['branch_id'];
            isOneToOne: false;
            referencedRelation: 'branches';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'customer_addresses_customer_id_fkey';
            columns: ['customer_id'];
            isOneToOne: false;
            referencedRelation: 'customers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'customer_addresses_deleted_by_fkey';
            columns: ['deleted_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'customer_addresses_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          },
        ];
      };
      customer_price_overrides: {
        Row: {
          branch_id: string;
          container_type_id: string;
          created_at: string;
          customer_id: string;
          deleted_at: string | null;
          deleted_by: string | null;
          id: string;
          new_container_price_centavos: number;
          product_id: string;
          refill_price_centavos: number;
          tenant_id: string;
        };
        Insert: {
          branch_id: string;
          container_type_id: string;
          created_at?: string;
          customer_id: string;
          deleted_at?: string | null;
          deleted_by?: string | null;
          id?: string;
          new_container_price_centavos: number;
          product_id: string;
          refill_price_centavos: number;
          tenant_id: string;
        };
        Update: {
          branch_id?: string;
          container_type_id?: string;
          created_at?: string;
          customer_id?: string;
          deleted_at?: string | null;
          deleted_by?: string | null;
          id?: string;
          new_container_price_centavos?: number;
          product_id?: string;
          refill_price_centavos?: number;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'customer_price_overrides_branch_id_fkey';
            columns: ['branch_id'];
            isOneToOne: false;
            referencedRelation: 'branches';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'customer_price_overrides_container_type_id_fkey';
            columns: ['container_type_id'];
            isOneToOne: false;
            referencedRelation: 'container_types';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'customer_price_overrides_customer_id_fkey';
            columns: ['customer_id'];
            isOneToOne: false;
            referencedRelation: 'customers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'customer_price_overrides_deleted_by_fkey';
            columns: ['deleted_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'customer_price_overrides_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'customer_price_overrides_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          },
        ];
      };
      customers: {
        Row: {
          active: boolean;
          area_id: string | null;
          branch_id: string;
          created_at: string;
          deleted_at: string | null;
          deleted_by: string | null;
          id: string;
          name: string;
          notes: string | null;
          phone: string | null;
          tenant_id: string;
          type: Database['public']['Enums']['customer_type'];
        };
        Insert: {
          active?: boolean;
          area_id?: string | null;
          branch_id: string;
          created_at?: string;
          deleted_at?: string | null;
          deleted_by?: string | null;
          id?: string;
          name: string;
          notes?: string | null;
          phone?: string | null;
          tenant_id: string;
          type?: Database['public']['Enums']['customer_type'];
        };
        Update: {
          active?: boolean;
          area_id?: string | null;
          branch_id?: string;
          created_at?: string;
          deleted_at?: string | null;
          deleted_by?: string | null;
          id?: string;
          name?: string;
          notes?: string | null;
          phone?: string | null;
          tenant_id?: string;
          type?: Database['public']['Enums']['customer_type'];
        };
        Relationships: [
          {
            foreignKeyName: 'customers_area_id_fkey';
            columns: ['area_id'];
            isOneToOne: false;
            referencedRelation: 'areas';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'customers_branch_id_fkey';
            columns: ['branch_id'];
            isOneToOne: false;
            referencedRelation: 'branches';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'customers_deleted_by_fkey';
            columns: ['deleted_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'customers_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          },
        ];
      };
      employee_attendance: {
        Row: {
          attendance_date: string;
          branch_id: string;
          created_at: string;
          employee_id: string;
          id: string;
          status: Database['public']['Enums']['attendance_status'];
          tenant_id: string;
        };
        Insert: {
          attendance_date: string;
          branch_id: string;
          created_at?: string;
          employee_id: string;
          id?: string;
          status: Database['public']['Enums']['attendance_status'];
          tenant_id: string;
        };
        Update: {
          attendance_date?: string;
          branch_id?: string;
          created_at?: string;
          employee_id?: string;
          id?: string;
          status?: Database['public']['Enums']['attendance_status'];
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'employee_attendance_branch_id_fkey';
            columns: ['branch_id'];
            isOneToOne: false;
            referencedRelation: 'branches';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'employee_attendance_employee_id_fkey';
            columns: ['employee_id'];
            isOneToOne: false;
            referencedRelation: 'employees';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'employee_attendance_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          },
        ];
      };
      employees: {
        Row: {
          active: boolean;
          branch_id: string;
          created_at: string;
          daily_quota_jugs: number | null;
          deleted_at: string | null;
          deleted_by: string | null;
          full_name: string;
          hire_date: string | null;
          id: string;
          monthly_salary_centavos: number;
          phone: string | null;
          role: Database['public']['Enums']['user_role'];
          tenant_id: string;
          user_id: string | null;
        };
        Insert: {
          active?: boolean;
          branch_id: string;
          created_at?: string;
          daily_quota_jugs?: number | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          full_name: string;
          hire_date?: string | null;
          id?: string;
          monthly_salary_centavos: number;
          phone?: string | null;
          role?: Database['public']['Enums']['user_role'];
          tenant_id: string;
          user_id?: string | null;
        };
        Update: {
          active?: boolean;
          branch_id?: string;
          created_at?: string;
          daily_quota_jugs?: number | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          full_name?: string;
          hire_date?: string | null;
          id?: string;
          monthly_salary_centavos?: number;
          phone?: string | null;
          role?: Database['public']['Enums']['user_role'];
          tenant_id?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'employees_branch_id_fkey';
            columns: ['branch_id'];
            isOneToOne: false;
            referencedRelation: 'branches';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'employees_deleted_by_fkey';
            columns: ['deleted_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'employees_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'employees_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      maintenance_logs: {
        Row: {
          branch_id: string;
          cost_centavos: number | null;
          created_at: string;
          id: string;
          notes: string | null;
          performed_at: string;
          performed_by: string | null;
          task_id: string;
          tenant_id: string;
        };
        Insert: {
          branch_id: string;
          cost_centavos?: number | null;
          created_at?: string;
          id?: string;
          notes?: string | null;
          performed_at: string;
          performed_by?: string | null;
          task_id: string;
          tenant_id: string;
        };
        Update: {
          branch_id?: string;
          cost_centavos?: number | null;
          created_at?: string;
          id?: string;
          notes?: string | null;
          performed_at?: string;
          performed_by?: string | null;
          task_id?: string;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'maintenance_logs_branch_id_fkey';
            columns: ['branch_id'];
            isOneToOne: false;
            referencedRelation: 'branches';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'maintenance_logs_performed_by_fkey';
            columns: ['performed_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'maintenance_logs_task_id_fkey';
            columns: ['task_id'];
            isOneToOne: false;
            referencedRelation: 'maintenance_tasks';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'maintenance_logs_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          },
        ];
      };
      maintenance_tasks: {
        Row: {
          active: boolean;
          branch_id: string;
          created_at: string;
          deleted_at: string | null;
          deleted_by: string | null;
          id: string;
          interval_days: number | null;
          interval_usage: number | null;
          last_done_at: string | null;
          next_due_at: string | null;
          schedule_kind: Database['public']['Enums']['schedule_kind'];
          scope: Database['public']['Enums']['maintenance_scope'];
          task_type: string;
          tenant_id: string;
          vehicle_id: string | null;
        };
        Insert: {
          active?: boolean;
          branch_id: string;
          created_at?: string;
          deleted_at?: string | null;
          deleted_by?: string | null;
          id?: string;
          interval_days?: number | null;
          interval_usage?: number | null;
          last_done_at?: string | null;
          next_due_at?: string | null;
          schedule_kind?: Database['public']['Enums']['schedule_kind'];
          scope: Database['public']['Enums']['maintenance_scope'];
          task_type: string;
          tenant_id: string;
          vehicle_id?: string | null;
        };
        Update: {
          active?: boolean;
          branch_id?: string;
          created_at?: string;
          deleted_at?: string | null;
          deleted_by?: string | null;
          id?: string;
          interval_days?: number | null;
          interval_usage?: number | null;
          last_done_at?: string | null;
          next_due_at?: string | null;
          schedule_kind?: Database['public']['Enums']['schedule_kind'];
          scope?: Database['public']['Enums']['maintenance_scope'];
          task_type?: string;
          tenant_id?: string;
          vehicle_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'maintenance_tasks_branch_id_fkey';
            columns: ['branch_id'];
            isOneToOne: false;
            referencedRelation: 'branches';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'maintenance_tasks_deleted_by_fkey';
            columns: ['deleted_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'maintenance_tasks_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'maintenance_tasks_vehicle_id_fkey';
            columns: ['vehicle_id'];
            isOneToOne: false;
            referencedRelation: 'vehicles';
            referencedColumns: ['id'];
          },
        ];
      };
      operational_expenses: {
        Row: {
          amount_centavos: number;
          branch_id: string;
          category: Database['public']['Enums']['expense_category'];
          created_at: string;
          deleted_at: string | null;
          deleted_by: string | null;
          description: string | null;
          expense_date: string;
          id: string;
          payee_employee_id: string | null;
          reference_number: string | null;
          tenant_id: string;
        };
        Insert: {
          amount_centavos: number;
          branch_id: string;
          category: Database['public']['Enums']['expense_category'];
          created_at?: string;
          deleted_at?: string | null;
          deleted_by?: string | null;
          description?: string | null;
          expense_date: string;
          id?: string;
          payee_employee_id?: string | null;
          reference_number?: string | null;
          tenant_id: string;
        };
        Update: {
          amount_centavos?: number;
          branch_id?: string;
          category?: Database['public']['Enums']['expense_category'];
          created_at?: string;
          deleted_at?: string | null;
          deleted_by?: string | null;
          description?: string | null;
          expense_date?: string;
          id?: string;
          payee_employee_id?: string | null;
          reference_number?: string | null;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'operational_expenses_branch_id_fkey';
            columns: ['branch_id'];
            isOneToOne: false;
            referencedRelation: 'branches';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'operational_expenses_deleted_by_fkey';
            columns: ['deleted_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'operational_expenses_payee_employee_id_fkey';
            columns: ['payee_employee_id'];
            isOneToOne: false;
            referencedRelation: 'employees';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'operational_expenses_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          },
        ];
      };
      product_pricing: {
        Row: {
          branch_id: string;
          container_type_id: string;
          created_at: string;
          effective_from: string;
          id: string;
          new_container_price_centavos: number;
          product_id: string;
          refill_price_centavos: number;
          tenant_id: string;
        };
        Insert: {
          branch_id: string;
          container_type_id: string;
          created_at?: string;
          effective_from: string;
          id?: string;
          new_container_price_centavos: number;
          product_id: string;
          refill_price_centavos: number;
          tenant_id: string;
        };
        Update: {
          branch_id?: string;
          container_type_id?: string;
          created_at?: string;
          effective_from?: string;
          id?: string;
          new_container_price_centavos?: number;
          product_id?: string;
          refill_price_centavos?: number;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'product_pricing_branch_id_fkey';
            columns: ['branch_id'];
            isOneToOne: false;
            referencedRelation: 'branches';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'product_pricing_container_type_id_fkey';
            columns: ['container_type_id'];
            isOneToOne: false;
            referencedRelation: 'container_types';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'product_pricing_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'product_pricing_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          },
        ];
      };
      products: {
        Row: {
          active: boolean;
          branch_id: string;
          created_at: string;
          deleted_at: string | null;
          deleted_by: string | null;
          id: string;
          name: string;
          sort_order: number;
          tenant_id: string;
        };
        Insert: {
          active?: boolean;
          branch_id: string;
          created_at?: string;
          deleted_at?: string | null;
          deleted_by?: string | null;
          id?: string;
          name: string;
          sort_order?: number;
          tenant_id: string;
        };
        Update: {
          active?: boolean;
          branch_id?: string;
          created_at?: string;
          deleted_at?: string | null;
          deleted_by?: string | null;
          id?: string;
          name?: string;
          sort_order?: number;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'products_branch_id_fkey';
            columns: ['branch_id'];
            isOneToOne: false;
            referencedRelation: 'branches';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'products_deleted_by_fkey';
            columns: ['deleted_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'products_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          },
        ];
      };
      salary_records: {
        Row: {
          base_pay_centavos: number;
          branch_id: string;
          commission_centavos: number;
          created_at: string;
          employee_id: string;
          gross_centavos: number;
          id: string;
          net_centavos: number;
          notes: string | null;
          paid_at: string | null;
          paid_by: string | null;
          period_end: string;
          period_start: string;
          tenant_id: string;
        };
        Insert: {
          base_pay_centavos: number;
          branch_id: string;
          commission_centavos?: number;
          created_at?: string;
          employee_id: string;
          gross_centavos: number;
          id?: string;
          net_centavos: number;
          notes?: string | null;
          paid_at?: string | null;
          paid_by?: string | null;
          period_end: string;
          period_start: string;
          tenant_id: string;
        };
        Update: {
          base_pay_centavos?: number;
          branch_id?: string;
          commission_centavos?: number;
          created_at?: string;
          employee_id?: string;
          gross_centavos?: number;
          id?: string;
          net_centavos?: number;
          notes?: string | null;
          paid_at?: string | null;
          paid_by?: string | null;
          period_end?: string;
          period_start?: string;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'salary_records_branch_id_fkey';
            columns: ['branch_id'];
            isOneToOne: false;
            referencedRelation: 'branches';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'salary_records_employee_id_fkey';
            columns: ['employee_id'];
            isOneToOne: false;
            referencedRelation: 'employees';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'salary_records_paid_by_fkey';
            columns: ['paid_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'salary_records_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          },
        ];
      };
      sale_lines: {
        Row: {
          branch_id: string;
          container_type_id: string;
          created_at: string;
          id: string;
          is_new_container: boolean;
          product_id: string;
          quantity: number;
          sale_id: string;
          tenant_id: string;
          unit_price_centavos: number;
        };
        Insert: {
          branch_id: string;
          container_type_id: string;
          created_at?: string;
          id?: string;
          is_new_container?: boolean;
          product_id: string;
          quantity: number;
          sale_id: string;
          tenant_id: string;
          unit_price_centavos: number;
        };
        Update: {
          branch_id?: string;
          container_type_id?: string;
          created_at?: string;
          id?: string;
          is_new_container?: boolean;
          product_id?: string;
          quantity?: number;
          sale_id?: string;
          tenant_id?: string;
          unit_price_centavos?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'sale_lines_branch_id_fkey';
            columns: ['branch_id'];
            isOneToOne: false;
            referencedRelation: 'branches';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'sale_lines_container_type_id_fkey';
            columns: ['container_type_id'];
            isOneToOne: false;
            referencedRelation: 'container_types';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'sale_lines_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'sale_lines_sale_id_fkey';
            columns: ['sale_id'];
            isOneToOne: false;
            referencedRelation: 'sales';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'sale_lines_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          },
        ];
      };
      sale_payments: {
        Row: {
          amount_centavos: number;
          branch_id: string;
          created_at: string;
          gcash_ref: string | null;
          id: string;
          method: Database['public']['Enums']['payment_method'];
          sale_id: string;
          tenant_id: string;
        };
        Insert: {
          amount_centavos: number;
          branch_id: string;
          created_at?: string;
          gcash_ref?: string | null;
          id?: string;
          method: Database['public']['Enums']['payment_method'];
          sale_id: string;
          tenant_id: string;
        };
        Update: {
          amount_centavos?: number;
          branch_id?: string;
          created_at?: string;
          gcash_ref?: string | null;
          id?: string;
          method?: Database['public']['Enums']['payment_method'];
          sale_id?: string;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'sale_payments_branch_id_fkey';
            columns: ['branch_id'];
            isOneToOne: false;
            referencedRelation: 'branches';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'sale_payments_sale_id_fkey';
            columns: ['sale_id'];
            isOneToOne: false;
            referencedRelation: 'sales';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'sale_payments_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          },
        ];
      };
      sales: {
        Row: {
          address_id: string | null;
          booking_id: string | null;
          branch_id: string;
          cashier_id: string | null;
          created_at: string;
          customer_id: string | null;
          deleted_at: string | null;
          deleted_by: string | null;
          delivered_by_name: string | null;
          id: string;
          notes: string | null;
          rider_id: string | null;
          sale_date: string;
          source: Database['public']['Enums']['sale_source'];
          status: Database['public']['Enums']['sale_status'];
          tenant_id: string;
        };
        Insert: {
          address_id?: string | null;
          booking_id?: string | null;
          branch_id: string;
          cashier_id?: string | null;
          created_at?: string;
          customer_id?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          delivered_by_name?: string | null;
          id?: string;
          notes?: string | null;
          rider_id?: string | null;
          sale_date: string;
          source: Database['public']['Enums']['sale_source'];
          status?: Database['public']['Enums']['sale_status'];
          tenant_id: string;
        };
        Update: {
          address_id?: string | null;
          booking_id?: string | null;
          branch_id?: string;
          cashier_id?: string | null;
          created_at?: string;
          customer_id?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          delivered_by_name?: string | null;
          id?: string;
          notes?: string | null;
          rider_id?: string | null;
          sale_date?: string;
          source?: Database['public']['Enums']['sale_source'];
          status?: Database['public']['Enums']['sale_status'];
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'sales_address_id_fkey';
            columns: ['address_id'];
            isOneToOne: false;
            referencedRelation: 'customer_addresses';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'sales_booking_id_fkey';
            columns: ['booking_id'];
            isOneToOne: false;
            referencedRelation: 'bookings';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'sales_branch_id_fkey';
            columns: ['branch_id'];
            isOneToOne: false;
            referencedRelation: 'branches';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'sales_cashier_id_fkey';
            columns: ['cashier_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'sales_customer_id_fkey';
            columns: ['customer_id'];
            isOneToOne: false;
            referencedRelation: 'customers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'sales_deleted_by_fkey';
            columns: ['deleted_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'sales_rider_id_fkey';
            columns: ['rider_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'sales_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          },
        ];
      };
      settings: {
        Row: {
          branch_id: string;
          id: string;
          key: string;
          tenant_id: string;
          updated_at: string;
          updated_by: string | null;
          value: string;
        };
        Insert: {
          branch_id: string;
          id?: string;
          key: string;
          tenant_id: string;
          updated_at?: string;
          updated_by?: string | null;
          value: string;
        };
        Update: {
          branch_id?: string;
          id?: string;
          key?: string;
          tenant_id?: string;
          updated_at?: string;
          updated_by?: string | null;
          value?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'settings_branch_id_fkey';
            columns: ['branch_id'];
            isOneToOne: false;
            referencedRelation: 'branches';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'settings_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'settings_updated_by_fkey';
            columns: ['updated_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      tenants: {
        Row: {
          created_at: string;
          id: string;
          name: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
        };
        Relationships: [];
      };
      users: {
        Row: {
          active: boolean;
          branch_id: string;
          created_at: string;
          deleted_at: string | null;
          deleted_by: string | null;
          full_name: string;
          id: string;
          phone: string | null;
          role: Database['public']['Enums']['user_role'];
          tenant_id: string;
        };
        Insert: {
          active?: boolean;
          branch_id: string;
          created_at?: string;
          deleted_at?: string | null;
          deleted_by?: string | null;
          full_name: string;
          id: string;
          phone?: string | null;
          role?: Database['public']['Enums']['user_role'];
          tenant_id: string;
        };
        Update: {
          active?: boolean;
          branch_id?: string;
          created_at?: string;
          deleted_at?: string | null;
          deleted_by?: string | null;
          full_name?: string;
          id?: string;
          phone?: string | null;
          role?: Database['public']['Enums']['user_role'];
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'users_branch_id_fkey';
            columns: ['branch_id'];
            isOneToOne: false;
            referencedRelation: 'branches';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'users_deleted_by_fkey';
            columns: ['deleted_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'users_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          },
        ];
      };
      vehicles: {
        Row: {
          branch_id: string;
          brand_model: string | null;
          created_at: string;
          deleted_at: string | null;
          deleted_by: string | null;
          id: string;
          notes: string | null;
          plate_number: string | null;
          tenant_id: string;
          type: string;
          year: number | null;
        };
        Insert: {
          branch_id: string;
          brand_model?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          deleted_by?: string | null;
          id?: string;
          notes?: string | null;
          plate_number?: string | null;
          tenant_id: string;
          type: string;
          year?: number | null;
        };
        Update: {
          branch_id?: string;
          brand_model?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          deleted_by?: string | null;
          id?: string;
          notes?: string | null;
          plate_number?: string | null;
          tenant_id?: string;
          type?: string;
          year?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'vehicles_branch_id_fkey';
            columns: ['branch_id'];
            isOneToOne: false;
            referencedRelation: 'branches';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'vehicles_deleted_by_fkey';
            columns: ['deleted_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'vehicles_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      insert_default_settings: {
        Args: { p_branch_id: string; p_tenant_id: string };
        Returns: undefined;
      };
    };
    Enums: {
      attendance_status: 'present' | 'absent';
      booking_cadence: 'weekly' | 'bi_weekly' | 'monthly';
      booking_status: 'pending' | 'fulfilled' | 'cancelled';
      container_movement_type: 'out' | 'in' | 'lost' | 'adjustment';
      customer_type: 'residential' | 'commercial';
      expense_category: 'gasoline' | 'parts' | 'supplies' | 'utilities' | 'other';
      maintenance_scope: 'water_plant' | 'vehicle';
      payment_method: 'cash' | 'gcash' | 'on_account';
      sale_source: 'walk_in' | 'delivery' | 'booking_fulfilled';
      sale_status: 'pending_delivery' | 'completed' | 'void';
      schedule_kind: 'time' | 'usage';
      user_role: 'admin' | 'manager' | 'cashier' | 'rider';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views']) | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums'] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes'] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      attendance_status: ['present', 'absent'],
      booking_cadence: ['weekly', 'bi_weekly', 'monthly'],
      booking_status: ['pending', 'fulfilled', 'cancelled'],
      container_movement_type: ['out', 'in', 'lost', 'adjustment'],
      customer_type: ['residential', 'commercial'],
      expense_category: ['gasoline', 'parts', 'supplies', 'utilities', 'other'],
      maintenance_scope: ['water_plant', 'vehicle'],
      payment_method: ['cash', 'gcash', 'on_account'],
      sale_source: ['walk_in', 'delivery', 'booking_fulfilled'],
      sale_status: ['pending_delivery', 'completed', 'void'],
      schedule_kind: ['time', 'usage'],
      user_role: ['admin', 'manager', 'cashier', 'rider'],
    },
  },
} as const;
