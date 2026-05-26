# Customer Real Addresses + Mapbox Dashboard

Date: 2026-05-25
Status: Draft — awaiting user spec review

## Goals

- Replace free-text customer address with structured fields (street, barangay, city, landmark) for better data + future geocoding accuracy.
- Each address has nullable `lat`/`lng` (set by a separate rider app, out of scope here) plus a `needs_pin_review` flag.
- Each address can have one optional house photo, stored in a private Supabase Storage bucket and served via signed URLs.
- Dashboard gets a Mapbox map of all branch customer addresses with lat/lng, color-coded by the area's active rider, filterable by area + rider + needs-pin.
- Admin can reassign a customer's area and toggle the needs-pin flag from a pin popup.

## Roles

- **Admin / cashier** (this app): enter structured address + photo + landmark; view dashboard map; reassign area; toggle needs-pin.
- **Rider** (separate app, out of scope): sets `lat`/`lng` and flips `needs_pin_review` to `false`.

## Non-goals

- Rider GPS / live tracking / route optimization.
- Marker clustering on the map.
- Storage orphan-cleanup background job.
- Drawing area polygons / area boundaries.

## `needs_pin_review` semantics

The flag means "coords are approximate or missing — rider should refine":

- `true` when coords are NULL (no match) OR coords came from admin-side Mapbox geocoding (approximate).
- `false` only when the rider saves their actual GPS-precise coords via the separate rider app.

Admin can re-flip to `true` from a map popup ("ask rider to re-verify").

## 1. Schema migration

```sql
alter table customer_addresses
  add column street text not null default '',
  add column barangay text not null default '',
  add column city text not null default '',
  add column landmark text,
  add column needs_pin_review boolean not null default true,
  add column photo_path text;

-- backfill from the legacy single column
update customer_addresses set street = address_line where street = '';
update customer_addresses set needs_pin_review = false
  where lat is not null and lng is not null;

-- drop legacy column (after all callers migrated in the same PR)
alter table customer_addresses drop column address_line;
```

Then run `npm run db:types` to regenerate `src/types/database/supabase.ts`.

### Backfill semantics

- `street` receives whatever was in `address_line` so existing data isn't lost. Barangay/city default to `''` until edited.
- `needs_pin_review` defaults `true`; existing rows that already have coordinates are flipped to `false` during backfill.
- `photo_path` starts `NULL` for all existing rows.

## 2. Storage bucket

- Private Supabase Storage bucket: `customer-address-photos`.
- Path convention: `<tenant_id>/<branch_id>/<address_id>/<uuid>.jpg`.
- RLS: authed users can `select|insert|update|delete` only where the path's first folder segment matches their `tenant_id`. Express via `(storage.foldername(name))[1] = auth.jwt() ->> 'tenant_id'` (or a `users` join, whichever matches existing project pattern).
- Access via `createSignedUrl(path, 3600)` cached in memory ~50min.

## 3. New helpers

### `src/helpers/address.ts`

```ts
import type { CustomerAddress } from '@/types/database';

export function formatAddress(a: Pick<CustomerAddress, 'street' | 'barangay' | 'city' | 'landmark'>): string {
  const base = [a.street, a.barangay, a.city].filter(Boolean).join(', ');
  return a.landmark ? `${base} (${a.landmark})` : base;
}
```

### `src/helpers/geocode.ts`

Thin wrapper over `@mapbox/mapbox-sdk` Geocoding v5 client. Each search function is wrapped in `useMemoize` from `@vueuse/core` so re-opening the dropdown doesn't re-hit the API.

