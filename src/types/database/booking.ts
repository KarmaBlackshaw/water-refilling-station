import type { Database } from './supabase';

export type BookingCadence = Database['public']['Enums']['booking_cadence'];
export type BookingStatus = Database['public']['Enums']['booking_status'];

export type BookingTemplate = Database['public']['Tables']['booking_templates']['Row'];
export type BookingTemplateItem = Database['public']['Tables']['booking_template_items']['Row'];
export type Booking = Database['public']['Tables']['bookings']['Row'];
export type BookingItem = Database['public']['Tables']['booking_items']['Row'];
