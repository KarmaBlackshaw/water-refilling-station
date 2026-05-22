<script setup lang="ts">
import type { Customer, CustomerAddress, Product, ContainerType, User } from '@/types/database';
import type { BookingRow, TemplateRow } from '@/services/bookings';

const auth = useAuthStore();
const tenantId = computed(() => auth.tenantId ?? '');
const branchId = computed(() => auth.branchId ?? '');
const toast = useToast();

const customers = ref<Customer[]>([]);
const riders = ref<Pick<User, 'id' | 'full_name'>[]>([]);
const products = ref<Product[]>([]);
const containerTypes = ref<ContainerType[]>([]);

const customerOptions = computed(() => customers.value.map((c) => ({ label: c.name, value: c.id })));
const riderOptions = computed(() => riders.value.map((r) => ({ label: r.full_name, value: r.id })));
const productOptions = computed(() => products.value.map((p) => ({ label: p.name, value: p.id })));
const containerTypeOptions = computed(() => containerTypes.value.map((ct) => ({ label: ct.name, value: ct.id })));

async function loadShared() {
  const [custRes, riderRes, prodRes, ctRes] = await Promise.all([
    listCustomers(tenantId.value, branchId.value),
    listRiders(tenantId.value, branchId.value),
    listProducts(tenantId.value, branchId.value),
    listContainerTypes(tenantId.value, branchId.value),
  ]);

  customers.value = (custRes.data ?? []) as Customer[];
  riders.value = (riderRes.data ?? []) as Pick<User, 'id' | 'full_name'>[];
  products.value = (prodRes.data ?? []) as Product[];
  containerTypes.value = (ctRes.data ?? []) as ContainerType[];
}

const activeTab = ref('bookings');
const tabs = [
  { key: 'bookings', label: 'Upcoming Bookings' },
  { key: 'templates', label: 'Templates' },
];

const bookingFilter = reactive({
  from: today(),
  to: addDays(today(), 14),
  status: '',
});