```ts
import { useMemoize } from '@vueuse/core';
import mbxClient from '@mapbox/mapbox-sdk';
import mbxGeocoding, { type GeocodeFeature, type GeocodeQueryType } from '@mapbox/mapbox-sdk/services/geocoding';

const baseClient = mbxClient({ accessToken: import.meta.env.VITE_MAPBOX_TOKEN });
const geocoder = mbxGeocoding(baseClient);

export type GeoFeature = {
  id: string;
  name: string;          // short name (e.g. "Quezon City")
  place_name: string;    // full path (e.g. "Quezon City, Metro Manila, Philippines")
  lat: number;
  lng: number;
  bbox?: [number, number, number, number]; // [minLng, minLat, maxLng, maxLat]
};

type SearchArgs = {
  query: string;
  types: GeocodeQueryType[];
  bbox?: [number, number, number, number];
};

const baseSearch = useMemoize(
  async ({ query, types, bbox }: SearchArgs): Promise<GeoFeature[]> => {
    const res = await geocoder.forwardGeocode({
      query,
      countries: ['ph'],
      types,
      bbox,
      limit: 8,
    }).send();
    return (res.body.features as GeocodeFeature[]).map((f) => ({
      id: f.id,
      name: f.text,
      place_name: f.place_name,
      lng: f.center[0],
      lat: f.center[1],
      bbox: f.bbox as GeoFeature['bbox'],
    }));
  },
  { getKey: ({ query, types, bbox }) => `${types.join(',')}|${bbox?.join(',') ?? ''}|${query}` },
);

export function searchCities(q: string) {
  if (!q.trim()) return Promise.resolve([]);
  return baseSearch({ query: q, types: ['place', 'locality'] });
}

export function searchBarangays(q: string, cityBbox?: GeoFeature['bbox']) {
  if (!q.trim()) return Promise.resolve([]);
  return baseSearch({ query: q, types: ['neighborhood', 'locality'], bbox: cityBbox });
}

export function searchStreets(q: string, brgyBbox?: GeoFeature['bbox']) {
  if (!q.trim()) return Promise.resolve([]);
  return baseSearch({ query: q, types: ['address'], bbox: brgyBbox });
}
```

Deps to add: `@mapbox/mapbox-sdk` and `@types/mapbox__mapbox-sdk` (dev).

### `src/helpers/storage.ts`

```ts
import imageCompression from 'browser-image-compression';
import { supabase } from '@/helpers/supabase';

const BUCKET = 'customer-address-photos';
const cache = new Map<string, { url: string; exp: number }>();

export async function uploadAddressPhoto(file: File, tenantId: string, branchId: string, addressId: string): Promise<string> {
  const compressed = await imageCompression(file, { maxSizeMB: 0.3, maxWidthOrHeight: 1280, useWebWorker: true });
  const path = `${tenantId}/${branchId}/${addressId}/${crypto.randomUUID()}.jpg`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, compressed, { contentType: 'image/jpeg', upsert: false });
  if (error) throw error;
  return path;
}

export async function deleteAddressPhoto(path: string): Promise<void> {
  await supabase.storage.from(BUCKET).remove([path]);
}

export async function getAddressPhotoUrl(path: string): Promise<string> {
  const c = cache.get(path);
  if (c && c.exp > Date.now() + 60_000) return c.url;
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 3600);
  if (error) throw error;
  cache.set(path, { url: data.signedUrl, exp: Date.now() + 3_600_000 });
  return data.signedUrl;
}
```

## 4. Service updates (`src/services/customers.ts`)

```ts
export function listAddresses(customerId: string) {
  return supabase
    .from('customer_addresses')
    .select('id, label, street, barangay, city, landmark, lat, lng, is_default, needs_pin_review, photo_path, deleted_at')
    .eq('customer_id', customerId)
    .is('deleted_at', null)
    .order('is_default', { ascending: false });
}

export function createAddress(data: {
  tenant_id: string;
  branch_id: string;
  customer_id: string;
  label: string;
  street: string;
  barangay: string;
  city: string;
  landmark?: string | null;
  lat?: number | null;
  lng?: number | null;
  is_default?: boolean;
  needs_pin_review?: boolean;
  photo_path?: string | null;
}) {
  return supabase.from('customer_addresses').insert(data).select().single();
}

export function updateAddress(
  id: string,
  data: Partial<
    Pick<
      CustomerAddress,
      'label' | 'street' | 'barangay' | 'city' | 'landmark' | 'lat' | 'lng' | 'is_default' | 'needs_pin_review' | 'photo_path'
    >
  >,
) {
  return supabase.from('customer_addresses').update(data).eq('id', id).select().single();
}

export function listAddressesForMap(tenantId: string, branchId: string) {
  return supabase
    .from('customer_addresses')
    .select(`
      id, label, street, barangay, city, landmark, lat, lng,
      needs_pin_review, photo_path,
      customer:customers!customer_id(id, name, phone, area_id, area:areas(id, name, primary_rider_id))
    `)
    .eq('tenant_id', tenantId)
    .eq('branch_id', branchId)
    .is('deleted_at', null);
}
```

