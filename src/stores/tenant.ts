import { fetchSettings, upsertSetting } from '@/services/settings';
import type { SettingKey } from '@/types/database';

export const useTenantStore = defineStore('tenant', () => {
  const tenantId = ref<string | null>(null);
  const branchId = ref<string | null>(null);
  const settingsMap = ref<Record<string, string>>({});
  const settingsLoaded = ref(false);

  function setContext(tid: string, bid: string) {
    tenantId.value = tid;
    branchId.value = bid;
  }

  async function loadSettings() {
    if (!tenantId.value || !branchId.value) {
      return;
    }

    const { data } = await fetchSettings(tenantId.value, branchId.value);

    if (data) {
      const map: Record<string, string> = {};

      for (const s of data) {
        map[s.key] = s.value;
      }
      settingsMap.value = map;
      settingsLoaded.value = true;
    }
  }

  function getSetting(key: SettingKey, fallback: string): string {
    return settingsMap.value[key] ?? fallback;
  }

  function getSettingInt(key: SettingKey, fallback: number): number {
    const raw = settingsMap.value[key];

    if (!raw) {
      return fallback;
    }

    const parsed = parseInt(raw, 10);

    return isNaN(parsed) ? fallback : parsed;
  }

  async function saveSetting(key: SettingKey, value: string) {
    if (!tenantId.value || !branchId.value) {
      return;
    }

    await upsertSetting(tenantId.value, branchId.value, key, value);
    settingsMap.value[key] = value;
  }

  // Typed convenience getters
  const stalenessDaysDelivery = computed(() => getSettingInt('staleness_days_delivery', 7));
  const stalenessDaysWalkin = computed(() => getSettingInt('staleness_days_walkin', 14));
  const bookingHorizonDays = computed(() => getSettingInt('booking_horizon_days', 7));
  const defaultQuotaJugs = computed(() => getSettingInt('default_quota_jugs', 150));
  const commissionPerJugCentavos = computed(() => getSettingInt('commission_per_jug_centavos', 100));

  return {
    tenantId: readonly(tenantId),
    branchId: readonly(branchId),
    settingsLoaded: readonly(settingsLoaded),
    setContext,
    loadSettings,
    getSetting,
    getSettingInt,
    saveSetting,
    stalenessDaysDelivery,
    stalenessDaysWalkin,
    bookingHorizonDays,
    defaultQuotaJugs,
    commissionPerJugCentavos,
  };
});
