# PSGC Barangay Cascade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Mapbox-driven barangay search with a local PSGC dataset so all barangays appear instantly after city selection, while still using Mapbox to geocode the selected barangay's centroid for the map pin.

**Architecture:** Bundle a trimmed PSGC JSON (city code → barangay list) as a lazy-loaded static asset. City selection filters this list locally — no API call. When the user picks a barangay, forward-geocode `"<barangay>, <city>, Philippines"` via Mapbox to get lat/lng for the draggable pin. Street field stays Mapbox-driven and optional.

**Tech Stack:** Vue 3 + `<script setup>`, Mapbox GL JS, `@mapbox/mapbox-sdk` geocoding, PSGC public dataset (JSON), Vite dynamic import for lazy loading.

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `src/data/psgc-barangays.json` | Create | PSGC dataset: `{ [cityCode]: { cityName: string, barangays: string[] } }` |
| `src/helpers/geocode.ts` | Modify | Add `geocodeBarangay(barangay, city)` export |
| `src/components/Customer/AddressFieldCascade.vue` | Modify | Replace Mapbox brgy search with PSGC local filter + geocode on selection |

---

### Task 1: Prepare PSGC barangay dataset

**Files:**
- Create: `src/data/psgc-barangays.json`

The PSGC master list is published at `https://psgc.gitlab.io/api/`. We need a trimmed version shaped as:

```json
{
  "PH-DVO": {
    "cityName": "Davao City",
    "barangays": ["Agdao", "Agusa", ...]
  }
}
```

The key is the Mapbox `place` feature id (e.g. `place.123456`) — but Mapbox IDs are opaque and unstable. Instead, key by **normalized city name** (lowercase, trimmed) so we can match against what Mapbox returns.

Final shape:

```json
{
  "davao city": ["Agdao", "Agusa", "Bago Aplaya", ...],
  "general santos city": ["Apopong", "Baluan", ...]
}
```

- [ ] **Step 1: Download PSGC barangay data**

Run this in the project root to fetch and transform PSGC data into our format:

```bash
node -e "
const https = require('https');
function get(url) {
  return new Promise((res, rej) => {
    https.get(url, r => {
      let d = '';
      r.on('data', c => d += c);
      r.on('end', () => res(JSON.parse(d)));
      r.on('error', rej);
    });
  });
}
async function main() {
  const cities = await get('https://psgc.gitlab.io/api/cities-municipalities.json');
  const barangays = await get('https://psgc.gitlab.io/api/barangays.json');
  const result = {};
  for (const city of cities) {
    const key = city.name.toLowerCase().trim();
    result[key] = barangays
      .filter(b => b.cityCode === city.code || b.municipalityCode === city.code)
      .map(b => b.name)
      .sort();
  }
  require('fs').writeFileSync('src/data/psgc-barangays.json', JSON.stringify(result, null, 2));
  console.log('Done. Keys:', Object.keys(result).length);
}
main();
"
```

Expected output: `Done. Keys: 1634` (approx — all cities/municipalities in PH)

- [ ] **Step 2: Verify file created**

```bash
wc -c src/data/psgc-barangays.json
ls -lh src/data/psgc-barangays.json
```

Expected: file exists, size ~2–4 MB.

- [ ] **Step 3: Spot-check a few entries**

```bash
node -e "
const d = require('./src/data/psgc-barangays.json');
console.log('davao city:', d['davao city']?.slice(0, 5));
console.log('manila:', d['manila']?.slice(0, 5));
console.log('cebu city:', d['cebu city']?.slice(0, 5));
"
```

Expected: arrays of barangay name strings for each city.

- [ ] **Step 4: Commit**

```bash
git add src/data/psgc-barangays.json
git commit -m "feat: add PSGC barangay dataset"
```

---

### Task 2: Add `geocodeBarangay` to geocode helper

**Files:**
- Modify: `src/helpers/geocode.ts`

Add a function that forward-geocodes a barangay name + city name to get a centroid lat/lng via Mapbox.

- [ ] **Step 1: Add `geocodeBarangay` export to `src/helpers/geocode.ts`**

Add after the existing `searchStreets` function:

```ts
export async function geocodeBarangay(barangay: string, city: string): Promise<{ lat: number; lng: number } | null> {
  const query = `${barangay}, ${city}, Philippines`;
  const results = await baseSearch({ query, types: ['neighborhood', 'locality', 'place'] });
  const first = results[0];

  return first ? { lat: first.lat, lng: first.lng } : null;
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/admin/Documents/personal/water-refilling-station && npx vue-tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/helpers/geocode.ts
git commit -m "feat: add geocodeBarangay helper"
```

