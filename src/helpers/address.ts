import type { CustomerAddress } from '@/types/database';

export function formatAddress(a: Pick<CustomerAddress, 'street' | 'barangay' | 'city' | 'landmark'>): string {
  const base = [a.street, a.barangay, a.city].filter(Boolean).join(', ');

  return a.landmark ? `${base} (${a.landmark})` : base;
}
