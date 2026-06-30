import type { CustomerAddress } from '@/types/database';

export function formatAddress(a: Pick<CustomerAddress, 'street' | 'barangay' | 'city' | 'landmark'>): string {
  const base = [a.street, a.barangay, a.city].filter(Boolean).join(', ');

  return a.landmark ? `${base} (${a.landmark})` : base;
}

export function pickDefaultAddress<T extends { is_default: boolean; deleted_at: string | null }>(addresses: T[] | null | undefined): T | null {
  const live = (addresses ?? []).filter((a) => a.deleted_at == null);

  return live.find((a) => a.is_default) ?? live[0] ?? null;
}

export function defaultBarangay(addresses: { barangay: string; is_default: boolean; deleted_at: string | null }[] | null | undefined): string {
  return pickDefaultAddress(addresses)?.barangay ?? 'No barangay';
}
