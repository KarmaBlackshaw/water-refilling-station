<script setup lang="ts">
import type { DeliverySaleRow } from '@/services/deliveries';

const open = defineModel<boolean>({ required: true });

const { sale } = defineProps<{
  sale?: DeliverySaleRow;
}>();

const emit = defineEmits<{
  reconciled: [];
}>();

const auth = useAuthStore();

const returns = ref<Array<{ container_type_id: string; name: string; maxQty: number; qty: number }>>([]);
const notes = ref('');
const saving = ref(false);

watch(open, (isOpen) => {
  if (!isOpen) {
    return;
  }

  const currentSale = sale;

  if (!currentSale) {
    return;
  }

  notes.value = '';
  const seen = new Map<string, { name: string; totalQty: number }>();

  for (const line of currentSale.lines) {
    const existing = seen.get(line.container_type_id);

    if (existing) {
      existing.totalQty += line.quantity;
    } else {
      seen.set(line.container_type_id, {
        name: line.container_type?.name ?? line.container_type_id,
        totalQty: line.quantity,
      });
    }
  }
  returns.value = [...seen.entries()].map(([id, v]) => ({
    container_type_id: id,
    name: v.name,
    maxQty: v.totalQty,
    qty: 0,
  }));
});

async function submit() {
  const currentSale = sale;

  if (!currentSale) {
    return;
  }

  saving.value = true;
  const [error] = await tryToCatch(() =>
    reconcileDelivery({
      saleId: currentSale.id,
      customerId: currentSale.customer_id,
      tenantId: auth.tenantId ?? '',
      branchId: auth.branchId ?? '',
      containersReturned: returns.value.map((r) => ({
        container_type_id: r.container_type_id,
        quantity: r.qty,
      })),
      notes: notes.value || null,
    }),
  );

  saving.value = false;
  if (error) {
    return;
  }

  open.value = false;
  emit('reconciled');
}
</script>

<template>
  <BaseModal v-model:open="open" title="Reconcile Delivery" size="md">
    <div v-if="sale" class="space-y-4">
      <div class="rounded-lg bg-[--color-surface-raised] p-3 text-sm">
        <p class="font-medium text-casual-navy">{{ sale.customer?.name ?? '—' }}</p>
        <ul class="mt-1 space-y-0.5 text-independence">
          <li v-for="line in sale.lines" :key="line.id">{{ line.quantity }}× {{ line.container_type?.name ?? '?' }} {{ line.product?.name ?? '' }}</li>
        </ul>
      </div>
      <div class="space-y-3">
        <p class="text-sm font-medium text-casual-navy">Containers Returned</p>
        <div v-for="ret in returns" :key="ret.container_type_id" class="flex items-center gap-3">
          <span class="flex-1 text-sm text-casual-navy">{{ ret.name }}</span>
          <div class="w-24">
            <input
              v-model.number="ret.qty"
              type="number"
              :min="0"
              :max="ret.maxQty"
              class="w-full rounded-md border border-sparkling-silver bg-full-white px-3 py-1.5 text-sm text-casual-navy focus:outline-none focus:ring-2 focus:ring-turquoise-stone"
            />
          </div>
          <span class="w-16 text-right text-xs text-independence">of {{ ret.maxQty }}</span>
        </div>
      </div>
      <BaseTextarea v-model="notes" label="Notes (optional)" :rows="2" />
    </div>
    <template #footer>
      <BaseButton variant="independence" @click="open = false">Cancel</BaseButton>
      <BaseButton :loading="saving" @click="submit">Mark Delivered</BaseButton>
    </template>
  </BaseModal>
</template>
