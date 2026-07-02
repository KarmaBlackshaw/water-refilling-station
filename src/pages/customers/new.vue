<script setup lang="ts">
import type { FullPageTab } from '@/components/Base/BaseFullPageTabs.vue';
import { customerDetailsSchema, type AddressFields, type CustomerForm } from '@/constants/customer';
import { ROUTES } from '@/constants/routes';
import { zodErrors } from '@/helpers/validation';

const route = useRoute();
const router = useRouter();
const toast = useToast();
const auth = useAuthStore();
const { tenantId, branchId } = storeToRefs(auth);

const customerId = typeof route.query.id === 'string' ? route.query.id : undefined;
const isEdit = !!customerId;

const { data: customerRes, loading: fetching } = useAsync(() => getCustomer(customerId!), { immediate: isEdit });

const customer = computed(() => customerRes.value?.data ?? null);

const form = reactive<CustomerForm>({
  name: '',
  phone: '',
  type: 'residential',
  notes: '',
});

const addressFields = ref<AddressFields>({
  street: '',
  barangay: '',
  city: '',
  lat: null,
  lng: null,
});

const addressLabel = ref('');
const addressLandmark = ref('');

const detailsTab: FullPageTab = {
  label: 'Details',
  value: 'details',
  title: isEdit ? 'Edit customer' : 'Add customer',
  subtitle: isEdit ? 'Update customer details' : 'Create a new customer account',
  schema: customerDetailsSchema,
  data: () => form,
};

const addressTab: FullPageTab = {
  label: 'Address',
  value: 'address',
  title: 'Default address',
  subtitle: 'Where the customer receives deliveries (optional)',
};

const tabs: FullPageTab[] = isEdit ? [detailsTab] : [detailsTab, addressTab];

const activeTab = ref<FullPageTab>(detailsTab);

const addressSummary = computed(() => [addressFields.value.street, addressFields.value.barangay, addressFields.value.city].filter(Boolean).join(', '));

watch(
  customer,
  (c) => {
    if (!c) {
      return;
    }

    form.name = c.name;
    form.phone = c.phone ?? '';
    form.type = c.type;
    form.notes = c.notes ?? '';
  },
  { immediate: true },
);

function cancel() {
  router.push(ROUTES.CUSTOMERS);
}

const { loading: saving, run: save } = useAsync(async () => {
  if (isEdit) {
    await updateCustomer(customerId!, {
      name: form.name,
      phone: form.phone || null,
      type: form.type,
      notes: form.notes || null,
    });
  } else {
    const { data: created } = await createCustomer({
      tenant_id: tenantId.value,
      branch_id: branchId.value,
      name: form.name,
      phone: form.phone || null,
      type: form.type,
      notes: form.notes || null,
    });

    if (created && addressSummary.value) {
      await createAddress({
        tenant_id: tenantId.value,
        branch_id: branchId.value,
        customer_id: created.id,
        label: addressLabel.value || 'Home',
        street: addressFields.value.street,
        barangay: addressFields.value.barangay,
        city: addressFields.value.city,
        landmark: addressLandmark.value || null,
        lat: addressFields.value.lat,
        lng: addressFields.value.lng,
        is_default: true,
      });
    }
  }

  toast.success(isEdit ? 'Customer updated' : 'Customer added');
  await router.push(ROUTES.CUSTOMERS);
});
</script>

<template>
  <BaseFullPageTabs
    v-model:tab="activeTab"
    :tabs="tabs"
    :loading="saving"
    :validate="zodErrors"
    :save-button-text="isEdit ? 'Update customer' : 'Add customer'"
    @close="cancel"
    @save="save"
  >
    <template #content="{ errors }">
      <div v-if="fetching" class="flex justify-center py-12">
        <BaseSpinner size="lg" />
      </div>

      <div v-else class="mx-auto max-w-2xl space-y-4 p-6">
        <BaseFullPageTabsHeader :title="activeTab.title" :subtitle="activeTab.subtitle" />

        <CustomerDetailsTab v-show="activeTab.value === 'details'" v-model="form" :errors="errors.details" />

        <CustomerAddressTab
          v-if="!isEdit"
          v-show="activeTab.value === 'address'"
          v-model:label="addressLabel"
          v-model:fields="addressFields"
          v-model:landmark="addressLandmark"
        />
      </div>
    </template>
  </BaseFullPageTabs>
</template>
