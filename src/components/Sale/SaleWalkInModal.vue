<script setup lang="ts">
import type { Customer, Product, ContainerType } from '@/types/database';
import { loadPricing as fetchPricing, resolvePrice as resolvePriceFn, type PricingData } from '@/services/pricing';
import { formatMoney } from '@/helpers/money';
import IconClose from '@/components/Icon/IconClose.vue';

type CustomerWithArea = Customer & { area: { id: string; name: string } | null };

interface PosLine {
  id: number;
  product_id: string;
  container_type_id: string;
  quantity: number;
  unit_price_centavos: number;
  is_new_container: boolean;
}

interface PosPayment {
  id: number;
  method: string;
  amount_centavos: number;
  gcash_ref: string;
}

export interface WalkInSubmitPayload {
  customer_id: string | null;
  sale_date: string;
  notes: string | null;
  lines: Array<{
    product_id: string;
    container_type_id: string;
    quantity: number;
    unit_price_centavos: number;
    is_new_container: boolean;
  }>;
  payments: Array<{ method: string; amount_centavos: number; gcash_ref: string | null }>;
}

const open = defineModel<boolean>('open', { required: true });

const { customers, products, containerTypes, saving } = defineProps<{
  customers: CustomerWithArea[];
  products: Product[];
  containerTypes: ContainerType[];
  saving?: boolean;
}>();

const emit = defineEmits<{
  submit: [payload: WalkInSubmitPayload];
}>();

const productOptions = computed(() => products.map((p) => ({ label: p.name, value: p.id })));
const containerTypeOptions = computed(() => containerTypes.map((ct) => ({ label: ct.name, value: ct.id })));

const paymentMethodOptions = [
  { label: 'Cash', value: 'cash' },
  { label: 'GCash', value: 'gcash' },
  { label: 'On Account', value: 'on_account' },
];

const pricingData = ref<PricingData>({ overrides: [], pricing: [] });

async function loadPricing(customerId: string | null) {
  pricingData.value = await fetchPricing(customerId);
}

function resolvePrice(productId: string, containerTypeId: string, isNewContainer: boolean): number {
  return resolvePriceFn(pricingData.value, productId, containerTypeId, isNewContainer);
}

const customerSearch = ref('');
const selectedCustomer = ref<CustomerWithArea>();
const showCustomerDropdown = ref(false);

const filteredCustomers = computed(() => {
  const q = customerSearch.value.toLowerCase().trim();

  if (!q) {
    return customers.slice(0, 10);
  }

  return customers.filter((c) => c.name.toLowerCase().includes(q) || (c.phone ?? '').includes(q)).slice(0, 10);
});

function closeCustomerDropdown() {
  setTimeout(() => {
    showCustomerDropdown.value = false;
  }, 150);
}

function selectCustomer(c: CustomerWithArea) {
  selectedCustomer.value = c;
  customerSearch.value = c.name;
  showCustomerDropdown.value = false;
  loadPricing(c.id);
  for (const line of posLines.value) {
    if (line.product_id && line.container_type_id) {
      line.unit_price_centavos = resolvePrice(line.product_id, line.container_type_id, line.is_new_container);
    }
  }
}

function clearCustomer() {
  selectedCustomer.value = undefined;
  customerSearch.value = '';
  loadPricing(null);
}

let lineCounter = 0;

function makeLine(): PosLine {
  return {
    id: ++lineCounter,
    product_id: '',
    container_type_id: '',
    quantity: 1,
    unit_price_centavos: 0,
    is_new_container: false,
  };
}

const posLines = ref<PosLine[]>([makeLine()]);

function addLine() {
  posLines.value.push(makeLine());
}

function removeLine(id: number) {
  if (posLines.value.length === 1) {
    return;
  }

  posLines.value = posLines.value.filter((l) => l.id !== id);
}

function onLineProductOrContainerChange(line: PosLine) {
  if (line.product_id && line.container_type_id) {
    line.unit_price_centavos = resolvePrice(line.product_id, line.container_type_id, line.is_new_container);
  }
}

