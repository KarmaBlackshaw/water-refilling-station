<script setup lang="ts">
import type { CustomerWithRider } from '@/services/customers';
import { buildScheduleByRider, buildAttendanceByRider, resolveRider } from '@/helpers/riderCoverage';
import { formatAddress, pickDefaultAddress } from '@/helpers/address';

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
  rider_id: '',
});

const selectedIds = ref<Set<string>>(new Set());

const { data: riderEmployeesRes, run: loadRiderEmployees } = useAsync(() => listRiderEmployees(auth.tenantId, auth.branchId));
const riderEmployees = computed(() => riderEmployeesRes.value?.data ?? []);

const { data: customersRes, run: loadCustomers } = useAsync(() => listCustomers(auth.tenantId, auth.branchId));
const customers = computed(() => customersRes.value?.data ?? []);

const { data: attendanceRes, loading: attendanceLoading } = useAsync(() => listAttendanceForDate(auth.tenantId, auth.branchId, form.sale_date), {
  watch: () => form.sale_date,
  disableResetValue: true,
});
const attendanceForDate = computed(() => attendanceRes.value?.data ?? []);

const scheduleByRider = computed(() => buildScheduleByRider(riderEmployees.value));
const attendanceByRider = computed(() => buildAttendanceByRider(riderEmployees.value, attendanceForDate.value));

/** Options use user_id as value so form.rider_id stays a users.id for createDeliverySale. */
const riderOptions = computed(() =>
  riderEmployees.value.reduce<{ label: string; value: string }[]>((acc, e) => {
    if (e.user_id != null) {
      acc.push({ label: e.full_name, value: e.user_id });
    }

    return acc;
  }, []),
);

const riderCustomers = computed(() => {
  if (!form.rider_id) {
    return [];
  }

  return customers.value.filter((c) => resolveRider(c, scheduleByRider.value, attendanceByRider.value, form.sale_date).riderId === form.rider_id);
});

/** Customers whose primary AND backup are both absent on the selected date — no automatic assignment. */
const needsRiderCustomers = computed(() => {
  if (!form.rider_id) {
    return [];
  }

  return customers.value.filter((c) => resolveRider(c, scheduleByRider.value, attendanceByRider.value, form.sale_date).source === 'manual');
});

const totalListLength = computed(() => riderCustomers.value.length + needsRiderCustomers.value.length);

const allSelected = computed(() => totalListLength.value > 0 && selectedIds.value.size === totalListLength.value);

function defaultAddressLabel(c: CustomerWithRider): string {
  const a = pickDefaultAddress(c.addresses);

  return a ? `${a.label} — ${formatAddress(a)}` : '';
}

function isBackupCovering(c: CustomerWithRider): boolean {
  return resolveRider(c, scheduleByRider.value, attendanceByRider.value, form.sale_date).source === 'backup';
}

function primaryRiderName(c: CustomerWithRider): string {
  if (!c.rider_id) {
    return '';
  }

  return riderEmployees.value.find((e) => e.user_id === c.rider_id)?.full_name ?? '';
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
  if (allSelected.value) {
    selectedIds.value = new Set();
  } else {
    const allIds = [...riderCustomers.value.map((c) => c.id), ...needsRiderCustomers.value.map((c) => c.id)];

    selectedIds.value = new Set(allIds);
  }
}

/** Selecting a rider defaults to assigning every resolved customer for that rider on the chosen date. */
watch(
  () => form.rider_id,
  () => {
    selectedIds.value = new Set(riderCustomers.value.map((c) => c.id));
  },
);

watch(open, (isOpen) => {
  if (!isOpen) {
    return;
  }

  form.sale_date = defaultDate;
  form.rider_id = '';
  selectedIds.value = new Set();
  /** Setting form.sale_date above triggers the attendance watch; only reload riders + customers here. */
  Promise.all([loadRiderEmployees(), loadCustomers()]);
});

const { loading: saving, run: submit } = useAsync(async () => {
  const ids = [...selectedIds.value];

  if (ids.length === 0) {
    return;
  }

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
        address_id: pickDefaultAddress(c.addresses)?.id ?? null,
        rider_id: form.rider_id,
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
  <BaseModal v-model:open="open" title="Assign deliveries" size="lg">
    <form id="assign-delivery-form" class="space-y-5" @submit.prevent="submit">
      <div class="grid grid-cols-2 gap-4">
        <BaseDatePicker v-model="form.sale_date" label="Delivery Date" required />
        <BaseSelect
          v-model="form.rider_id"
          label="Rider"
          :options="riderOptions"
          placeholder="Select rider..."
          search-placeholder="Search rider..."
          searchable
          required
        />
      </div>

      <div v-if="form.rider_id" class="space-y-2" role="status" aria-live="polite">
        <div class="flex items-center justify-between">
          <p class="text-sm font-medium text-casual-navy">Customers ({{ selectedIds.size }}/{{ totalListLength }})</p>
          <button v-if="totalListLength" type="button" class="text-xs font-medium text-tampa hover:underline focus:outline-none" @click="toggleAll">
            {{ allSelected ? 'Clear all' : 'Select all' }}
          </button>
        </div>

        <BaseSkeleton v-if="attendanceLoading" class="h-20 w-full rounded-lg" />

        <template v-else>
          <BaseEmptyState
            v-if="riderCustomers.length === 0 && needsRiderCustomers.length === 0"
            title="No customers"
            description="No customers for this rider on this date."
          />

          <ul v-else class="max-h-72 divide-y divide-sparkling-silver overflow-y-auto rounded-lg border border-sparkling-silver">
            <li v-for="c in riderCustomers" :key="c.id" class="flex items-center gap-3 px-3 py-2">
              <BaseCheckbox :model-value="selectedIds.has(c.id)" @update:model-value="toggle(c.id)" />
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2">
                  <p class="truncate text-sm text-casual-navy">{{ c.name }}</p>
                  <BaseBadge v-if="isBackupCovering(c)" variant="warning" class="shrink-0"> Covering for {{ primaryRiderName(c) }} </BaseBadge>
                </div>
                <p v-if="defaultAddressLabel(c)" class="truncate text-xs text-independence">
                  {{ defaultAddressLabel(c) }}
                </p>
              </div>
            </li>
          </ul>

          <template v-if="needsRiderCustomers.length > 0">
            <div class="pt-1">
              <p class="text-xs font-semibold text-independence">Needs rider today — primary &amp; backup both off</p>
              <p class="mt-0.5 text-xs text-oslo">Selecting these will assign them to the chosen rider for today.</p>
            </div>
            <ul class="max-h-48 divide-y divide-sparkling-silver overflow-y-auto rounded-lg border border-strong-amber">
              <li v-for="c in needsRiderCustomers" :key="c.id" class="flex items-center gap-3 px-3 py-2">
                <BaseCheckbox :model-value="selectedIds.has(c.id)" @update:model-value="toggle(c.id)" />
                <div class="min-w-0 flex-1">
                  <p class="truncate text-sm text-casual-navy">{{ c.name }}</p>
                  <p v-if="defaultAddressLabel(c)" class="truncate text-xs text-independence">
                    {{ defaultAddressLabel(c) }}
                  </p>
                </div>
              </li>
            </ul>
          </template>
        </template>
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
