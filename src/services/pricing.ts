import { today } from '@/helpers/date';
import { supabase } from '@/helpers/supabase';
import type { CustomerPriceOverride, ProductPricing } from '@/types/database';

export interface PricingData {
  overrides: CustomerPriceOverride[];
  pricing: ProductPricing[];
}

export async function loadPricing(customerId?: string | null): Promise<PricingData> {
  const todayISO = today();

  const [overridesRes, pricingRes] = await Promise.all([
    customerId
      ? supabase.from('customer_price_overrides').select('*').eq('customer_id', customerId).is('deleted_at', null)
      : Promise.resolve<{ data: CustomerPriceOverride[]; error: null }>({ data: [], error: null }),
    supabase.from('product_pricing').select('*').lte('effective_from', todayISO).order('effective_from', { ascending: false }),
  ]);

  return {
    overrides: overridesRes.data ?? [],
    pricing: pricingRes.data ?? [],
  };
}

export function resolvePrice(data: PricingData, productId: string, containerTypeId: string, isNewContainer: boolean): number {
  const override = data.overrides.find((o) => o.product_id === productId && o.container_type_id === containerTypeId);

  if (override) {
    return isNewContainer ? override.new_container_price_centavos : override.refill_price_centavos;
  }

  const base = data.pricing.find((p) => p.product_id === productId && p.container_type_id === containerTypeId);

  if (base) {
    return isNewContainer ? base.new_container_price_centavos : base.refill_price_centavos;
  }

  return 0;
}
