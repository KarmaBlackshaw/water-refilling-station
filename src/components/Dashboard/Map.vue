<script setup lang="ts">
import { createApp } from 'vue';
import type { Map as MapboxMap, Marker as MapboxMarker } from 'mapbox-gl';
import type mapboxgl from 'mapbox-gl';

type MapboxLib = typeof mapboxgl;
import { listAddressesForMap, updateAddress, updateCustomer, type MapAddrRow } from '@/services/customers';
import { formatAddress } from '@/helpers/address';
import DashboardMapPopup from './MapPopup.vue';

defineOptions({ name: 'DashboardMap' });

type MappableAddr = MapAddrRow & { lat: number; lng: number };

const auth = useAuthStore();
const { tenantId, branchId } = storeToRefs(auth);
const toast = useToast();

const { data: addrsRes, error: addrsError, run: refetchAddrs } = useAsync(() => listAddressesForMap(tenantId.value, branchId.value), { immediate: true });
const { data: ridersRes } = useAsync(() => listRiders(tenantId.value, branchId.value), { immediate: true });

const allAddrs = computed(() => addrsRes.value?.data ?? []);
const riders = computed(() => ridersRes.value?.data ?? []);

const mappable = computed(() => allAddrs.value.filter((a): a is MappableAddr => a.lat != null && a.lng != null));

const needsPinList = computed(() => allAddrs.value.filter((a) => a.lat == null || a.lng == null || a.needs_pin_review));

const selectedRiderIds = ref<string[]>([]);
const needsPinOnly = ref(false);

const visiblePins = computed(() =>
  mappable.value.filter((a) => {
    const customer = a.customer;
    const riderId = customer?.rider_id ?? null;

    if (selectedRiderIds.value.length && !selectedRiderIds.value.includes(riderId ?? '')) {
      return false;
    }

    if (needsPinOnly.value && !a.needs_pin_review) {
      return false;
    }

    return true;
  }),
);

const COLORS = [
  'var(--color-rider-blue)',
  'var(--color-blaze-red)',
  'var(--color-dark-green-turquoise)',
  'var(--color-strong-amber)',
  'var(--color-rider-purple)',
  'var(--color-rider-pink)',
  'var(--color-rider-teal)',
  'var(--color-rider-orange)',
];
const colorCache = new Map<string, string>();

function riderColor(id: string | null): string {
  if (!id) {
    return 'var(--color-oslo)';
  }

  const cached = colorCache.get(id);

  if (cached) {
    return cached;
  }

  let hash = 0;

  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  const color = COLORS[hash % COLORS.length]!;

  colorCache.set(id, color);
  return color;
}

const riderOptions = computed(() => riders.value.map((r) => ({ label: r.full_name, value: r.id })));

const mapEl = ref<HTMLDivElement>();
let map: MapboxMap | null = null;
let resizeObs: ResizeObserver | null = null;
const markers = new Map<string, MapboxMarker>();
let fitDone = false;

const hasToken = Boolean(import.meta.env.VITE_MAPBOX_TOKEN);

function makeMarkerEl(riderId: string | null, needsReview: boolean): HTMLDivElement {
  const el = document.createElement('div');

  el.style.cssText = `
    width: 16px; height: 16px;
    border-radius: 50%;
    background: ${riderColor(riderId)};
    border: 2px solid var(--color-full-white);
    box-shadow: 0 1px 3px rgba(0,0,0,.4);
    cursor: pointer;
    position: relative;
  `;
  if (needsReview) {
    const badge = document.createElement('div');

    badge.style.cssText = `
      position: absolute; top: -3px; right: -3px;
      width: 7px; height: 7px;
      border-radius: 50%;
      background: var(--color-blaze-red);
      border: 1px solid var(--color-full-white);
    `;
    el.appendChild(badge);
  }

  return el;
}

