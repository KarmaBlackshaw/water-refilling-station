<script setup lang="ts">
import type { Customer, Product, ContainerType, User } from '@/types/database';
import type { TemplateRow } from '@/services/bookings';
import type { Option } from '@/types';
import { formatAddress } from '@/helpers/address';

defineOptions({ name: 'BookingTemplateFormModal' });

interface ItemRow {
  product_id: string;
  container_type_id: string;
  quantity: number;
  is_new_container: boolean;
}

const open = defineModel<boolean>('open', { required: true });

const { template, customers, riders, products, containerTypes, saving } = defineProps<{
  template?: TemplateRow;
  customers: Customer[];
  riders: Pick<User, 'id' | 'full_name'>[];
  products: Product[];
  containerTypes: ContainerType[];
  saving?: boolean;
}>();

const emit = defineEmits<{
  submit: [
    payload: {
      customer_id: string;
      address_id: string | null;
      rider_id: string | null;
      cadence: string;
      day_of_week: number;
      items: ItemRow[];
    },
  ];
}>();

const toast = useToast();

const customerOptions = computed(() => customers.map((c) => ({ label: c.name, value: c.id })));
const riderOptions = computed(() => riders.map((r) => ({ label: r.full_name, value: r.id })));
const productOptions = computed(() => products.map((p) => ({ label: p.name, value: p.id })));
const containerTypeOptions = computed(() => containerTypes.map((ct) => ({ label: ct.name, value: ct.id })));

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

type FormState = {
  customer_id: string;
  address_id: string;
  rider_id: string;
  cadence: string;
  day_of_week: number;
  items: ItemRow[];
};

const form = reactive<FormState>({
  customer_id: '',
  address_id: '',
  rider_id: '',
  cadence: 'weekly',
  day_of_week: 0,
  items: [],
});

const addressOptions = ref<Option<string>[]>([]);

watch(
  () => form.customer_id,
  async (customerId) => {
    form.address_id = '';
    addressOptions.value = [];
    if (!customerId) {
      return;
    }

    const { data } = await listAddresses(customerId);

    addressOptions.value = (data ?? []).map((a) => ({
      label: `${a.label} — ${formatAddress(a)}`,
      value: a.id,
    }));

    if (template?.address_id) {
      form.address_id = template.address_id;
    }
  },
);

watch(
  () => open.value,
  (isOpen) => {
    if (!isOpen) {
      return;
    }

    if (template) {
      form.customer_id = template.customer_id;
      form.address_id = template.address_id ?? '';
      form.rider_id = template.rider_id ?? '';
      form.cadence = template.cadence;
      form.day_of_week = template.day_of_week;
      form.items = template.items.map((i) => ({
        product_id: i.product_id,
        container_type_id: i.container_type_id,
        quantity: i.quantity,
        is_new_container: i.is_new_container,
      }));
    } else {
      form.customer_id = '';
      form.address_id = '';
      form.rider_id = '';
      form.cadence = 'weekly';
      form.day_of_week = 0;
      form.items = [{ product_id: '', container_type_id: '', quantity: 1, is_new_container: false }];
    }
  },
  { immediate: true },
);

function addItem() {
  form.items.push({ product_id: '', container_type_id: '', quantity: 1, is_new_container: false });
}
function removeItem(idx: number) {
  form.items.splice(idx, 1);
}

function submit() {
  if (!form.customer_id) {
    return;
  }

  if (form.items.length === 0) {
    toast.error('Add at least one item.');
    return;
  }

  emit('submit', {
    customer_id: form.customer_id,
    address_id: form.address_id || null,
    rider_id: form.rider_id || null,
    cadence: form.cadence,
    day_of_week: Number(form.day_of_week),
    items: form.items.filter((i) => i.product_id && i.container_type_id),
  });
}
</script>

<template>
  <BaseModal v-model:open="open" :title="template ? 'Edit Template' : 'New Template'" size="xl">
    <form id="template-form" class="space-y-4" @submit.prevent="submit">
      <div class="grid grid-cols-2 gap-3">
        <BaseSelect v-model="form.customer_id" label="Customer" :options="customerOptions" placeholder="Select customer..." required :disabled="!!template" />
        <BaseSelect v-model="form.address_id" label="Address" :options="addressOptions" placeholder="Select address..." :disabled="!form.customer_id" />
      </div>
      <div class="grid grid-cols-3 gap-3">
        <BaseSelect v-model="form.rider_id" label="Rider" :options="riderOptions" placeholder="Select rider..." />
        <BaseSelect v-model="form.cadence" label="Cadence" :options="cadenceOptions" required />
        <BaseSelect v-model="form.day_of_week" label="Day of Week" :options="dayOptions" required />
      </div>

      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <span class="text-xs font-medium text-oslo">Items</span>
          <BaseButton variant="independence" type="button" @click="addItem"> + Add item </BaseButton>
        </div>
        <div v-for="(item, idx) in form.items" :key="idx" class="grid grid-cols-[1fr_1fr_72px_120px_auto] gap-2 items-end">
          <BaseSelect v-model="item.product_id" :options="productOptions" placeholder="Product..." />
          <BaseSelect v-model="item.container_type_id" :options="containerTypeOptions" placeholder="Container..." />
          <BaseInput v-model="item.quantity" type="number" placeholder="Qty" />
          <label class="flex items-center gap-1.5 text-xs text-independence mb-1.5 cursor-pointer">
            <input v-model="item.is_new_container" type="checkbox" class="rounded border-sparkling-silver accent-tampa" />
            New container
          </label>
          <BaseButton variant="independence" type="button" class="text-blaze-red mb-0.5" @click="removeItem(idx)"> ✕ </BaseButton>
        </div>
        <p v-if="form.items.length === 0" class="text-xs text-independence">No items added yet.</p>
      </div>
    </form>

    <template #footer>
      <BaseButton variant="independence" @click="open = false">Cancel</BaseButton>
      <BaseButton type="submit" form="template-form" :loading="saving">
        {{ template ? 'Save Changes' : 'Create Template' }}
      </BaseButton>
    </template>
  </BaseModal>
</template>
