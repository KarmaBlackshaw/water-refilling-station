<script setup lang="ts">
import type { Customer, Product, ContainerType, User, BookingStatus, BookingCadence } from '@/types/database';
import type { BookingRow, TemplateRow } from '@/services/bookings';
import IconEdit from '@/components/Icon/IconEdit.vue';
import IconTrash from '@/components/Icon/IconTrash.vue';

const auth = useAuthStore();
const { tenantId, branchId } = storeToRefs(auth);
const toast = useToast();
const { confirm } = useConfirm();

const customers = ref<Customer[]>([]);
const riders = ref<Pick<User, 'id' | 'full_name'>[]>([]);
const products = ref<Product[]>([]);
const containerTypes = ref<ContainerType[]>([]);

async function loadShared() {
  const [custRes, riderRes, prodRes, ctRes] = await Promise.all([
    listCustomers(tenantId.value, branchId.value),
    listRiders(tenantId.value, branchId.value),
    listProducts(tenantId.value, branchId.value),
    listContainerTypes(tenantId.value, branchId.value),
  ]);

  customers.value = custRes.data ?? [];
  riders.value = riderRes.data ?? [];
  products.value = prodRes.data ?? [];
  containerTypes.value = ctRes.data ?? [];
}

const activeTab = ref('bookings');
const tabs = [
  { key: 'bookings', label: 'Upcoming Bookings' },
  { key: 'templates', label: 'Templates' },
];

const bookingFilter = reactive<{ from: string; to: string; status: BookingStatus | '' }>({
  from: today(),
  to: addDays(today(), 14),
  status: '',
});

const {
  data: bookings,
  loading: bookingsLoading,
  run: loadBookings,
} = useAsync(
  () =>
    listBookings({
      from: bookingFilter.from,
      to: bookingFilter.to,
      status: bookingFilter.status || undefined,
    }),
  {
    immediate: true,
    defaultValue: [],
    disableResetValue: true,
    watch: [() => bookingFilter.from, () => bookingFilter.to, () => bookingFilter.status],
  },
);

const statusOptions = [
  { label: 'All (non-cancelled)', value: '' },
  { label: 'Pending', value: 'pending' },
  { label: 'Fulfilled', value: 'fulfilled' },
  { label: 'Cancelled', value: 'cancelled' },
];

function statusVariant(status: string): 'warning' | 'success' | 'default' {
  if (status === 'pending') {
    return 'warning';
  }

  if (status === 'fulfilled') {
    return 'success';
  }

  return 'default';
}

function itemsSummary(items: BookingRow['items'] | TemplateRow['items']): string {
  return items.map((i) => `${i.quantity}× ${i.container_type?.name ?? '?'} ${i.product?.name ?? '?'}`).join(', ');
}

function openGenerateConfirm() {
  confirm({
    title: 'Generate bookings?',
    message: 'Generate bookings from all active templates for the next 14 days?',
    confirmLabel: 'Generate',
    variant: 'turquoise-stone',
    onConfirm: async () => {
      try {
        const count = await materializeBookings(tenantId.value, branchId.value, today(), addDays(today(), 14));

        toast.success(`Generated ${count} new booking(s).`);
        await loadBookings();
      } catch (e: unknown) {
        toast.error(getErrorMessage(e, 'Failed to generate bookings'));
      }
    },
  });
}

const newBookingOpen = ref(false);

const { loading: newBookingSaving, run: saveNewBooking } = useAsync(
  async (payload: {
    customer_id: string;
    address_id: string | null;
    rider_id: string | null;
    scheduled_date: string;
    items: { product_id: string; container_type_id: string; quantity: number; is_new_container: boolean }[];
  }) => {
    try {
      await createBooking(tenantId.value, branchId.value, payload);
      newBookingOpen.value = false;
      toast.success('Booking created.');
      await loadBookings();
    } catch (e: unknown) {
      toast.error(getErrorMessage(e, 'Failed to create booking'));
    }
  },
);

const fulfillTarget = ref<BookingRow>();
const fulfillOpen = ref(false);

function openFulfill(booking: BookingRow) {
  fulfillTarget.value = booking;
  fulfillOpen.value = true;
}

const { loading: fulfillLoading, run: handleFulfill } = useAsync(
  async (prices: Array<{ product_id: string; container_type_id: string; unit_price_centavos: number }>) => {
    if (!fulfillTarget.value) {
      return;
    }

    try {
      const saleId = await fulfillBooking(tenantId.value, branchId.value, fulfillTarget.value.id, prices);

      fulfillOpen.value = false;
      fulfillTarget.value = undefined;
      toast.success(`Booking fulfilled. Sale ID: ${saleId.slice(0, 8)}…`);
      await loadBookings();
    } catch (e: unknown) {
      toast.error(getErrorMessage(e, 'Failed to fulfill booking'));
    }
  },
);

