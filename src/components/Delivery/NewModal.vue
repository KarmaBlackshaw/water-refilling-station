<script setup lang="ts">
import type { CustomerWithArea } from '@/services/customers';
import { formatAddress } from '@/helpers/address';

defineOptions({ name: 'DeliveryNewModal' });

const open = defineModel<boolean>({ required: true });

const { defaultDate } = defineProps<{
  defaultDate: string;
}>();

const emit = defineEmits<{
  created: [saleDate: string];
}>();

const auth = useAuthStore();

const form = reactive({
  sale_date: defaultDate,
  area_id: '',
});

const selectedIds = ref<Set<string>>(new Set());

const { data: areasRes, run: loadAreas } = useAsync(() => listAreas(auth.tenantId, auth.branchId));
const areas = computed(() => areasRes.value?.data ?? []);

const { data: customersRes, run: loadCustomers } = useAsync(() => listCustomers(auth.tenantId, auth.branchId));
const customers = computed(() => customersRes.value?.data ?? []);

const { data: ridersRes, run: loadRiders } = useAsync(() => listRiders(auth.tenantId, auth.branchId));
const riders = computed(() => ridersRes.value?.data ?? []);

const { data: activeRider } = useAsync(
  () => {
    if (!form.area_id) {
      return Promise.resolve(null);
    }

    return getActiveRiderForArea(form.area_id, form.sale_date);
  },
  { watch: () => `${form.area_id}|${form.sale_date}` },
);

const areaOptions = computed(() => areas.value.map((a) => ({ label: a.name, value: a.id })));
const areaCustomers = computed(() => (form.area_id ? customers.value.filter((c) => c.area_id === form.area_id) : []));

const resolvedRiderName = computed(() => {
  const id = activeRider.value?.riderId;

  return id ? (riders.value.find((r) => r.id === id)?.full_name ?? '') : '';
});

const allSelected = computed(() => areaCustomers.value.length > 0 && selectedIds.value.size === areaCustomers.value.length);

function defaultAddress(c: CustomerWithArea) {
  const addrs = (c.addresses ?? []).filter((a) => !a.deleted_at);

  return addrs.find((a) => a.is_default) ?? addrs[0] ?? null;
}

function defaultAddressLabel(c: CustomerWithArea) {
  const a = defaultAddress(c);

  return a ? `${a.label} — ${formatAddress(a)}` : '';
}

function toggle(id: string) {
  const next = new Set(selectedIds.value);

  if (next.has(id)) {
    next.delete(id);
  } else {
    next.add(id);
  }

  selectedIds.value = next;
}

function toggleAll() {
  selectedIds.value = allSelected.value ? new Set() : new Set(areaCustomers.value.map((c) => c.id));
}

/** Selecting an area defaults to assigning every customer in it. */
watch(
  () => form.area_id,
  () => {
    selectedIds.value = new Set(areaCustomers.value.map((c) => c.id));
  },
);

watch(open, (isOpen) => {
  if (!isOpen) {
    return;
  }

  form.sale_date = defaultDate;
  form.area_id = '';
  selectedIds.value = new Set();
  Promise.all([loadAreas(), loadCustomers(), loadRiders()]);
});

const { loading: saving, run: submit } = useAsync(async () => {
  const ids = [...selectedIds.value];

  if (ids.length === 0) {
    return;
  }

  const riderId = activeRider.value?.riderId ?? null;

  await Promise.all(
    ids.map((id) => {
      const c = customers.value.find((x) => x.id === id);

      if (!c) {
        return Promise.resolve();
      }

      return createDeliverySale({
        tenant_id: auth.tenantId,
        branch_id: auth.branchId,
        customer_id: id,
        address_id: defaultAddress(c)?.id ?? null,
        rider_id: riderId,
        sale_date: form.sale_date,
      });
    }),
  );

  const saleDate = form.sale_date;

  open.value = false;
  emit('created', saleDate);
});
</script>

<template>
  <BaseModal v-model:open="open" title="Assign Deliveries" size="lg">
    <form id="assign-delivery-form" class="space-y-5" @submit.prevent="submit">
      <div class="grid gap-4 grid-cols-2">
        <BaseDatePicker v-model="form.sale_date" label="Delivery Date" required />
        <BaseSelect
          v-model="form.area_id"
          label="Area"
          :options="areaOptions"
          placeholder="Select area..."
          search-placeholder="Search area..."
          searchable
          required
        />
      </div>

      <div v-if="form.area_id" class="rounded-lg bg-[--color-surface-raised] p-3 text-sm">
        <p v-if="resolvedRiderName" class="flex items-center gap-2 text-casual-navy">
          Rider: <span class="font-medium">{{ resolvedRiderName }}</span>
          <BaseBadge v-if="activeRider?.isCovering" variant="warning">Covering</BaseBadge>
        </p>
        <p v-else class="text-blaze-red">No rider for this area — these deliveries will be unassigned.</p>
      </div>

      <div v-if="form.area_id" class="space-y-2">
        <div class="flex items-center justify-between">
          <p class="text-sm font-medium text-casual-navy">Customers ({{ selectedIds.size }}/{{ areaCustomers.length }})</p>
          <button v-if="areaCustomers.length" type="button" class="text-xs font-medium text-tampa hover:underline focus:outline-none" @click="toggleAll">
            {{ allSelected ? 'Clear all' : 'Select all' }}
          </button>
        </div>
        <BaseEmptyState v-if="areaCustomers.length === 0" title="No customers" description="No customers in this area." />
        <ul v-else class="max-h-72 divide-y divide-sparkling-silver overflow-y-auto rounded-lg border border-sparkling-silver">
          <li v-for="c in areaCustomers" :key="c.id" class="flex items-center gap-3 px-3 py-2">
            <BaseCheckbox :model-value="selectedIds.has(c.id)" @update:model-value="toggle(c.id)" />
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm text-casual-navy">{{ c.name }}</p>
              <p v-if="defaultAddressLabel(c)" class="truncate text-xs text-independence">{{ defaultAddressLabel(c) }}</p>
            </div>
          </li>
        </ul>
      </div>
    </form>
    <template #footer>
      <BaseButton variant="independence" @click="open = false">Cancel</BaseButton>
      <BaseButton type="submit" form="assign-delivery-form" :loading="saving" :disabled="selectedIds.size === 0">
        Assign {{ selectedIds.size || '' }} {{ selectedIds.size === 1 ? 'Delivery' : 'Deliveries' }}
      </BaseButton>
    </template>
  </BaseModal>
</template>
