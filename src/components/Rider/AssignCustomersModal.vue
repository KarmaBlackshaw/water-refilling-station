<script setup lang="ts">
import type { CustomerWithRider } from '@/services/customers';
import { defaultBarangay } from '@/helpers/address';
import { WEEKDAYS } from '@/constants/rider';

defineOptions({ name: 'RiderAssignCustomersModal' });

/**
 * Rider shape for assignment. `id` is the rider's user_id (what customers.rider_id points at),
 * not the employee row id.
 */
type RiderOption = {
  id: string;
  full_name: string;
  rest_days: number[];
};

const open = defineModel<boolean>('open', { required: true });

const { customers, riders, presetCustomerIds, saving } = defineProps<{
  customers: CustomerWithRider[];
  riders: RiderOption[];
  presetCustomerIds?: string[];
  saving?: boolean;
}>();

const emit = defineEmits<{
  submit: [payload: { customerIds: string[]; riderId: string | null; backupRiderId: string | null }];
}>();

/** Primary rider options — all riders plus a "none" sentinel. */
const riderOptions = computed(() => [{ label: '— None —', value: '' }, ...riders.map((r) => ({ label: r.full_name, value: r.id }))]);

/** Backup cannot be the same as the primary — drop the chosen primary. */
const backupRiderOptions = computed(() => riderOptions.value.filter((o) => o.value === '' || o.value !== primaryRiderId.value));

const barangayOptions = computed(() => {
  const barangays = new Set<string>();

  for (const c of customers) {
    barangays.add(defaultBarangay(c.addresses));
  }

  return [{ label: 'All customers', value: '' }, ...[...barangays].sort().map((b) => ({ label: b, value: b }))];
});

const selectedBarangay = ref('');
const checkedCustomerIds = ref<Set<string>>(new Set());
const primaryRiderId = ref('');
const backupRiderId = ref('');

const barangayCustomers = computed(() => {
  if (!selectedBarangay.value) {
    return customers;
  }

  return customers.filter((c) => defaultBarangay(c.addresses) === selectedBarangay.value);
});

/** Soft-warn when primary and backup share rest days — do not block submit. */
const restDayWarning = computed(() => {
  if (!primaryRiderId.value || !backupRiderId.value) {
    return null;
  }

  const primary = riders.find((r) => r.id === primaryRiderId.value);
  const backup = riders.find((r) => r.id === backupRiderId.value);

  if (!primary || !backup) {
    return null;
  }

  const overlap = primary.rest_days.filter((d) => backup.rest_days.includes(d));

  if (overlap.length === 0) {
    return null;
  }

  const days = overlap.map((d) => WEEKDAYS.find((w) => w.value === d)?.label ?? String(d)).join(', ');

  return `Both riders share rest days on ${days}. Customers may be unserved on those days.`;
});

watch(
  () => open.value,
  (isOpen) => {
    if (!isOpen) {
      return;
    }

    selectedBarangay.value = '';
    primaryRiderId.value = '';
    backupRiderId.value = '';

    checkedCustomerIds.value = presetCustomerIds && presetCustomerIds.length > 0 ? new Set(presetCustomerIds) : new Set(customers.map((c) => c.id));
  },
  { immediate: true },
);

/** Re-seed selection when barangay filter changes (unless presets are active). */
watch(selectedBarangay, () => {
  if (presetCustomerIds && presetCustomerIds.length > 0) {
    return;
  }

  checkedCustomerIds.value = new Set(barangayCustomers.value.map((c) => c.id));
});

/** Clear backup if it matches the newly chosen primary. */
watch(primaryRiderId, () => {
  if (backupRiderId.value && backupRiderId.value === primaryRiderId.value) {
    backupRiderId.value = '';
  }
});

function toggleAll(checked: boolean) {
  checkedCustomerIds.value = checked ? new Set(barangayCustomers.value.map((c) => c.id)) : new Set();
}

function toggleCustomer(id: string, checked: boolean) {
  const next = new Set(checkedCustomerIds.value);

  if (checked) {
    next.add(id);
  } else {
    next.delete(id);
  }

  checkedCustomerIds.value = next;
}

const allChecked = computed(() => barangayCustomers.value.length > 0 && barangayCustomers.value.every((c) => checkedCustomerIds.value.has(c.id)));

const someChecked = computed(() => !allChecked.value && barangayCustomers.value.some((c) => checkedCustomerIds.value.has(c.id)));

function submit() {
  emit('submit', {
    customerIds: [...checkedCustomerIds.value],
    riderId: primaryRiderId.value || null,
    backupRiderId: backupRiderId.value || null,
  });
}
</script>

<template>
  <BaseModal v-model:open="open" title="Assign customers" size="lg">
    <form id="assign-customers-form" class="space-y-4" @submit.prevent="submit">
      <!-- Barangay filter -->
      <BaseSelect v-model="selectedBarangay" label="Filter by barangay" :options="barangayOptions" searchable />

      <!-- Customer checklist -->
      <div class="flex flex-col gap-1">
        <div class="flex items-center justify-between">
          <span class="text-xs font-medium text-casual-navy">Customers ({{ checkedCustomerIds.size }} selected)</span>
          <button type="button" class="text-xs text-tampa hover:underline" @click="toggleAll(!allChecked)">
            {{ allChecked ? 'Deselect all' : 'Select all' }}
          </button>
        </div>
        <div
          class="max-h-48 overflow-y-auto rounded-md border border-sparkling-silver bg-bright-chrome px-2 py-2"
          :class="{ 'opacity-50': barangayCustomers.length === 0 }"
        >
          <p v-if="barangayCustomers.length === 0" class="py-4 text-center text-xs text-oslo">No customers in this barangay</p>
          <div v-for="c in barangayCustomers" :key="c.id" class="flex cursor-pointer items-center gap-2 rounded px-1 py-1 hover:bg-sparkling-silver/40">
            <BaseCheckbox :model-value="checkedCustomerIds.has(c.id)" :label="c.name" @update:model-value="toggleCustomer(c.id, $event)" />
            <span class="ml-auto shrink-0 text-xs text-oslo">{{ defaultBarangay(c.addresses) }}</span>
          </div>
        </div>
        <p v-if="someChecked" class="text-xs text-oslo">Some customers deselected — only checked ones will be updated.</p>
      </div>

      <!-- Rider assignment -->
      <BaseSelect v-model="primaryRiderId" label="Primary rider" :options="riderOptions" searchable />
      <BaseSelect v-model="backupRiderId" label="Backup rider" :options="backupRiderOptions" searchable />

      <!-- Rest day overlap warning (soft, non-blocking) -->
      <p v-if="restDayWarning" class="rounded-md border border-strong-amber bg-amber-subtle px-3 py-2 text-xs text-strong-amber">
        {{ restDayWarning }}
      </p>
    </form>

    <template #footer>
      <BaseButton variant="independence" @click="open = false">Cancel</BaseButton>
      <BaseButton type="submit" form="assign-customers-form" :loading="saving" :disabled="checkedCustomerIds.size === 0">
        Assign {{ checkedCustomerIds.size > 0 ? `(${checkedCustomerIds.size})` : '' }}
      </BaseButton>
    </template>
  </BaseModal>
</template>
