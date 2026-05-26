<script setup lang="ts">
import type { Map as MapboxMap, Marker as MapboxMarker } from 'mapbox-gl';
import { searchCities, searchBarangays, searchStreets, type GeoFeature } from '@/helpers/geocode';

type AddressFields = {
  street: string;
  barangay: string;
  city: string;
  lat: number | null;
  lng: number | null;
};

const model = defineModel<AddressFields>({ required: true });

const cityId = ref<string | null>(null);
const brgyId = ref<string | null>(null);
const streetId = ref<string | null>(null);

const cityFeature = ref<GeoFeature>();
const brgyFeature = ref<GeoFeature>();
const streetFeature = ref<GeoFeature>();

const manualStreet = ref(false);
const manualStreetText = ref('');

const cityOptions = ref<Array<{ label: string; value: string }>>([]);
const brgyOptions = ref<Array<{ label: string; value: string }>>([]);
const streetOptions = ref<Array<{ label: string; value: string }>>([]);

const cityById = new Map<string, GeoFeature>();
const brgyById = new Map<string, GeoFeature>();
const streetById = new Map<string, GeoFeature>();

const cityLoading = ref(false);
const brgyLoading = ref(false);
const streetLoading = ref(false);

async function onCitySearch(q: string) {
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

async function onBrgySearch(q: string) {
  brgyLoading.value = true;
  try {
    const features = await searchBarangays(q, cityFeature.value?.bbox);

    brgyById.clear();
    features.forEach((f) => brgyById.set(f.id, f));
    brgyOptions.value = features.map((f) => ({ label: f.place_name, value: f.id }));
  } finally {
    brgyLoading.value = false;
  }
}

async function onStreetSearch(q: string) {
  streetLoading.value = true;
  try {
    const features = await searchStreets(q, brgyFeature.value?.bbox);

    streetById.clear();
    features.forEach((f) => streetById.set(f.id, f));
    streetOptions.value = features.map((f) => ({ label: f.place_name, value: f.id }));
  } finally {
    streetLoading.value = false;
  }
}

watch(cityId, (id) => {
  cityFeature.value = id ? cityById.get(id) : undefined;
  brgyId.value = null;
  streetId.value = null;
  brgyFeature.value = undefined;
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
});

watch(brgyId, (id) => {
  brgyFeature.value = id ? brgyById.get(id) : undefined;
  streetId.value = null;
  streetFeature.value = undefined;
  streetOptions.value = [];
  model.value = {
    ...model.value,
    barangay: brgyFeature.value?.name ?? '',
    street: '',
    lat: null,
    lng: null,
  };
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
  model.value = { ...model.value, street: text, lat: null, lng: null };
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
        zoom: 17,
      });
      marker = new mapbox.Marker({ draggable: true }).setLngLat([lng, lat]).addTo(map);
      marker.on('dragend', () => {
        const { lat: nlat, lng: nlng } = marker!.getLngLat();

        model.value = { ...model.value, lat: nlat, lng: nlng };
      });
    } else {
      map.flyTo({ center: [lng, lat], zoom: 17 });
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
      v-model="brgyId"
      label="Barangay"
      searchable
      remote
      :loading="brgyLoading"
      :options="brgyOptions"
      :disabled="!cityFeature"
      placeholder="Search barangay..."
      required
      @search="onBrgySearch"
    />

    <template v-if="!manualStreet">
      <BaseSelect
        v-model="streetId"
        label="Street / House #"
        searchable
        remote
        :loading="streetLoading"
        :options="streetOptions"
        :disabled="!brgyFeature"
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
    <p v-else class="text-xs text-oslo">Pick a street from the suggestions to refine the pin.</p>
  </div>
</template>