const {
  data: bookings,
  loading: bookingsLoading,
  run: loadBookings,
} = useAsync<BookingRow[]>(
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

const generateConfirmOpen = ref(false);
const generateLoading = ref(false);

async function handleGenerate() {
  generateLoading.value = true;
  try {
    const count = await materializeBookings(tenantId.value, branchId.value, today(), addDays(today(), 14));

    generateConfirmOpen.value = false;
    toast.success(`Generated ${count} new booking(s).`);
    await loadBookings();
  } catch (e: unknown) {
    toast.error((e as Error)?.message ?? 'Failed to generate bookings');
  } finally {
    generateLoading.value = false;
  }
}

const newBookingOpen = ref(false);
const newBookingSaving = ref(false);

interface ItemRow {
  product_id: string;
  container_type_id: string;
  quantity: number;
  is_new_container: boolean;
}

const newBookingForm = reactive({
  customer_id: '',
  address_id: '',
  rider_id: '',
  scheduled_date: today(),
  items: [] as ItemRow[],
});

const newBookingAddressOptions = ref<{ label: string; value: string }[]>([]);

watch(
  () => newBookingForm.customer_id,
  async (customerId) => {
    newBookingForm.address_id = '';
    newBookingAddressOptions.value = [];
    if (!customerId) {
      return;
    }

    const { data } = await listAddresses(customerId);

    newBookingAddressOptions.value = (data ?? []).map((a) => ({
      label: `${a.label} — ${a.address_line}`,
      value: a.id,
    }));
  },
);

function addNewBookingItem() {
  newBookingForm.items.push({
    product_id: '',
    container_type_id: '',
    quantity: 1,
    is_new_container: false,
  });
}
function removeNewBookingItem(idx: number) {
  newBookingForm.items.splice(idx, 1);
}

function openNewBooking() {
  newBookingForm.customer_id = '';
  newBookingForm.address_id = '';
  newBookingForm.rider_id = '';
  newBookingForm.scheduled_date = today();
  newBookingForm.items = [{ product_id: '', container_type_id: '', quantity: 1, is_new_container: false }];
  newBookingOpen.value = true;
}

async function saveNewBooking() {
  if (!newBookingForm.customer_id || !newBookingForm.scheduled_date) {
    return;
  }

  if (newBookingForm.items.length === 0) {
    toast.error('Add at least one item.');
    return;
  }

  newBookingSaving.value = true;
  try {
    await createBooking(tenantId.value, branchId.value, {
      customer_id: newBookingForm.customer_id,
      address_id: newBookingForm.address_id || null,
      rider_id: newBookingForm.rider_id || null,
      scheduled_date: newBookingForm.scheduled_date,
      items: newBookingForm.items.filter((i) => i.product_id && i.container_type_id),
    });
    newBookingOpen.value = false;
    toast.success('Booking created.');
    await loadBookings();
  } catch (e: unknown) {
    toast.error((e as Error)?.message ?? 'Failed to create booking');
  } finally {
    newBookingSaving.value = false;
  }
}

const cancelTarget = ref<BookingRow | null>(null);
const cancelLoading = ref(false);

async function handleCancelBooking() {
  if (!cancelTarget.value) {
    return;
  }

  cancelLoading.value = true;
  try {
    await cancelBooking(cancelTarget.value.id);
    cancelTarget.value = null;
    toast.success('Booking cancelled.');
    await loadBookings();
  } catch (e: unknown) {
    toast.error((e as Error)?.message ?? 'Failed to cancel booking');
  } finally {
    cancelLoading.value = false;
  }
}

const fulfillTarget = ref<BookingRow | null>(null);
const fulfillLoading = ref(false);

interface FulfillPrice {
  product_id: string;
  container_type_id: string;
  product_name: string;
  container_name: string;
  quantity: number;
  unit_price_centavos: number;
}
const fulfillPrices = ref<FulfillPrice[]>([]);

async function openFulfill(booking: BookingRow) {
  fulfillTarget.value = booking;
  // Pre-fill prices from product_pricing — best-effort
  fulfillPrices.value = booking.items.map((item) => ({
    product_id: item.product_id,
    container_type_id: item.container_type_id,
    product_name: item.product?.name ?? '',
    container_name: item.container_type?.name ?? '',
    quantity: item.quantity,
    unit_price_centavos: 0,
  }));
  // Load current pricing
  try {
    const { data: pricing } = await listProductPricing(tenantId.value, branchId.value);

    if (pricing) {
      for (const fp of fulfillPrices.value) {
        const match = pricing.find((p) => p.product_id === fp.product_id && p.container_type_id === fp.container_type_id);

        if (match) {
          fp.unit_price_centavos = fp.unit_price_centavos === 0 ? match.refill_price_centavos : fp.unit_price_centavos;
        }
      }
    }
  } catch {
    // pricing load failure is non-critical — user can fill manually
  }
}

function closeFulfill() {
  fulfillTarget.value = null;
  fulfillPrices.value = [];
}

async function handleFulfill() {
  if (!fulfillTarget.value) {
    return;
  }

  fulfillLoading.value = true;
  try {
    const saleId = await fulfillBooking(
      tenantId.value,
      branchId.value,
      fulfillTarget.value.id,
      fulfillPrices.value.map((fp) => ({
        product_id: fp.product_id,
        container_type_id: fp.container_type_id,
        unit_price_centavos: fp.unit_price_centavos,
      })),
    );

    closeFulfill();
    toast.success(`Booking fulfilled. Sale ID: ${saleId.slice(0, 8)}…`);
    await loadBookings();
  } catch (e: unknown) {
    toast.error((e as Error)?.message ?? 'Failed to fulfill booking');
  } finally {
    fulfillLoading.value = false;
  }
}

// Price display helpers
function centavosFromDisplay(display: string): number {
  const n = parseFloat(display.replace(/[^0-9.]/g, ''));

  return isNaN(n) ? 0 : Math.round(n * 100);
}

const {
  data: templates,
  loading: templatesLoading,
  run: loadTemplates,
} = useAsync<TemplateRow[]>(() => listTemplates(), {
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
const templateSaving = ref(false);
const editingTemplate = ref<TemplateRow | null>(null);

const templateForm = reactive({
  customer_id: '',
  address_id: '',
  rider_id: '',
  cadence: 'weekly',
  day_of_week: 0 as number,
  items: [] as ItemRow[],
});

const templateAddressOptions = ref<{ label: string; value: string }[]>([]);

watch(
  () => templateForm.customer_id,
  async (customerId) => {
    templateForm.address_id = '';
    templateAddressOptions.value = [];
    if (!customerId) {
      return;
    }

    const { data } = await listAddresses(customerId);

    templateAddressOptions.value = (data ?? []).map((a) => ({
      label: `${a.label} — ${a.address_line}`,
      value: a.id,
    }));
    // Re-apply if editing an existing template
    if (editingTemplate.value?.address_id) {
      templateForm.address_id = editingTemplate.value.address_id;
    }
  },
);

function addTemplateItem() {
  templateForm.items.push({
    product_id: '',
    container_type_id: '',
    quantity: 1,
    is_new_container: false,
  });
}
function removeTemplateItem(idx: number) {
  templateForm.items.splice(idx, 1);
}

function openAddTemplate() {
  editingTemplate.value = null;
  templateForm.customer_id = '';
  templateForm.address_id = '';
  templateForm.rider_id = '';
  templateForm.cadence = 'weekly';
  templateForm.day_of_week = 0;
  templateForm.items = [{ product_id: '', container_type_id: '', quantity: 1, is_new_container: false }];
  templateModalOpen.value = true;
}

function openEditTemplate(t: TemplateRow) {
  editingTemplate.value = t;
  templateForm.customer_id = t.customer_id;
  templateForm.address_id = t.address_id ?? '';
  templateForm.rider_id = t.rider_id ?? '';
  templateForm.cadence = t.cadence;
  templateForm.day_of_week = t.day_of_week;
  templateForm.items = t.items.map((i) => ({
    product_id: i.product_id,
    container_type_id: i.container_type_id,
    quantity: i.quantity,
    is_new_container: i.is_new_container,
  }));
  templateModalOpen.value = true;
}

async function saveTemplate() {
  if (!templateForm.customer_id) {
    return;
  }

  if (templateForm.items.length === 0) {
    toast.error('Add at least one item.');
    return;
  }

  templateSaving.value = true;
  try {
    const validItems = templateForm.items.filter((i) => i.product_id && i.container_type_id);

    if (editingTemplate.value) {
      await updateTemplate(editingTemplate.value.id, {
        address_id: templateForm.address_id || null,
        rider_id: templateForm.rider_id || null,
        cadence: templateForm.cadence,
        day_of_week: templateForm.day_of_week,
      });
    } else {
      await createTemplate(tenantId.value, branchId.value, {
        customer_id: templateForm.customer_id,
        address_id: templateForm.address_id || null,
        rider_id: templateForm.rider_id || null,
        cadence: templateForm.cadence,
        day_of_week: Number(templateForm.day_of_week),
        items: validItems,
      });
    }

    templateModalOpen.value = false;
    toast.success(editingTemplate.value ? 'Template updated.' : 'Template created.');
    await loadTemplates();
  } catch (e: unknown) {
    toast.error((e as Error)?.message ?? 'Failed to save template');
  } finally {
    templateSaving.value = false;
  }
}

const deleteTemplateTarget = ref<TemplateRow | null>(null);
const deleteTemplateLoading = ref(false);

async function handleDeleteTemplate() {
  if (!deleteTemplateTarget.value) {
    return;
  }

  deleteTemplateLoading.value = true;
  try {
    await deleteTemplate(deleteTemplateTarget.value.id);
    deleteTemplateTarget.value = null;
    toast.success('Template deleted.');
    await loadTemplates();
  } catch (e: unknown) {
    toast.error((e as Error)?.message ?? 'Failed to delete template');
  } finally {
    deleteTemplateLoading.value = false;
  }
}

onMounted(loadShared);
</script>

<template>
  <div class="h-full overflow-y-auto p-6">
    <div class="space-y-4">
      <!-- Page header -->
      <div>
        <h1 class="text-2xl font-bold text-casual-navy">Bookings</h1>
        <p class="text-sm text-oslo">Schedule and manage customer bookings</p>
      </div>

      <!-- Tabs -->
      <BaseTabs v-model="activeTab" :tabs="tabs" />

      <!-- ── Tab 1: Upcoming Bookings ─────────────────────────────────────── -->
      <div v-if="activeTab === 'bookings'" class="space-y-4">
        <!-- Sub-header actions -->
        <div class="flex flex-wrap items-center justify-between gap-2">
          <h2 class="text-base font-medium text-casual-navy">Upcoming Bookings</h2>
          <div class="flex gap-2">
            <BaseButton variant="full-white" @click="generateConfirmOpen = true"> Generate </BaseButton>
            <BaseButton @click="openNewBooking">New Booking</BaseButton>
          </div>
        </div>

        <!-- Filters -->
        <div class="flex flex-wrap gap-3 items-end">
          <div class="flex items-center gap-2">
            <BaseDatePicker v-model="bookingFilter.from" label="From" />
            <BaseDatePicker v-model="bookingFilter.to" label="To" />
          </div>
          <BaseSelect v-model="bookingFilter.status" label="Status" :options="statusOptions" placeholder="All" class="min-w-[160px]" />
        </div>

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
            <div v-if="row.status === 'pending'" class="flex gap-1.5">
              <BaseButton variant="full-white" @click="openFulfill(row)">Fulfill</BaseButton>
              <BaseButton variant="independence" class="text-blaze-red" @click="cancelTarget = row">Cancel</BaseButton>
            </div>
            <span v-else class="text-xs text-independence">—</span>
          </template>
        </BaseTable>
      </div>

      <!-- ── Tab 2: Templates ─────────────────────────────────────────────── -->
      <div v-if="activeTab === 'templates'" class="space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-base font-medium text-casual-navy">Booking Templates</h2>
          <BaseButton @click="openAddTemplate">New Template</BaseButton>
        </div>

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
            <div class="flex gap-1.5">
              <BaseButton variant="independence" @click="openEditTemplate(row)">Edit</BaseButton>
              <BaseButton variant="independence" class="text-blaze-red" @click="deleteTemplateTarget = row">Delete</BaseButton>
            </div>
          </template>
          <template #empty>
            <BaseEmptyState title="No templates yet" description="Create a template to auto-generate recurring bookings.">
              <template #actions>
                <BaseButton @click="openAddTemplate">New Template</BaseButton>
              </template>
            </BaseEmptyState>
          </template>
        </BaseTable>
      </div>
    </div>

    <!-- ── Generate confirm ─────────────────────────────────────────────────── -->
    <BaseConfirm
      :open="generateConfirmOpen"
      title="Generate bookings?"
      message="Generate bookings from all active templates for the next 14 days?"
      confirm-label="Generate"
      variant="turquoise-stone"
      :loading="generateLoading"
      @confirm="handleGenerate"
      @cancel="generateConfirmOpen = false"
    />

    <!-- ── New Booking modal ────────────────────────────────────────────────── -->
    <BaseModal :open="newBookingOpen" title="New Booking" size="lg" @close="newBookingOpen = false">
      <form id="new-booking-form" class="space-y-4" @submit.prevent="saveNewBooking">
        <div class="grid grid-cols-2 gap-3">
          <BaseSelect v-model="newBookingForm.customer_id" label="Customer" :options="customerOptions" placeholder="Select customer..." :required="true" />
          <BaseSelect
            v-model="newBookingForm.address_id"
            label="Address"
            :options="newBookingAddressOptions"
            placeholder="Select address..."
            :disabled="!newBookingForm.customer_id"
          />
        </div>
        <div class="grid grid-cols-2 gap-3">
          <BaseSelect v-model="newBookingForm.rider_id" label="Rider" :options="riderOptions" placeholder="Select rider..." />
          <BaseDatePicker v-model="newBookingForm.scheduled_date" label="Date" :required="true" />
        </div>

        <!-- Items -->
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-xs font-medium text-oslo">Items</span>
            <BaseButton variant="independence" type="button" @click="addNewBookingItem"> + Add item </BaseButton>
          </div>
          <div v-for="(item, idx) in newBookingForm.items" :key="idx" class="grid grid-cols-[1fr_1fr_72px_auto] gap-2 items-end">
            <BaseSelect v-model="item.product_id" :options="productOptions" placeholder="Product..." />
            <BaseSelect v-model="item.container_type_id" :options="containerTypeOptions" placeholder="Container..." />
            <BaseInput v-model="item.quantity" type="number" placeholder="Qty" />
            <BaseButton variant="independence" type="button" class="text-blaze-red mb-0.5" @click="removeNewBookingItem(idx)"> ✕ </BaseButton>
          </div>
          <p v-if="newBookingForm.items.length === 0" class="text-xs text-independence">No items added yet.</p>
        </div>
      </form>

      <template #footer>
        <BaseButton variant="independence" @click="newBookingOpen = false">Cancel</BaseButton>
        <BaseButton type="submit" form="new-booking-form" :loading="newBookingSaving"> Create Booking </BaseButton>
      </template>
    </BaseModal>

    <!-- ── Cancel booking confirm ───────────────────────────────────────────── -->
    <BaseConfirm
      :open="cancelTarget !== null"
      title="Cancel booking?"
      :message="`Cancel booking for ${cancelTarget?.customer?.name ?? 'this customer'} on ${cancelTarget?.scheduled_date ?? ''}?`"
      confirm-label="Cancel booking"
      variant="blaze-red"
      :loading="cancelLoading"
      @confirm="handleCancelBooking"
      @cancel="cancelTarget = null"
    />

    <!-- ── Fulfill modal ────────────────────────────────────────────────────── -->
    <BaseModal :open="fulfillTarget !== null" title="Fulfill Booking" size="lg" @close="closeFulfill">
      <div v-if="fulfillTarget" class="space-y-4">
        <p class="text-sm text-independence">
          Customer: <span class="font-medium text-casual-navy">{{ fulfillTarget.customer?.name }}</span>
          &nbsp;·&nbsp; Date:
          <span class="font-medium text-casual-navy num">{{ fulfillTarget.scheduled_date }}</span>
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
              @change="fp.unit_price_centavos = centavosFromDisplay(($event.target as HTMLInputElement).value)"
            />
          </div>
        </div>
      </div>

      <template #footer>
        <BaseButton variant="independence" @click="closeFulfill">Cancel</BaseButton>
        <BaseButton :loading="fulfillLoading" @click="handleFulfill"> Create Delivery Sale </BaseButton>
      </template>
    </BaseModal>

    <!-- ── Template modal (add/edit) ───────────────────────────────────────── -->
    <BaseModal :open="templateModalOpen" :title="editingTemplate ? 'Edit Template' : 'New Template'" size="xl" @close="templateModalOpen = false">
      <form id="template-form" class="space-y-4" @submit.prevent="saveTemplate">
        <div class="grid grid-cols-2 gap-3">
          <BaseSelect
            v-model="templateForm.customer_id"
            label="Customer"
            :options="customerOptions"
            placeholder="Select customer..."
            :required="true"
            :disabled="!!editingTemplate"
          />
          <BaseSelect
            v-model="templateForm.address_id"
            label="Address"
            :options="templateAddressOptions"
            placeholder="Select address..."
            :disabled="!templateForm.customer_id"
          />
        </div>
        <div class="grid grid-cols-3 gap-3">
          <BaseSelect v-model="templateForm.rider_id" label="Rider" :options="riderOptions" placeholder="Select rider..." />
          <BaseSelect v-model="templateForm.cadence" label="Cadence" :options="cadenceOptions" :required="true" />
          <BaseSelect v-model="templateForm.day_of_week" label="Day of Week" :options="dayOptions" :required="true" />
        </div>

        <!-- Items -->
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-xs font-medium text-oslo">Items</span>
            <BaseButton variant="independence" type="button" @click="addTemplateItem"> + Add item </BaseButton>
          </div>
          <div v-for="(item, idx) in templateForm.items" :key="idx" class="grid grid-cols-[1fr_1fr_72px_120px_auto] gap-2 items-end">
            <BaseSelect v-model="item.product_id" :options="productOptions" placeholder="Product..." />
            <BaseSelect v-model="item.container_type_id" :options="containerTypeOptions" placeholder="Container..." />
            <BaseInput v-model="item.quantity" type="number" placeholder="Qty" />
            <label class="flex items-center gap-1.5 text-xs text-independence mb-1.5 cursor-pointer">
              <input v-model="item.is_new_container" type="checkbox" class="rounded border-sparkling-silver accent-turquoise-stone" />
              New container
            </label>
            <BaseButton variant="independence" type="button" class="text-blaze-red mb-0.5" @click="removeTemplateItem(idx)"> ✕ </BaseButton>
          </div>
          <p v-if="templateForm.items.length === 0" class="text-xs text-independence">No items added yet.</p>
        </div>
      </form>

      <template #footer>
        <BaseButton variant="independence" @click="templateModalOpen = false">Cancel</BaseButton>
        <BaseButton type="submit" form="template-form" :loading="templateSaving">
          {{ editingTemplate ? 'Save Changes' : 'Create Template' }}
        </BaseButton>
      </template>
    </BaseModal>

    <!-- ── Delete template confirm ──────────────────────────────────────────── -->
    <BaseConfirm
      :open="deleteTemplateTarget !== null"
      title="Delete template?"
      :message="`Delete template for ${deleteTemplateTarget?.customer?.name ?? 'this customer'}? Future generated bookings won't be affected.`"
      confirm-label="Delete"
      variant="blaze-red"
      :loading="deleteTemplateLoading"
      @confirm="handleDeleteTemplate"
      @cancel="deleteTemplateTarget = null"
    />
  </div>
</template>
