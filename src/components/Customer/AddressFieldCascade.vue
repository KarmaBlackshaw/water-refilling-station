<script setup lang="ts">
import type { Map as MapboxMap, Marker as MapboxMarker } from 'mapbox-gl';
import type { Option } from '@/types';
import { searchCities, searchStreets, geocodeBarangay, type GeoFeature } from '@/helpers/geocode';

type AddressFields = {
  street: string;
  barangay: string;
  city: string;
  lat: number | null;
  lng: number | null;
};

const model = defineModel<AddressFields>({ required: true });

const cityId = ref<string>();
const brgyName = ref<string>();
const streetId = ref<string>();

const cityFeature = ref<GeoFeature>();
const streetFeature = ref<GeoFeature>();

const manualStreet = ref(false);
const manualStreetText = ref('');

const cityOptions = ref<Option<string>[]>([]);
const brgyOptions = ref<Option<string>[]>([]);
const streetOptions = ref<Option<string>[]>([]);

const cityById = new Map<string, GeoFeature>();
const streetById = new Map<string, GeoFeature>();

const cityLoading = ref(false);
const brgyLoading = ref(false);
const streetLoading = ref(false);

async function onCitySearch(q: string) {
  if (!q.trim()) {
    return;
  }

  cityLoading.value = true;
  try {
    const features = await searchCities(q);

    cityById.clear();
    features.forEach((f) => cityById.set(f.id, f));
    cityOptions.value = features.map((f) => ({ label: f.place_name, value: f.id }));
  } finally {
    cityLoading.value = false;
  }
}

let psgcData: Record<string, string[]> | null = null;

async function loadPsgc(): Promise<Record<string, string[]>> {
  if (!psgcData) {
    const mod: { default: Record<string, string[]> } = await import('@/data/psgc-barangays.json');

    psgcData = mod.default;
  }

  return psgcData;
}

function toPsgcKey(cityName: string): string {
  const lower = cityName.toLowerCase().trim();

  // PSGC uses "city of X" format; Mapbox returns "X City"
  if (lower.endsWith(' city')) {
    return `city of ${lower.slice(0, -5).trim()}`;
  }

  return lower;
}

async function onStreetSearch(q: string) {
  if (!q.trim()) {
    return;
  }

  streetLoading.value = true;
  try {
    const features = await searchStreets(q, cityFeature.value?.bbox);

    streetById.clear();
    features.forEach((f) => streetById.set(f.id, f));
    streetOptions.value = features.map((f) => ({ label: f.place_name, value: f.id }));
  } finally {
    streetLoading.value = false;
  }
}

watch(cityId, async (id) => {
  cityFeature.value = id ? cityById.get(id) : undefined;
  brgyName.value = undefined;
  streetId.value = undefined;
  streetFeature.value = undefined;
  brgyOptions.value = [];
  streetOptions.value = [];
  model.value = {
    ...model.value,
    city: cityFeature.value?.name ?? '',
    barangay: '',
    street: '',
    lat: null,
    lng: null,
  };

  if (!cityFeature.value) {
    return;
  }

  brgyLoading.value = true;
  try {
    const psgc = await loadPsgc();
    const key = toPsgcKey(cityFeature.value.name);
    const barangays = psgc[key] ?? psgc[cityFeature.value.name.toLowerCase().trim()] ?? [];

    brgyOptions.value = barangays.map((name) => ({ label: name, value: name }));
  } finally {
    brgyLoading.value = false;
  }
});

watch(brgyName, async (name) => {
  streetId.value = undefined;
  streetFeature.value = undefined;
  streetOptions.value = [];
  model.value = {
    ...model.value,
    barangay: name ?? '',
    street: '',
    lat: null,
    lng: null,
  };

  if (!name || !cityFeature.value) {
    return;
  }

  brgyLoading.value = true;
  try {
    const coords = await geocodeBarangay(name, cityFeature.value.name);

    if (coords) {
      model.value = { ...model.value, lat: coords.lat, lng: coords.lng };
    }
  } finally {
    brgyLoading.value = false;
  }
});

watch(streetId, (id) => {
  streetFeature.value = id ? streetById.get(id) : undefined;
  if (streetFeature.value) {
    model.value = {
      ...model.value,
      street: streetFeature.value.name,
      lat: streetFeature.value.lat,
      lng: streetFeature.value.lng,
    };
  }
});

watch(manualStreetText, (text) => {
  model.value = { ...model.value, street: text };
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
    <BaseSelect
      v-model="cityId"
      label="City"
      searchable
      remote
      :loading="cityLoading"
      :options="cityOptions"
      placeholder="Search city..."
      required
      @search="onCitySearch"
    />

    <BaseSelect
      v-model="brgyName"
      label="Barangay"
      searchable
      :loading="brgyLoading"
      :options="brgyOptions"
      :disabled="!cityFeature"
      placeholder="Select barangay..."
      required
    />

    <template v-if="!manualStreet">
      <BaseSelect
        v-model="streetId"
        label="Street / House #"
        searchable
        remote
        :loading="streetLoading"
        :options="streetOptions"
        :disabled="!brgyName"
        placeholder="Search street..."
        @search="onStreetSearch"
      />
      <button type="button" class="text-xs text-tampa underline" @click="manualStreet = true">Can't find your street? Enter manually</button>
    </template>

    <template v-else>
      <BaseInput v-model="manualStreetText" label="Street / House # (manual)" />
      <button type="button" class="text-xs text-tampa underline" @click="manualStreet = false">Use search instead</button>
    </template>

    <div v-if="model.lat != null && model.lng != null" ref="mapEl" class="h-[220px] w-full rounded-lg border border-sparkling-silver" />
    <p v-else class="text-xs text-oslo">Select a barangay to place a pin. Drag to adjust the exact location.</p>
  </div>
</template>
