import { getActiveCustomerCount, getMaintenanceAlertCount, getPendingDeliveryCount, getUpcomingBookingCount } from '@/services/dashboard';

type Counters = {
  activeCustomerCount: number;
  pendingDeliveryCount: number;
  upcomingBookingCount: number;
  maintenanceAlertCount: number;
};

const defaultCounters: Counters = {
  activeCustomerCount: 0,
  pendingDeliveryCount: 0,
  upcomingBookingCount: 0,
  maintenanceAlertCount: 0,
};

let singleton: ReturnType<typeof buildComposable> | null = null;

function buildComposable() {
  const { data, loading, run } = useAsync(
    async () => {
      const [active, pending, upcoming, alerts] = await Promise.all([
        getActiveCustomerCount(),
        getPendingDeliveryCount(),
        getUpcomingBookingCount(),
        getMaintenanceAlertCount(),
      ]);

      return {
        activeCustomerCount: active,
        pendingDeliveryCount: pending,
        upcomingBookingCount: upcoming,
        maintenanceAlertCount: alerts,
      };
    },
    {
      immediate: true,
      defaultValue: defaultCounters,
      disableResetValue: true,
    },
  );

  const activeCustomerCount = computed(() => data.value?.activeCustomerCount ?? 0);
  const pendingDeliveryCount = computed(() => data.value?.pendingDeliveryCount ?? 0);
  const upcomingBookingCount = computed(() => data.value?.upcomingBookingCount ?? 0);
  const maintenanceAlertCount = computed(() => data.value?.maintenanceAlertCount ?? 0);

  return {
    activeCustomerCount,
    pendingDeliveryCount,
    upcomingBookingCount,
    maintenanceAlertCount,
    loading,
    refresh: run,
  };
}

export function useDashboardCounters() {
  if (!singleton) {
    singleton = buildComposable();
  }

  return singleton;
}