`listCustomers` and `getCustomer` selects also updated to include the new columns and drop `address_line`.

## 5. Shared file uploader: `src/components/Base/BaseFileUpload.vue`

Generic component, lives under `Base/` so it's auto-registered by the existing `index-generator` barrel and auto-imported.

```vue
<script setup lang="ts">
import { useDropZone, useFileDialog, useObjectUrl } from '@vueuse/core';

const file = defineModel<File | undefined>('file');
const remove = defineModel<boolean>('remove', { default: false });

const {
  accept = 'image/*',
  maxSizeMb = 5,
  label,
  helperText,
  existingUrl,
} = defineProps<{
  accept?: string;
  maxSizeMb?: number;
  label?: string;
  helperText?: string;
  existingUrl?: string;
}>();

const emit = defineEmits<{ error: [message: string] }>();

const pickedUrl = useObjectUrl(file);
const previewUrl = computed(() => {
  if (pickedUrl.value) return pickedUrl.value;
  if (remove.value) return undefined;
  return existingUrl;
});

const fallbackHelper = computed(() => helperText ?? `Max size: ${maxSizeMb}MB`);

function handle(f: File | null | undefined) {
  if (!f) return;
  const sizeMb = f.size / (1024 * 1024);
  if (sizeMb > maxSizeMb) {
    emit('error', `File too large (${sizeMb.toFixed(1)}MB). Max ${maxSizeMb}MB.`);
    return;
  }
  file.value = f;
  remove.value = false;
}

const { open, onChange } = useFileDialog({ accept, multiple: false });
onChange((files) => handle(files?.[0]));

const dropZoneEl = ref<HTMLDivElement | null>(null);
const { isOverDropZone } = useDropZone(dropZoneEl, {
  onDrop: (files) => handle(files?.[0]),
  dataTypes: accept === '*' ? undefined : [accept],
});

function clearFile() {
  file.value = undefined;
  remove.value = true;
}
</script>

<template>
  <div>
    <p v-if="label" class="mb-1 text-sm font-medium text-casual-navy">{{ label }}</p>

    <div
      ref="dropZoneEl"
      class="relative flex aspect-video w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed transition-colors"
      :class="isOverDropZone ? 'border-turquoise-stone bg-bright-chrome' : 'border-sparkling-silver bg-bright-chrome/50 hover:bg-bright-chrome'"
      role="button"
      tabindex="0"
      @click="open()"
      @keydown.enter.prevent="open()"
      @keydown.space.prevent="open()"
    >
      <img v-if="previewUrl" :src="previewUrl" alt="Preview" class="h-full w-full rounded-lg object-cover" />
      <template v-else>
        <div class="flex size-12 items-center justify-center rounded-full border border-sparkling-silver bg-white text-oslo">
          <IconPlus class="size-5" />
        </div>
        <p class="text-sm font-semibold text-casual-navy">Drop your image here or click to browse</p>
        <p class="text-xs text-oslo">{{ fallbackHelper }}</p>
      </template>
    </div>

    <div v-if="previewUrl" class="mt-2 flex gap-2">
      <BaseButton variant="independence" size="sm" @click.stop="open()">Replace</BaseButton>
      <BaseButton variant="independence" size="sm" class="text-blaze-red" @click.stop="clearFile">Remove</BaseButton>
    </div>
  </div>
</template>
```

### Behavior notes

- `v-model:file` exposes the picked `File` to the parent (no upload happens inside).
- `v-model:remove` flips `true` when the user clears an existing image so the parent knows to delete the existing `photo_path` on save.
- `existingUrl` is the (already resolved) signed URL for the existing photo when editing; the parent resolves it before passing.
- `error` event fires on oversize files; parent surfaces via toast.
- Compression and upload happen in `helpers/storage.ts`, not in the component.

## 6. Address cascade component: `components/Customer/AddressFieldCascade.vue`

Owns the three remote-search `BaseSelect`s for city → barangay → street plus a "Can't find street? Enter manually" fallback. Emits a single object back to the parent form.