function openPopup(mapbox: MapboxLib, addr: MapAddrRow) {
  const customer = addr.customer;

  if (!customer) {
    return;
  }

  const rider = customer.rider ?? null;
  const backupRider = customer.backup_rider ?? null;

  const node = document.createElement('div');

  const app = createApp(DashboardMapPopup, {
    address: {
      id: addr.id,
      label: addr.label,
      street: addr.street,
      barangay: addr.barangay,
      city: addr.city,
      landmark: addr.landmark,
      lat: addr.lat,
      lng: addr.lng,
      needs_pin_review: addr.needs_pin_review,
      photo_path: addr.photo_path,
    },
    customer: {
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      rider_id: customer.rider_id,
      backup_rider_id: customer.backup_rider_id,
    },
    rider,
    backupRider,
    riderOptions: riderOptions.value,
    onReassignRider: async (riderId: string) => {
      const { error } = await updateCustomer(customer.id, { rider_id: riderId });

      if (error) {
        toast.error('Failed to reassign rider');
        return;
      }

      await refetchAddrs();
      renderPins(mapbox);
    },
    onTogglePinReview: async () => {
      const { error } = await updateAddress(addr.id, { needs_pin_review: !addr.needs_pin_review });

      if (error) {
        toast.error('Failed to update pin review flag');
        return;
      }

      await refetchAddrs();
      renderPins(mapbox);
    },
  });

  app.mount(node);

  new mapbox.Popup({ closeButton: true, maxWidth: '280px' }).setDOMContent(node).addTo(map!);
}

function renderPins(mapbox: MapboxLib) {
  if (!map) {
    return;
  }

  const visibleIds = new Set(visiblePins.value.map((a) => a.id));

  for (const [id, marker] of markers) {
    if (!visibleIds.has(id)) {
      marker.remove();
      markers.delete(id);
    }
  }

  for (const addr of visiblePins.value) {
    const riderId = addr.customer?.rider_id ?? null;

    if (markers.has(addr.id)) {
      const existing = markers.get(addr.id)!;
      const existingEl = existing.getElement();

      existingEl.style.background = riderColor(riderId);
      const badge = existingEl.querySelector('div');

      if (addr.needs_pin_review && !badge) {
        const b = document.createElement('div');

        b.style.cssText = `
          position: absolute; top: -3px; right: -3px;
          width: 7px; height: 7px;
          border-radius: 50%;
          background: var(--color-blaze-red);
          border: 1px solid var(--color-full-white);
        `;
        existingEl.appendChild(b);
      } else if (!addr.needs_pin_review && badge) {
        badge.remove();
      }
    } else {
      const el = makeMarkerEl(riderId, addr.needs_pin_review);
      const marker = new mapbox.Marker({ element: el }).setLngLat([addr.lng, addr.lat]).addTo(map);

      el.addEventListener('click', () => openPopup(mapbox, addr));
      markers.set(addr.id, marker);
    }
  }
}

function fitToVisible() {
  if (!map || fitDone || visiblePins.value.length === 0) {
    return;
  }

  if (visiblePins.value.length === 1) {
    const a = visiblePins.value[0]!;

    map.flyTo({ center: [a.lng, a.lat], zoom: 14 });
    fitDone = true;
    return;
  }

  let minLng = Infinity,
    maxLng = -Infinity,
    minLat = Infinity,
    maxLat = -Infinity;

  for (const a of visiblePins.value) {
    if (a.lng < minLng) {
      minLng = a.lng;
    }

    if (a.lng > maxLng) {
      maxLng = a.lng;
    }

    if (a.lat < minLat) {
      minLat = a.lat;
    }

    if (a.lat > maxLat) {
      maxLat = a.lat;
    }
  }
  map.fitBounds(
    [
      [minLng, minLat],
      [maxLng, maxLat],
    ],
    { padding: 60 },
  );
  fitDone = true;
}

onMounted(async () => {
  if (!hasToken) {
    return;
  }

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
    renderPins(mapbox);
    fitToVisible();
  });

  resizeObs = new ResizeObserver(() => map?.resize());
  resizeObs.observe(mapEl.value!);

  watch(visiblePins, () => {
    renderPins(mapbox);
  });
});

onBeforeUnmount(() => {
  resizeObs?.disconnect();
  resizeObs = null;
  map?.remove();
  map = null;
  markers.clear();
});

const needsPinExpanded = ref(false);

