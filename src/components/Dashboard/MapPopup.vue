<script setup lang="ts">
import { getAddressPhotoUrl } from '@/helpers/storage';
import { formatAddress } from '@/helpers/address';
import type { Option } from '@/types';

defineOptions({ name: 'DashboardMapPopup' });

type AddressRow = {
  id: string;
  label: string;
  street: string;
  barangay: string;
  city: string;
  landmark: string | null;
  lat: number | null;
  lng: number | null;
  needs_pin_review: boolean;
  photo_path: string | null;
};

type CustomerRow = {
  id: string;
  name: string;
  phone: string | null;
  area_id: string | null;
};

type AreaRow = {
  id: string;
  name: string;
};

type RiderRow = {
  id: string;
  full_name: string;
};

const props = defineProps<{
  address: AddressRow;
  customer: CustomerRow;
  area: AreaRow | null;
  activeRider: RiderRow | null;
  areaOptions: Option<string>[];
}>();

const emit = defineEmits<{
  'reassign-area': [areaId: string];
  'toggle-pin-review': [];
}>();

const photoUrl = computedAsync(() => (props.address.photo_path ? getAddressPhotoUrl(props.address.photo_path) : undefined));

const selectedAreaId = ref(props.customer.area_id ?? '');

watch(
  () => props.customer.area_id,
  (val) => {
    selectedAreaId.value = val ?? '';
  },
);

function onReassign(areaId: string | number | null | undefined) {
  if (typeof areaId === 'string' && areaId && areaId !== props.customer.area_id) {
    emit('reassign-area', areaId);
  }
}
</script>

<template>
  <div class="w-64 space-y-3 p-1">
    <img v-if="photoUrl" :src="photoUrl" alt="House photo" class="h-32 w-full rounded-md object-cover" />

    <div>
      <p class="text-sm font-semibold text-casual-navy">{{ customer.name }}</p>
      <p v-if="customer.phone" class="text-xs text-oslo">{{ customer.phone }}</p>
      <p class="mt-0.5 text-xs text-independence">{{ formatAddress(address) }}</p>
    </div>

    <div class="space-y-1 text-xs text-independence">
      <p>
        Area: <span class="font-medium">{{ area?.name ?? 'Unassigned' }}</span>
      </p>
      <p>
        Rider: <span class="font-medium">{{ activeRider?.full_name ?? 'None' }}</span>
      </p>
    </div>

    <div v-if="address.needs_pin_review" class="rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700">Needs pin verification</div>

    <div class="space-y-2">
      <BaseSelect v-model="selectedAreaId" label="Reassign area" :options="areaOptions" placeholder="Select area..." @update:model-value="onReassign" />
    </div>

    <button
      type="button"
      class="w-full rounded-md border border-sparkling-silver px-3 py-1.5 text-xs text-casual-navy hover:bg-bright-chrome"
      @click="emit('toggle-pin-review')"
    >
      {{ address.needs_pin_review ? 'Mark pin verified' : 'Ask rider to re-verify' }}
    </button>
  </div>
</template>