function onNewContainerChange(line: PosLine) {
  if (line.product_id && line.container_type_id) {
    line.unit_price_centavos = resolvePrice(line.product_id, line.container_type_id, line.is_new_container);
  }
}

const linesTotal = computed(() => posLines.value.reduce((s, l) => s + l.quantity * l.unit_price_centavos, 0));

let payCounter = 0;

function makePayment(): PosPayment {
  return { id: ++payCounter, method: 'cash', amount_centavos: 0, gcash_ref: '' };
}

const posPayments = ref<PosPayment[]>([makePayment()]);

function addPayment() {
  posPayments.value.push(makePayment());
}

function removePayment(id: number) {
  if (posPayments.value.length === 1) {
    return;
  }

  posPayments.value = posPayments.value.filter((p) => p.id !== id);
}

const paymentsTotal = computed(() => posPayments.value.reduce((s, p) => s + p.amount_centavos, 0));
const balance = computed(() => paymentsTotal.value - linesTotal.value);

const posDate = ref(today());
const posNotes = ref('');

const { error: toastError } = useToast();

watch(
  () => open.value,
  (isOpen) => {
    if (!isOpen) {
      return;
    }

    posLines.value = [makeLine()];
    posPayments.value = [makePayment()];
    selectedCustomer.value = undefined;
    customerSearch.value = '';
    posDate.value = today();
    posNotes.value = '';
    loadPricing(null);
  },
  { immediate: true },
);

function submit() {
  const validLines = posLines.value.filter((l) => l.product_id && l.container_type_id && l.quantity > 0);

  if (validLines.length === 0) {
    toastError('Add at least one line item');
    return;
  }

  const validPayments = posPayments.value.filter((p) => p.amount_centavos > 0);

  if (validPayments.length === 0) {
    toastError('Add at least one payment');
    return;
  }

  emit('submit', {
    customer_id: selectedCustomer.value?.id ?? null,
    sale_date: posDate.value,
    notes: posNotes.value || null,
    lines: validLines.map((l) => ({
      product_id: l.product_id,
      container_type_id: l.container_type_id,
      quantity: l.quantity,
      unit_price_centavos: l.unit_price_centavos,
      is_new_container: l.is_new_container,
    })),
    payments: validPayments.map((p) => ({
      method: p.method,
      amount_centavos: p.amount_centavos,
      gcash_ref: p.gcash_ref || null,
    })),
  });
}
</script>