function toggleRider(id: string) {
  const idx = selectedRiderIds.value.indexOf(id);

  if (idx === -1) {
    selectedRiderIds.value = [...selectedRiderIds.value, id];
  } else {
    selectedRiderIds.value = selectedRiderIds.value.filter((x) => x !== id);
  }
}
</script>

<template>
  <div class="flex h-full flex-col overflow-hidden rounded-xl border border-sparkling-silver bg-full-white md:flex-row">
    <BaseEmptyState v-if="!hasToken" title="Map unavailable" description="Set VITE_MAPBOX_TOKEN to enable the map." class="flex-1" />

    <template v-else>
      <div class="relative flex-1">
        <div v-if="addrsError" class="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-full-white">
          <BaseEmptyState title="Failed to load map data" description="An error occurred while fetching addresses.">
            <template #actions>
              <BaseButton variant="independence" @click="refetchAddrs">Retry</BaseButton>
            </template>
          </BaseEmptyState>
        </div>

        <div v-else-if="mappable.length === 0 && !addrsError" class="absolute inset-0 z-10 flex flex-col items-center justify-center bg-full-white/90">
          <BaseEmptyState title="No mapped addresses" description="No addresses with coordinates found for this branch." />
        </div>

        <div ref="mapEl" class="h-full w-full" />
      </div>

      <div class="flex w-full flex-col gap-4 overflow-y-auto border-t border-sparkling-silver p-4 md:w-72 md:border-l md:border-t-0">
        <div class="space-y-3">
          <p class="text-xs font-semibold uppercase tracking-wide text-oslo">Filters</p>

          <div v-if="riders.length > 0" class="space-y-1.5">
            <p class="text-xs text-independence">Riders</p>
            <div class="flex flex-wrap gap-1.5">
              <button
                v-for="rider in riders"
                :key="rider.id"
                type="button"
                class="flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs transition-colors"
                :class="
                  selectedRiderIds.includes(rider.id)
                    ? 'border-tampa bg-tampa text-full-white'
                    : 'border-sparkling-silver bg-full-white text-casual-navy hover:bg-bright-chrome'
                "
                @click="toggleRider(rider.id)"
              >
                <span class="inline-block size-2.5 shrink-0 rounded-full" :style="{ background: riderColor(rider.id) }" />
                {{ rider.full_name }}
              </button>
            </div>
          </div>

          <label class="flex cursor-pointer items-center gap-2 text-xs text-casual-navy">
            <input v-model="needsPinOnly" type="checkbox" class="size-3.5 rounded border border-sparkling-silver accent-tampa" />
            Needs pin review only
          </label>
        </div>

        <div v-if="riders.length > 0" class="space-y-1.5">
          <p class="text-xs font-semibold uppercase tracking-wide text-oslo">Legend</p>
          <div class="space-y-1">
            <div v-for="rider in riders" :key="rider.id" class="flex items-center gap-2 text-xs text-casual-navy">
              <span class="inline-block size-2.5 shrink-0 rounded-full" :style="{ background: riderColor(rider.id) }" />
              {{ rider.full_name }}
            </div>
            <div class="flex items-center gap-2 text-xs text-casual-navy">
              <span class="inline-block size-2.5 shrink-0 rounded-full bg-oslo" />
              Unassigned
            </div>
          </div>
        </div>

        <div v-if="needsPinList.length > 0" class="space-y-1.5">
          <button
            type="button"
            class="flex w-full items-center justify-between text-xs font-semibold uppercase tracking-wide text-oslo"
            @click="needsPinExpanded = !needsPinExpanded"
          >
            <span>Needs pin ({{ needsPinList.length }})</span>
            <IconChevronDown :size="14" class="transition-transform" :class="needsPinExpanded ? 'rotate-180' : ''" />
          </button>

          <div v-if="needsPinExpanded" class="space-y-1">
            <RouterLink
              v-for="addr in needsPinList"
              :key="addr.id"
              :to="`/customers/${addr.customer?.id}`"
              class="block rounded-md px-2 py-1.5 text-xs text-casual-navy hover:bg-bright-chrome"
            >
              <span class="font-medium">{{ addr.customer?.name }}</span>
              <span class="ml-1 text-oslo">— {{ formatAddress(addr) }}</span>
            </RouterLink>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
