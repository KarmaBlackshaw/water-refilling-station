<script setup lang="ts">
import type { BookingRow } from '@/services/bookings';

interface FulfillPrice {
  product_id: string;
  container_type_id: string;
  product_name: string;
  container_name: string;
  quantity: number;
  unit_price_centavos: number;
}

const open = defineModel<boolean>('open', { required: true });

const { booking, tenantId, branchId, saving } = defineProps<{
  booking: BookingRow | null;
  tenantId: string;
  branchId: string;
  saving?: boolean;
}>();

const emit = defineEmits<{
  submit: [payload: Array<{ product_id: string; container_type_id: string; unit_price_centavos: number }>];
}>();

const fulfillPrices = ref<FulfillPrice[]>([]);

watch(
  () => open.value,
  async (isOpen) => {
    if (!isOpen || !booking) {
      fulfillPrices.value = [];
      return;
    }

    fulfillPrices.value = booking.items.map((item) => ({
      product_id: item.product_id,
      container_type_id: item.container_type_id,
      product_name: item.product?.name ?? '',
      container_name: item.container_type?.name ?? '',
      quantity: item.quantity,
      unit_price_centavos: 0,
    }));

    try {
      const { data: pricing } = await listProductPricing(tenantId, branchId);

      if (pricing) {
        for (const fp of fulfillPrices.value) {
          const match = pricing.find((p) => p.product_id === fp.product_id && p.container_type_id === fp.container_type_id);

          if (match) {
            fp.unit_price_centavos = fp.unit_price_centavos === 0 ? match.refill_price_centavos : fp.unit_price_centavos;
          }
        }
      }
    } catch {
      // pricing load failure is non-critical
    }
  },
);

function centavosFromDisplay(display: string): number {
  const n = parseFloat(display.replace(/[^0-9.]/g, ''));

  return isNaN(n) ? 0 : Math.round(n * 100);
}

function onPriceChange(event: Event, fp: FulfillPrice) {
  const target = event.currentTarget;

  if (!(target instanceof HTMLInputElement)) {
    return;
  }

  fp.unit_price_centavos = centavosFromDisplay(target.value);
}

function submit() {
  emit(
    'submit',
    fulfillPrices.value.map((fp) => ({
      product_id: fp.product_id,
      container_type_id: fp.container_type_id,
      unit_price_centavos: fp.unit_price_centavos,
    })),
  );
}
</script>

<template>
  <BaseModal v-model:open="open" title="Fulfill Booking" size="lg">
    <div v-if="booking" class="space-y-4">
      <p class="text-sm text-independence">
        Customer: <span class="font-medium text-casual-navy">{{ booking.customer?.name }}</span>
        &nbsp;·&nbsp; Date:
        <span class="font-medium text-casual-navy num">{{ booking.scheduled_date }}</span>
      </p>

      <div class="space-y-2">
        <div class="grid grid-cols-[1fr_1fr_auto_auto] gap-2 text-xs font-medium text-oslo px-1">
          <span>Product</span>
          <span>Container</span>
          <span class="text-right">Qty</span>
          <span class="text-right min-w-[100px]">Unit price (₱)</span>
        </div>
        <div v-for="(fp, idx) in fulfillPrices" :key="idx" class="grid grid-cols-[1fr_1fr_auto_auto] gap-2 items-center">
          <span class="text-sm text-casual-navy">{{ fp.product_name }}</span>
          <span class="text-sm text-casual-navy">{{ fp.container_name }}</span>
          <span class="text-sm num text-right">{{ fp.quantity }}</span>
          <input
            :value="(fp.unit_price_centavos / 100).toFixed(2)"
            type="number"
            step="0.01"
            min="0"
            class="num w-[100px] rounded-md border border-sparkling-silver bg-full-white px-2 py-1 text-sm text-right text-casual-navy focus:outline-none focus:ring-2 focus:ring-turquoise-stone"
            @change="(e) => onPriceChange(e, fp)"
          />
        </div>
      </div>
    </div>

    <template #footer>
      <BaseButton variant="independence" @click="open = false">Cancel</BaseButton>
      <BaseButton :loading="saving" @click="submit"> Create Delivery Sale </BaseButton>
    </template>
  </BaseModal>
</template>