const {
  data: templates,
  loading: templatesLoading,
  run: loadTemplates,
} = useAsync(() => listTemplates(), {
  immediate: true,
  defaultValue: [],
  disableResetValue: true,
});

const cadenceOptions = [
  { label: 'Weekly', value: 'weekly' },
  { label: 'Bi-weekly', value: 'bi_weekly' },
  { label: 'Monthly', value: 'monthly' },
];

const dayOptions = [
  { label: 'Mon', value: 0 },
  { label: 'Tue', value: 1 },
  { label: 'Wed', value: 2 },
  { label: 'Thu', value: 3 },
  { label: 'Fri', value: 4 },
  { label: 'Sat', value: 5 },
];

function cadenceLabel(c: string): string {
  return cadenceOptions.find((o) => o.value === c)?.label ?? c;
}
function dayLabel(d: number): string {
  return dayOptions.find((o) => o.value === d)?.label ?? String(d);
}

const templateModalOpen = ref(false);
const editingTemplate = ref<TemplateRow>();

function openAddTemplate() {
  editingTemplate.value = undefined;
  templateModalOpen.value = true;
}

function openEditTemplate(t: TemplateRow) {
  editingTemplate.value = t;
  templateModalOpen.value = true;
}

const { loading: templateSaving, run: saveTemplate } = useAsync(
  async (payload: {
    customer_id: string;
    address_id: string | null;
    rider_id: string | null;
    cadence: BookingCadence;
    day_of_week: number;
    items: { product_id: string; container_type_id: string; quantity: number; is_new_container: boolean }[];
  }) => {
    try {
      const isEditing = !!editingTemplate.value;

      if (editingTemplate.value) {
        await updateTemplate(editingTemplate.value.id, {
          address_id: payload.address_id,
          rider_id: payload.rider_id,
          cadence: payload.cadence,
          day_of_week: payload.day_of_week,
        });
      } else {
        await createTemplate(tenantId.value, branchId.value, payload);
      }

      templateModalOpen.value = false;
      toast.success(isEditing ? 'Template updated.' : 'Template created.');
      await loadTemplates();
    } catch (e: unknown) {
      toast.error(getErrorMessage(e, 'Failed to save template'));
    }
  },
);

function bookingRowMenu(row: BookingRow) {
  const isPending = row.status === 'pending';

  return [
    { label: 'Fulfill', onClick: () => openFulfill(row), hidden: !isPending },
    {
      label: 'Cancel',
      icon: IconTrash,
      danger: true,
      onClick: () =>
        confirm({
          title: 'Cancel booking?',
          message: `Cancel booking for ${row.customer?.name ?? 'this customer'} on ${row.scheduled_date ?? ''}?`,
          confirmLabel: 'Cancel booking',
          variant: 'blaze-red',
          onConfirm: async () => {
            try {
              await cancelBooking(row.id);
              toast.success('Booking cancelled.');
              await loadBookings();
            } catch (e: unknown) {
              toast.error(getErrorMessage(e, 'Failed to cancel booking'));
            }
          },
        }),
      hidden: !isPending,
    },
  ];
}

function templateRowMenu(row: TemplateRow) {
  return [
    { label: 'Edit', icon: IconEdit, onClick: () => openEditTemplate(row) },
    {
      label: 'Delete',
      icon: IconTrash,
      danger: true,
      onClick: () =>
        confirm({
          title: 'Delete template?',
          message: `Delete template for ${row.customer?.name ?? 'this customer'}? Future generated bookings won't be affected.`,
          confirmLabel: 'Delete',
          variant: 'blaze-red',
          onConfirm: async () => {
            try {
              await deleteTemplate(row.id);
              toast.success('Template deleted.');
              await loadTemplates();
            } catch (e: unknown) {
              toast.error(getErrorMessage(e, 'Failed to delete template'));
            }
          },
        }),
    },
  ];
}

onMounted(loadShared);
</script>