```ts
type AddressFields = {
  street: string;
  barangay: string;
  city: string;
  lat: number | null;
  lng: number | null;
};

const model = defineModel<AddressFields>({ required: true });

// BaseSelect v-models a single string id, so we track picked ids separately.
const cityId = ref<string | null>(null);
const brgyId = ref<string | null>(null);
const streetId = ref<string | null>(null);

// Resolved features (carry bbox + lat/lng + canonical name).
const cityFeature = ref<GeoFeature>();
const brgyFeature = ref<GeoFeature>();
const streetFeature = ref<GeoFeature>();

const manualStreet = ref(false); // true → render BaseInput instead of street select
const manualStreetText = ref('');

// Options bound to BaseSelect.
const cityOptions = ref<Array<{ label: string; value: string }>>([]);
const brgyOptions = ref<Array<{ label: string; value: string }>>([]);
const streetOptions = ref<Array<{ label: string; value: string }>>([]);

// id → feature lookup for resolving picks back to coords/bbox/name.
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
// onBrgySearch / onStreetSearch mirror the city handler, passing parent bbox.

// When city pick changes, resolve the feature, reset children, and patch model.
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

function onManualStreetChange(text: string) {
  model.value = { ...model.value, street: text, lat: null, lng: null };
}
```

> **Note on the model shape:** because `BaseSelect` v-models a single primitive, the cascade tracks Mapbox feature ids in local `cityId`/`brgyId`/`streetId` refs and projects canonical `name` strings + lat/lng into the parent `model` whenever a pick changes. The persisted shape stays simple plain text + nullable coords; the cascade chains bbox filters internally via the local feature refs.

Template:

```vue
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
  <button type="button" class="text-xs text-turquoise-stone underline" @click="manualStreet = true">
    Can't find your street? Enter manually
  </button>
</template>

<template v-else>
  <BaseInput
    :model-value="manualStreetText"
    label="Street / House # (manual)"
    @update:model-value="(v) => { manualStreetText = v; onManualStreetChange(v); }"
  />
  <button type="button" class="text-xs text-turquoise-stone underline" @click="manualStreet = false">
    Use search instead
  </button>
</template>
```

When the user toggles "manual" → `lat`/`lng` clear back to NULL; when they return to search and pick a street, coords repopulate.

### Drag-to-pin mini-map

Below the cascade selects, render a small Mapbox map (`h-[220px]`) with a single draggable marker representing `model.lat` / `model.lng`. Lets admin nudge the pin to the exact spot when the geocoder gets close but not exact.

Behavior:

