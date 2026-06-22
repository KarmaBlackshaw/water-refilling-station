<script setup lang="ts">
import type { Map as MapboxMap, Marker as MapboxMarker } from 'mapbox-gl';
import type { AddressFields } from '@/constants/customer';
import type { Option } from '@/types';
import type { Street } from '@/types/database';
import { geocodeBarangay } from '@/helpers/geocode';
import { getStreets, createStreet } from '@/services/streets';

defineOptions({ name: 'CustomerAddressFieldCascade' });

const model = defineModel<AddressFields>({ required: true });

const auth = useAuthStore();

const cityKey = ref<string>();
const brgyName = ref<string>();
const streetId = ref<string>();

const selectedStreet = ref<Street>();

const cityOptions = ref<Option<string>[]>([]);
const brgyOptions = ref<Option<string>[]>([]);
const streetOptions = ref<Option<string>[]>([]);

const streetById = new Map<string, Street>();

const brgyLoading = ref(false);
const streetLoading = ref(false);

let psgcData: Record<string, string[]> | null = null;

async function loadPsgc(): Promise<Record<string, string[]>> {
  if (!psgcData) {
    const mod: { default: Record<string, string[]> } = await import('@/data/psgc-barangays.json');

    psgcData = mod.default;
  }

  return psgcData;
}

/** PSGC keys are normalized: "city of batac" / "laoag". Render as "Batac City" / "Laoag". */
function prettyCity(key: string): string {
  const isCity = key.startsWith('city of ');
  const base = isCity ? key.slice(8) : key;
  const titled = base.replace(/\b\w/g, (c) => c.toUpperCase());

  return isCity ? `${titled} City` : titled;
}

const cityLabel = computed(() => (cityKey.value ? prettyCity(cityKey.value) : ''));

onMounted(async () => {
  const psgc = await loadPsgc();

  cityOptions.value = Object.keys(psgc)
    .map((key) => ({ label: prettyCity(key), value: key }))
    .sort((a, b) => a.label.localeCompare(b.label));
});

function setStreets(rows: Street[]) {
  streetById.clear();
  rows.forEach((s) => streetById.set(s.id, s));
  streetOptions.value = rows.map((s) => ({ label: s.name, value: s.id }));
}

async function loadStreets(city: string, barangay: string) {
  streetLoading.value = true;
  try {
    const { data } = await getStreets(city, barangay);

    setStreets(data ?? []);
  } finally {
    streetLoading.value = false;
  }
}

async function onCreateStreet(name: string) {
  if (!brgyName.value) {
    return;
  }

  streetLoading.value = true;
  try {
    const { data } = await createStreet({
      city: cityLabel.value,
      barangay: brgyName.value,
      name,
      lat: model.value.lat,
      lng: model.value.lng,
      created_by: auth.profile?.id ?? null,
    });

    if (!data) {
      return;
    }

    streetById.set(data.id, data);
    streetOptions.value = [...streetOptions.value, { label: data.name, value: data.id }].sort((a, b) => a.label.localeCompare(b.label));
    streetId.value = data.id;
  } finally {
    streetLoading.value = false;
  }
}

watch(cityKey, async (key) => {
  brgyName.value = undefined;
  streetId.value = undefined;
  selectedStreet.value = undefined;
  brgyOptions.value = [];
  streetOptions.value = [];
  model.value = {
    ...model.value,
    city: cityLabel.value,
    barangay: '',
    street: '',
    lat: null,
    lng: null,
  };

  if (!key) {
    return;
  }

  const psgc = await loadPsgc();

  brgyOptions.value = (psgc[key] ?? []).map((name) => ({ label: name, value: name }));
});

watch(brgyName, async (name) => {
  streetId.value = undefined;
  selectedStreet.value = undefined;
  streetOptions.value = [];
  streetById.clear();
  model.value = {
    ...model.value,
    barangay: name ?? '',
    street: '',
    lat: null,
    lng: null,
  };

  if (!name || !cityKey.value) {
    return;
  }

  brgyLoading.value = true;
  try {
    const [coords] = await Promise.all([geocodeBarangay(name, cityLabel.value), loadStreets(cityLabel.value, name)]);

    if (coords) {
      model.value = { ...model.value, lat: coords.lat, lng: coords.lng };
    }
  } finally {
    brgyLoading.value = false;
  }
});

watch(streetId, (id) => {
  selectedStreet.value = id ? streetById.get(id) : undefined;
  const street = selectedStreet.value;

  if (street) {
    model.value = {
      ...model.value,
      street: street.name,
      ...(street.lat != null && street.lng != null ? { lat: street.lat, lng: street.lng } : {}),
    };
  }
});

const mapEl = ref<HTMLDivElement | null>(null);
let map: MapboxMap | null = null;
let marker: MapboxMarker | null = null;

watch(
  () => [model.value.lat, model.value.lng],
  async ([lat, lng]) => {
    if (lat == null || lng == null) {
      map?.remove();
      map = null;
      marker = null;
      return;
    }

    if (!map) {
      const mapbox = (await import('mapbox-gl')).default;

      await import('mapbox-gl/dist/mapbox-gl.css');
      mapbox.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;
      map = new mapbox.Map({
        container: mapEl.value!,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [lng, lat],
        zoom: 14,
      });
      marker = new mapbox.Marker({ draggable: true }).setLngLat([lng, lat]).addTo(map);
      marker.on('dragend', () => {
        const { lat: nlat, lng: nlng } = marker!.getLngLat();

        model.value = { ...model.value, lat: nlat, lng: nlng };
      });
    } else {
      map.flyTo({ center: [lng, lat], zoom: 14 });
      marker!.setLngLat([lng, lat]);
    }
  },
);

onBeforeUnmount(() => {
  map?.remove();
  map = null;
  marker = null;
});
</script>

<template>
  <div class="space-y-3">
    <BaseSelect v-model="cityKey" label="City" searchable :options="cityOptions" placeholder="Search city..." required />

    <BaseSelect
      v-model="brgyName"
      label="Barangay"
      searchable
      :loading="brgyLoading"
      :options="brgyOptions"
      :disabled="!cityKey"
      placeholder="Select barangay..."
      required
    />

    <BaseSelect
      v-model="streetId"
      label="Street"
      searchable
      creatable
      :loading="streetLoading"
      :options="streetOptions"
      :disabled="!brgyName"
      placeholder="Select street..."
      search-placeholder="Search or type a new street..."
      helper-text="Not listed? Type the name and pick &ldquo;Add&rdquo; to save it."
      @create="onCreateStreet"
    />

    <div v-if="model.lat != null && model.lng != null" ref="mapEl" class="h-55 w-full rounded-lg border border-sparkling-silver" />
    <p v-else class="text-xs text-oslo">Select a barangay to place a pin. Drag to adjust the exact location.</p>
  </div>
</template>
