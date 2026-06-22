import type { CustomerType, Option } from '@/types';

export type CustomerForm = {
  name: string;
  phone: string;
  type: CustomerType;
  notes: string;
};

export type AddressFields = {
  street: string;
  barangay: string;
  city: string;
  lat: number | null;
  lng: number | null;
};

export const CUSTOMER_TYPE_OPTIONS: Option<CustomerType>[] = [
  { label: 'Residential', value: 'residential' },
  { label: 'Commercial', value: 'commercial' },
];