- **No coords yet** (manual street or geocoder miss): map is hidden, replaced by a one-line hint `"Pick a street from the suggestions to refine the pin"`.
- **Coords present:** map renders, centered on `[lng, lat]`, zoom 17, marker draggable.
- **On marker `dragend`:** read `marker.getLngLat()`, write `lat`/`lng` back into `model`. No API call, no `needs_pin_review` change (admin's drag is still considered approximate — see flag semantics).
- **When user re-picks a street from the cascade:** marker animates to new coords via `flyTo`.
- **When user toggles manual street fallback:** marker hides (coords NULL).

Implementation skeleton:

```ts
const mapEl = ref<HTMLDivElement | null>(null);
let map: import('mapbox-gl').Map | null = null;
let marker: import('mapbox-gl').Marker | null = null;

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
      map = new mapbox.Map({ container: mapEl.value!, style: 'mapbox://styles/mapbox/streets-v12', center: [lng, lat], zoom: 17 });
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
```

Template addition (after the manual-street toggle block):

```vue
<div v-if="model.lat != null && model.lng != null" ref="mapEl" class="h-[220px] w-full rounded-lg border border-sparkling-silver" />
<p v-else class="text-xs text-oslo">Pick a street from the suggestions to refine the pin.</p>
```

Note: `needs_pin_review` checkbox stays in the parent form. Admin dragging the pin does not auto-flip the flag — admin isn't physically at the customer's house, so the pin remains "approximate" until the rider confirms on-site. Admin can manually uncheck the box if they verified the location with the customer.

## 7. Address form: `components/Customer/CustomerAddressFormModal.vue`

Form state:

```ts
const form = reactive<{
  label: string;
  fields: { street: string; barangay: string; city: string; lat: number | null; lng: number | null };
  landmark: string;
  is_default: boolean;
  needs_pin_review: boolean;
}>({
  label: '',
  fields: { street: '', barangay: '', city: '', lat: null, lng: null },
  landmark: '',
  is_default: false,
  needs_pin_review: true,
});

const photoFile = ref<File>();
const removePhoto = ref(false);
const existingPhotoUrl = computedAsync(
  () => (address?.photo_path ? getAddressPhotoUrl(address.photo_path) : undefined),
);
```

Template:

```vue
<BaseInput v-model="form.label" label="Label (e.g. Home, Office)" required />

<AddressFieldCascade v-model="form.fields" />

<BaseInput v-model="form.landmark" label="Landmark (optional)" />

<BaseFileUpload
  v-model:file="photoFile"
  v-model:remove="removePhoto"
  label="House photo"
  accept="image/*"
  :max-size-mb="5"
  :existing-url="existingPhotoUrl"
  @error="toast.error"
/>

<BaseCheckbox v-model="form.is_default" label="Set as default address" />
<BaseCheckbox v-model="form.needs_pin_review" label="Needs rider to verify GPS pin" />
```

Validation: `label`, `street`, `barangay`, `city` required. `landmark`, `photo`, `lat`, `lng`, `needs_pin_review` optional.

Edit mode: when opening with an existing address, prefill `form.fields` with stored `street`/`barangay`/`city`/`lat`/`lng`. The cascade can't restore Mapbox `bbox` history for chained search, so the user sees the saved text already populated; if they want to re-pick from Mapbox they re-search the city first.

Submit emit:

```ts
emit('submit', {
  payload: {
    label: form.label,
    street: form.fields.street,
    barangay: form.fields.barangay,
    city: form.fields.city,
    landmark: form.landmark || null,
    lat: form.fields.lat,
    lng: form.fields.lng,
    is_default: form.is_default,
    needs_pin_review: form.needs_pin_review,
  },
  photoFile: photoFile.value,
  removePhoto: removePhoto.value,
});
```

## 7. Submit flow (parent: `pages/customers/[id].vue`)

```ts
async function saveAddress(payload: AddrPayload, photoFile?: File, removePhoto?: boolean) {
  const isNew = !editingAddr.value;
  const saved = isNew
    ? await createAddress({ ...payload, tenant_id, branch_id, customer_id })
    : await updateAddress(editingAddr.value!.id, payload);

  const row = saved.data!;
  let nextPath: string | null = row.photo_path;

  if (removePhoto && nextPath) {
    await deleteAddressPhoto(nextPath);
    nextPath = null;
  }
  if (photoFile) {
    if (row.photo_path) await deleteAddressPhoto(row.photo_path);
    nextPath = await uploadAddressPhoto(photoFile, tenant_id, branch_id, row.id);
  }
  if (nextPath !== row.photo_path) {
    await updateAddress(row.id, { photo_path: nextPath });
  }
}
```

Wrapped in `useAsync` per project convention. Errors bubble to toast.

### Soft-delete + photos

When `softDeleteAddress` runs, the photo stays in Storage. Acceptable for v1. A hard-delete path, if added later, must call `deleteAddressPhoto` first.

### Photo upload failure

If `uploadAddressPhoto` or `deleteAddressPhoto` throws after the address row is already saved, the row persists with the previous `photo_path` and the error is surfaced via toast. The user can retry from the same form. No rollback of the row itself.

## 8. Caller migration (same PR as `address_line` drop)

Every reference to `address_line` is replaced with `formatAddress(a)`:

- `src/components/Booking/BookingNewModal.vue:70` — `` `${a.label} — ${formatAddress(a)}` ``.
- `src/components/Booking/BookingTemplateFormModal.vue` — same shape.
- `src/pages/customers/[id].vue` — address list rows render `formatAddress(addr)` + thumbnail (signed URL) when `photo_path` is set.
- Any other `address_line` reference flagged by grep at implementation time.
- `src/types/database/supabase.ts` regenerated via `npm run db:types` (no manual edit).

## 9. Dashboard map widget

### Dependencies

- New runtime: `mapbox-gl`, `@mapbox/mapbox-sdk`.
- New dev: `@types/mapbox-gl`, `@types/mapbox__mapbox-sdk`.
- `VITE_MAPBOX_TOKEN` env var (public `pk.*` token, restricted to localhost + production domain in Mapbox dashboard).
- `env.d.ts` extended:
  ```ts
  interface ImportMetaEnv {
    readonly VITE_MAPBOX_TOKEN: string;
  }
  ```

### File: `src/components/Dashboard/DashboardMap.vue`

```ts
const auth = useAuthStore();
const { tenantId, branchId } = storeToRefs(auth);

const { data: addrsRes, loading } = useAsync(
  () => listAddressesForMap(tenantId.value, branchId.value),
  { immediate: true },
);
const allAddrs = computed(() => addrsRes.value?.data ?? []);
const mappable = computed(() => allAddrs.value.filter((a) => a.lat != null && a.lng != null));
const needsPinList = computed(() => allAddrs.value.filter((a) => a.lat == null || a.lng == null || a.needs_pin_review));

const selectedAreaIds = ref<string[]>([]);
const selectedRiderIds = ref<string[]>([]);
const needsPinOnly = ref(false);

const visiblePins = computed(() =>
  mappable.value.filter((a) => {
    if (selectedAreaIds.value.length && !selectedAreaIds.value.includes(a.customer.area_id ?? '')) return false;
    const riderId = a.customer.area?.primary_rider_id ?? null;
    if (selectedRiderIds.value.length && !selectedRiderIds.value.includes(riderId ?? '')) return false;
    if (needsPinOnly.value && !a.needs_pin_review) return false;
    return true;
  }),
);
```

### Mapbox lifecycle

```ts
const mapEl = ref<HTMLDivElement | null>(null);
let map: import('mapbox-gl').Map | null = null;
const markers = new Map<string, import('mapbox-gl').Marker>();

onMounted(async () => {
  if (!import.meta.env.VITE_MAPBOX_TOKEN) return;
  const mapbox = (await import('mapbox-gl')).default;
  await import('mapbox-gl/dist/mapbox-gl.css');
  mapbox.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;
  map = new mapbox.Map({
    container: mapEl.value!,
    style: 'mapbox://styles/mapbox/streets-v12',
    center: [121.0, 14.6],
    zoom: 11,
  });
  map.on('load', () => {
    renderPins();
    fitToVisible();
  });
});
onBeforeUnmount(() => {
  map?.remove();
  map = null;
  markers.clear();
});
watch(visiblePins, renderPins);
```

`renderPins()` diffs existing markers against `visiblePins` (keyed by `address.id`):
- Add new markers for newly visible addresses.
- Update color on markers whose rider changed.
- Remove markers for addresses no longer visible.
- Each marker is a small `<div>` with `background: riderColor(riderId)` and an `!` badge when `needs_pin_review`.

`riderColor(id: string | null)` hashes `id` into a fixed 8-color palette; `null` → gray. Result cached in a `Map`.

`fitToVisible()` is called once on initial map load when `visiblePins.length > 0`; subsequent filter changes do NOT refit, preserving user's pan/zoom.

### Popup (per-marker)

Built on click via `new mapbox.Popup().setDOMContent(node)`. The node is rendered by a small Vue component (`DashboardMapPopup.vue`) mounted via `createApp(...).mount(node)` so we can reuse `computedAsync` for the thumbnail signed URL and standard `<BaseSelect>` for area reassignment:

- Thumbnail: `const photoUrl = computedAsync(() => photo_path ? getAddressPhotoUrl(photo_path) : undefined)`.
- Customer name, `formatAddress(a)`.
- Current area name, current active rider's name.
- `<BaseSelect>` to reassign area → `updateCustomer(customerId, { area_id })`. On success, local state is patched and the next `renderPins` tick updates the marker color.
- Button to toggle `needs_pin_review` via `updateAddress`.

### Side panel (right rail, ~280px)

```
Filters
  Areas    [multiselect chips]
  Riders   [multiselect chips with color dots]
  [ ] Needs pin review only

Legend
  ● Rider A   ● Rider B   ● Unassigned

Needs pin (N)  ▾
  → expandable list; clicking a row opens that customer's detail page
```

### Layout in `src/pages/dashboard.vue`

`<DashboardMap class="h-[400px]" />` inserted as a new full-width row below the existing KPI/greeting block. Map area uses `flex-1`; side panel has fixed width. Below `md` breakpoint, the panel collapses to a horizontal filter bar above the map.

### Role gating (admin only)

The map is admin-only. A cashier dashboard doesn't exist yet, but the gate is added now so the map stays hidden when cashier UI ships:

```vue
<script setup lang="ts">
const auth = useAuthStore();
const { userRole } = storeToRefs(auth);
</script>

<template>
  ...
  <DashboardMap v-if="userRole === 'admin'" class="h-[400px]" />
  ...
</template>
```

Gate lives in `pages/dashboard.vue` (not inside `DashboardMap`) so the component file stays role-agnostic and the (lazy) `mapbox-gl` chunk isn't even requested for non-admin roles.

### Fallback states

- No `VITE_MAPBOX_TOKEN` → `BaseEmptyState` with title "Map unavailable" and helper text "Set VITE_MAPBOX_TOKEN".
- Fetch error → empty state with a retry button (wires to `run` from `useAsync`).
- Zero mappable, some needs-pin → map area shows empty state, needs-pin list still visible in the side panel.

## 10. Type updates

Regenerated by `npm run db:types`. `CustomerAddress` automatically gains `street`, `barangay`, `city`, `landmark`, `needs_pin_review`, `photo_path` and loses `address_line`. No manual edits to `src/types/database/supabase.ts`.

## 11. Bundle / perf

- `mapbox-gl` (~700KB raw / ~200KB gzip) is dynamically imported in both consumers: `DashboardMap.vue` and `AddressFieldCascade.vue` (mini-map). First page that triggers the import pays once; subsequent uses hit the module cache.
- `mapbox-gl/dist/mapbox-gl.css` is also dynamically imported in both places.
- `@mapbox/mapbox-sdk` (~30KB) is imported eagerly inside `helpers/geocode.ts` — small enough to ship in the main bundle.
- Geocoding helper memoizes responses via `useMemoize` keyed by `types|bbox|query`.
- Signed-URL cache (manual `Map` with ~50min TTL) prevents re-signing on every map render / popup open.
- Marker diffing (vs nuke/rebuild) keeps Mapbox state stable across filter toggles on the dashboard map.

## 12. Testing / verification

Automated:

- `npm run type-check` clean.
- `npm run lint` clean (oxlint + eslint).

Manual:

- City → barangay → street cascade: each search hits Mapbox, child select disables until parent picked, picking street populates lat/lng.
- Toggle "Enter manually" on street → field swaps to free-text, lat/lng clear to NULL, mini-map hides.
- After picking a street, mini-map shows draggable marker; dragging updates `model.lat`/`lng` (verify via DB row after save).
- Create new address with all required fields + photo → row persists with cascade-derived coords + photo in Storage.
- Create address with manual street fallback → row persists with NULL coords; appears in "Needs pin" panel only.
- Edit address: replace photo (old object removed), remove photo (column cleared), toggle needs-pin.
- Soft-delete address → disappears from map and customer detail list.
- Booking new modal address dropdown shows `label — street, brgy, city` correctly.
- Dashboard map renders pins for addresses with coords; missing-token state appears when env var unset.
- Filter map by area, by rider, by needs-pin → marker set updates without remount.
- Reassign area from pin popup → marker color updates after action completes.
- Drop an oversize image → form shows error toast, no upload attempted.
- Sign in as a non-admin role (e.g. rider) → dashboard does NOT render the map row.

## 13. Rollout phasing (suggestion for implementation planning)

1. **Phase 1** — schema migration + storage bucket + helpers (`address.ts`, `storage.ts`, `geocode.ts`) + `BaseFileUpload` + `AddressFieldCascade` (with drag-to-pin mini-map) + `CustomerAddressFormModal` rewrite + caller migration + `address_line` drop. Adds the new data shape, admin form, and `mapbox-gl` dep.
2. **Phase 2** — `listAddressesForMap` + `DashboardMap.vue` + dashboard insertion. Reuses the Mapbox dep landed in Phase 1.

Phase 1 introduces the Mapbox dependency (geocoding + mini-map). Phase 2 cannot ship without Phase 1.

## Open questions

None — all decisions locked during brainstorming.
