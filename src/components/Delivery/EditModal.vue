<script setup lang="ts">
import type { DeliverySaleRow } from '@/services/deliveries';
import { formatAddress } from '@/helpers/address';

defineOptions({ name: 'DeliveryEditModal' });

const open = defineModel<boolean>({ required: true });

const { sale } = defineProps<{
  sale?: DeliverySaleRow;
}>();

const emit = defineEmits<{
  updated: [];
}>();

const auth = useAuthStore();

const form = reactive({
  sale_date: '',
  rider_id: '',
  address_id: '',
  notes: '',
});

const { data: riderEmployeesRes, run: loadRiderEmployees } = useAsync(() => listRiderEmployees(auth.tenantId, auth.branchId));
const riderEmployees = computed(() => riderEmployeesRes.value?.data ?? []);

/** Options use user_id (a users.id) so form.rider_id matches sales.rider_id. Leading entry clears the assignment. */
const riderOptions = computed(() =>
  riderEmployees.value.reduce<{ label: string; value: string }[]>(
    (acc, e) => {
      if (e.user_id != null) {
        acc.push({ label: e.full_name, value: e.user_id });
      }

      return acc;
    },
    [{ label: 'Unassigned', value: '' }],
  ),
);

const { data: addressesRes, run: loadAddresses } = useAsync(() => listAddresses(sale?.customer_id ?? ''));
const addresses = computed(() => addressesRes.value?.data ?? []);
const addressOptions = computed(() => addresses.value.map((a) => ({ label: `${a.label} — ${formatAddress(a)}`, value: a.id })));

watch(open, (isOpen) => {
  if (!isOpen || !sale) {
    return;
  }

  form.sale_date = sale.sale_date;
  form.rider_id = sale.rider_id ?? '';
  form.address_id = sale.address_id ?? '';
  form.notes = sale.notes ?? '';

  Promise.all([loadRiderEmployees(), loadAddresses()]);
});

const { loading: saving, run: submit } = useAsync(async () => {
  const currentSale = sale;

  if (!currentSale) {
    return;
  }

  await updateDeliverySale(currentSale.id, {
    rider_id: form.rider_id || null,
    address_id: form.address_id || null,
    sale_date: form.sale_date,
    notes: form.notes.trim() || null,
  });

  open.value = false;
  emit('updated');
});
</script>

<template>
  <BaseModal v-model:open="open" title="Edit Delivery" size="md">
    <form v-if="sale" id="edit-delivery-form" class="space-y-4" @submit.prevent="submit">
      <div class="rounded-lg bg-[--color-surface-raised] p-3 text-sm">
        <p class="font-medium text-casual-navy">{{ sale.customer?.name ?? '—' }}</p>
        <p v-if="sale.customer?.phone" class="text-xs text-independence">{{ sale.customer.phone }}</p>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <BaseDatePicker v-model="form.sale_date" label="Delivery Date" required />
        <BaseSelect v-model="form.rider_id" label="Rider" :options="riderOptions" placeholder="Unassigned" search-placeholder="Search rider..." searchable />
      </div>

      <BaseSelect
        v-model="form.address_id"
        label="Address"
        :options="addressOptions"
        placeholder="Select address..."
        search-placeholder="Search address..."
        searchable
      />

      <BaseTextarea v-model="form.notes" label="Notes (optional)" :rows="2" />
    </form>
    <template #footer>
      <BaseButton variant="independence" @click="open = false">Cancel</BaseButton>
      <BaseButton type="submit" form="edit-delivery-form" :loading="saving">Save Changes</BaseButton>
    </template>
  </BaseModal>
</template>