<template>
  <div class="h-full overflow-y-auto p-6">
    <div class="space-y-4">
      <div>
        <h1 class="text-2xl font-bold text-casual-navy">Bookings</h1>
        <p class="text-sm text-oslo">Schedule and manage customer bookings</p>
      </div>

      <BaseTabs v-model="activeTab" :tabs="tabs" />

      <div v-if="activeTab === 'bookings'" class="space-y-4">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <h2 class="text-base font-medium text-casual-navy">Upcoming Bookings</h2>
          <div class="flex gap-2">
            <BaseButton variant="full-white" @click="openGenerateConfirm"> Generate </BaseButton>
            <BaseButton @click="newBookingOpen = true">New Booking</BaseButton>
          </div>
        </div>

        <div class="flex flex-wrap gap-3 items-end">
          <div class="flex items-center gap-2">
            <BaseDatePicker v-model="bookingFilter.from" label="From" />
            <BaseDatePicker v-model="bookingFilter.to" label="To" />
          </div>
          <BaseSelect v-model="bookingFilter.status" label="Status" :options="statusOptions" placeholder="All" class="min-w-[160px]" />
        </div>

        <BaseCard padding="none">
          <BaseTable
            :columns="[
              { key: 'scheduled_date', label: 'Date', class: 'num whitespace-nowrap' },
              { key: 'customer', label: 'Customer' },
              { key: 'rider', label: 'Rider' },
              { key: 'items', label: 'Items', class: 'max-w-xs truncate text-sm text-independence' },
              { key: 'status', label: 'Status' },
              { key: 'actions', label: 'Actions' },
            ]"
            :data="bookings"
            :loading="bookingsLoading"
            empty-title="No bookings found"
            empty-description="Adjust filters or generate bookings from templates."
          >
            <template #cell-customer="{ row }">{{ row.customer?.name ?? '—' }}</template>
            <template #cell-rider="{ row }">{{ row.rider?.full_name ?? '—' }}</template>
            <template #cell-items="{ row }">{{ itemsSummary(row.items) }}</template>
            <template #cell-status="{ row }">
              <BaseBadge :variant="statusVariant(row.status)">
                {{ row.status.charAt(0).toUpperCase() + row.status.slice(1) }}
              </BaseBadge>
            </template>
            <template #cell-actions="{ row }">
              <BaseTableActions :menu="bookingRowMenu(row)" />
            </template>
          </BaseTable>
        </BaseCard>
      </div>

      <div v-if="activeTab === 'templates'" class="space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-base font-medium text-casual-navy">Booking Templates</h2>
          <BaseButton @click="openAddTemplate">New Template</BaseButton>
        </div>

        <BaseCard padding="none">
          <BaseTable
            :columns="[
              { key: 'customer', label: 'Customer' },
              { key: 'rider', label: 'Rider' },
              { key: 'cadence', label: 'Cadence' },
              { key: 'day', label: 'Day' },
              { key: 'items', label: 'Items', class: 'max-w-xs truncate text-sm text-independence' },
              { key: 'active', label: 'Active' },
              { key: 'actions', label: 'Actions' },
            ]"
            :data="templates"
            :loading="templatesLoading"
          >
            <template #cell-customer="{ row }">
              <span class="font-medium text-casual-navy">{{ row.customer?.name ?? '—' }}</span>
              <span v-if="row.customer?.phone" class="ml-1.5 text-xs text-independence">
                {{ row.customer.phone }}
              </span>
            </template>
            <template #cell-rider="{ row }">{{ row.rider?.full_name ?? '—' }}</template>
            <template #cell-cadence="{ row }">{{ cadenceLabel(row.cadence) }}</template>
            <template #cell-day="{ row }">{{ dayLabel(row.day_of_week) }}</template>
            <template #cell-items="{ row }">{{ itemsSummary(row.items) }}</template>
            <template #cell-active="{ row }">
              <BaseBadge :variant="row.active ? 'success' : 'danger'">
                {{ row.active ? 'Active' : 'Inactive' }}
              </BaseBadge>
            </template>
            <template #cell-actions="{ row }">
              <BaseTableActions :menu="templateRowMenu(row)" />
            </template>
            <template #empty>
              <BaseEmptyState title="No templates yet" description="Create a template to auto-generate recurring bookings.">
                <template #actions>
                  <BaseButton @click="openAddTemplate">New Template</BaseButton>
                </template>
              </BaseEmptyState>
            </template>
          </BaseTable>
        </BaseCard>
      </div>
    </div>

    <BookingNewModal
      v-model:open="newBookingOpen"
      :customers="customers"
      :riders="riders"
      :products="products"
      :container-types="containerTypes"
      :saving="newBookingSaving"
      @submit="saveNewBooking"
    />

    <BookingFulfillModal
      v-model:open="fulfillOpen"
      :booking="fulfillTarget"
      :tenant-id="tenantId"
      :branch-id="branchId"
      :saving="fulfillLoading"
      @submit="handleFulfill"
    />

    <BookingTemplateFormModal
      v-model:open="templateModalOpen"
      :template="editingTemplate"
      :customers="customers"
      :riders="riders"
      :products="products"
      :container-types="containerTypes"
      :saving="templateSaving"
      @submit="saveTemplate"
    />
  </div>
</template>