<template>
  <BaseModal v-model:open="open" title="New Walk-in Sale" size="xl">
    <form id="pos-form" class="space-y-6" @submit.prevent="submit">
      <div class="grid grid-cols-2 gap-4">
        <BaseDatePicker v-model="posDate" label="Sale Date" required />
        <BaseInput v-model="posNotes" label="Notes (optional)" placeholder="Any notes..." />
      </div>

      <div class="relative">
        <label class="text-xs font-medium text-oslo block mb-1"> Customer (optional) </label>
        <div class="flex gap-2">
          <div class="relative flex-1">
            <BaseInput
              v-model="customerSearch"
              placeholder="Search by name or phone..."
              @focus="showCustomerDropdown = true"
              @blur="closeCustomerDropdown"
              @input="showCustomerDropdown = true"
            />
            <div
              v-if="showCustomerDropdown && filteredCustomers.length > 0"
              class="absolute z-30 mt-1 w-full bg-full-white border border-sparkling-silver rounded-lg shadow-lg overflow-hidden"
            >
              <button
                v-for="c in filteredCustomers"
                :key="c.id"
                type="button"
                class="w-full text-left px-3 py-2 text-sm hover:bg-bright-chrome text-casual-navy flex justify-between"
                @mousedown.prevent="selectCustomer(c)"
              >
                <span>{{ c.name }}</span>
                <span class="text-independence text-xs">{{ c.area?.name ?? '' }}</span>
              </button>
            </div>
          </div>
          <BaseButton v-if="selectedCustomer" type="button" variant="independence" @click="clearCustomer"> Clear </BaseButton>
        </div>
        <p v-if="selectedCustomer" class="text-xs text-dark-green-turquoise mt-1">
          Selected: {{ selectedCustomer.name }}
          <span v-if="selectedCustomer.area"> — {{ selectedCustomer.area.name }}</span>
        </p>
      </div>

      <div>
        <div class="flex items-center justify-between mb-2">
          <h3 class="text-sm font-semibold text-casual-navy">Line Items</h3>
        </div>

        <div class="space-y-2">
          <div v-for="line in posLines" :key="line.id" class="grid grid-cols-[1fr_1fr_auto_80px_110px_auto_auto] gap-2 items-end">
            <BaseSelect v-model="line.product_id" :options="productOptions" placeholder="Product" @update:model-value="onLineProductOrContainerChange(line)" />
            <BaseSelect
              v-model="line.container_type_id"
              :options="containerTypeOptions"
              placeholder="Container"
              @update:model-value="onLineProductOrContainerChange(line)"
            />
            <div class="flex flex-col gap-1 items-center justify-end pb-0.5">
              <span class="text-xs text-oslo whitespace-nowrap">New?</span>
              <BaseCheckbox v-model="line.is_new_container" @update:model-value="onNewContainerChange(line)" />
            </div>
            <BaseInput v-model.number="line.quantity" type="number" label="Qty" min="1" required />
            <BaseInput v-model.number="line.unit_price_centavos" type="number" label="Unit Price (¢)" min="0" />
            <div class="flex flex-col justify-end pb-0.5">
              <span class="text-xs text-independence whitespace-nowrap num">
                {{ formatMoney(line.quantity * line.unit_price_centavos) }}
              </span>
            </div>
            <button
              type="button"
              class="mb-0.5 text-blaze-red hover:opacity-70 transition-opacity"
              aria-label="Remove line"
              :disabled="posLines.length === 1"
              @click="removeLine(line.id)"
            >
              <IconClose class="size-4" />
            </button>
          </div>
        </div>

        <BaseButton type="button" variant="independence" class="mt-2" @click="addLine"> + Add Item </BaseButton>
      </div>

      <div>
        <h3 class="text-sm font-semibold text-casual-navy mb-2">Payment</h3>

        <div class="space-y-2">
          <div v-for="pay in posPayments" :key="pay.id" class="grid grid-cols-[160px_1fr_1fr_auto] gap-2 items-end">
            <BaseSelect v-model="pay.method" :options="paymentMethodOptions" label="Method" />
            <BaseInput v-model.number="pay.amount_centavos" type="number" label="Amount (¢)" min="0" />
            <BaseInput v-if="pay.method === 'gcash'" v-model="pay.gcash_ref" label="GCash Ref" placeholder="Ref number" />
            <div v-else />
            <button
              type="button"
              class="mb-0.5 text-blaze-red hover:opacity-70 transition-opacity"
              aria-label="Remove payment"
              :disabled="posPayments.length === 1"
              @click="removePayment(pay.id)"
            >
              <IconClose class="size-4" />
            </button>
          </div>
        </div>

        <BaseButton type="button" variant="independence" class="mt-2" @click="addPayment"> + Add Payment </BaseButton>
      </div>

      <div class="rounded-lg border border-sparkling-silver bg-bright-chrome p-4 space-y-1 text-sm">
        <div class="flex justify-between">
          <span class="text-independence">Items Total</span>
          <span class="num text-casual-navy">{{ formatMoney(linesTotal) }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-independence">Payment Total</span>
          <span class="num text-casual-navy">{{ formatMoney(paymentsTotal) }}</span>
        </div>
        <div class="flex justify-between border-t border-sparkling-silver pt-1 font-semibold">
          <span :class="balance >= 0 ? 'text-dark-green-turquoise' : 'text-blaze-red'">
            {{ balance >= 0 ? 'Change' : 'Remaining' }}
          </span>
          <span class="num" :class="balance >= 0 ? 'text-dark-green-turquoise' : 'text-blaze-red'">
            {{ formatMoney(Math.abs(balance)) }}
          </span>
        </div>
      </div>
    </form>

    <template #footer>
      <BaseButton variant="independence" @click="open = false">Cancel</BaseButton>
      <BaseButton type="submit" form="pos-form" :loading="saving">Record Sale</BaseButton>
    </template>
  </BaseModal>
</template>
