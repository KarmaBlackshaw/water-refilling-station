import { z } from 'zod';
import type { CustomerType, Option } from '@/types';

export type CustomerForm = {
  name: string;
  phone: string;
  type: CustomerType;
  notes: string;
};

export const customerDetailsSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  phone: z.string(),
  type: z.string(),
  notes: z.string(),
});

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