---

### Task 3: Rewrite barangay selection in AddressFieldCascade

**Files:**
- Modify: `src/components/Customer/AddressFieldCascade.vue`

Replace the Mapbox-driven `onBrgySearch` / `BaseSelect remote` pattern with:
1. Lazy-load `psgc-barangays.json` once on mount
2. When city is selected, filter barangays locally and populate `brgyOptions` immediately
3. User can still type to filter the list (local filter, not remote)
4. On barangay selection, call `geocodeBarangay` to get lat/lng → set on model

- [ ] **Step 1: Replace the script section of `AddressFieldCascade.vue`**

Replace the entire `<script setup>` block with:

```vue
<script setup lang="ts">
import type { Map as MapboxMap, Marker as MapboxMarker } from 'mapbox-gl';
import { searchCities, searchStreets, geocodeBarangay, type GeoFeature } from '@/helpers/geocode';

type AddressFields = {
  street: string;
  barangay: string;
  city: string;
  lat: number | null;
  lng: number | null;
};

const model = defineModel<AddressFields>({ required: true });

const cityId = ref<string | null>(null);
const brgyName = ref<string | null>(null);
const streetId = ref<string | null>(null);

const cityFeature = ref<GeoFeature>();
const streetFeature = ref<GeoFeature>();

const manualStreet = ref(false);
const manualStreetText = ref('');

const cityOptions = ref<Array<{ label: string; value: string }>>([]);
const brgyOptions = ref<Array<{ label: string; value: string }>>([]);
const streetOptions = ref<Array<{ label: string; value: string }>>([]);

const cityById = new Map<string, GeoFeature>();
const streetById = new Map<string, GeoFeature>();

const cityLoading = ref(false);
const brgyLoading = ref(false);
const streetLoading = ref(false);

// Lazy-load PSGC dataset once
let psgcData: Record<string, string[]> | null = null;
async function loadPsgc(): Promise<Record<string, string[]>> {
  if (!psgcData) {
    const mod = await import('@/data/psgc-barangays.json');
    psgcData = mod.default as Record<string, string[]>;
  }
  return psgcData;
}

async function onCitySearch(q: string) {
  if (!q.trim()) return;
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

async function onStreetSearch(q: string) {
  if (!q.trim()) return;
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
  brgyName.value = null;
  streetId.value = null;
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

  if (!cityFeature.value) return;

  brgyLoading.value = true;
  try {
    const psgc = await loadPsgc();
    const key = cityFeature.value.name.toLowerCase().trim();
    const barangays = psgc[key] ?? [];
    brgyOptions.value = barangays.map((name) => ({ label: name, value: name }));
  } finally {
    brgyLoading.value = false;
  }
});

watch(brgyName, async (name) => {
  streetId.value = null;
  streetFeature.value = undefined;
  streetOptions.value = [];
  model.value = {
    ...model.value,
    barangay: name ?? '',
    street: '',
    lat: null,
    lng: null,
  };

  if (!name || !cityFeature.value) return;

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
```

- [ ] **Step 2: Replace the template section**

Replace the entire `<template>` block with:

```vue
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
```

Key changes vs old template:
- Barangay `BaseSelect` no longer has `remote` or `@search` — it's now local searchable
- `v-model="brgyName"` (string) instead of `v-model="brgyId"`
- Street disabled when `!brgyName` instead of `!brgyFeature`

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd /Users/admin/Documents/personal/water-refilling-station && npx vue-tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/Customer/AddressFieldCascade.vue
git commit -m "feat: use PSGC local dataset for barangay selection with Mapbox geocode pin"
```

---

### Task 4: Manual smoke test

- [ ] **Step 1: Start dev server**

```bash
cd /Users/admin/Documents/personal/water-refilling-station && npm run dev
```

- [ ] **Step 2: Open Add Customer modal, test the flow**

1. Open Add Customer
2. In address section, type a city (e.g. "Davao") and select it
3. Verify barangay dropdown immediately shows a full list without typing
4. Type to filter barangays — list should narrow locally
5. Select a barangay — map pin should appear at barangay centroid
6. Drag the pin — verify it stays where dragged
7. Search a street — verify map pin moves to street location
8. Switch to manual street — verify pin stays at last position
9. Try a municipality (not just a city) — verify barangays load

- [ ] **Step 3: Commit if any fixes needed, otherwise done**
