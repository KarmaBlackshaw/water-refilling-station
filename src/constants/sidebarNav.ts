import type { Component } from 'vue';
import IconAreas from '@/components/Icon/IconAreas.vue';
import IconBookings from '@/components/Icon/IconBookings.vue';
import IconCustomers from '@/components/Icon/IconCustomers.vue';
import IconDashboard from '@/components/Icon/IconDashboard.vue';
import IconDeliveries from '@/components/Icon/IconDeliveries.vue';
import IconEmployees from '@/components/Icon/IconEmployees.vue';
import IconExpenses from '@/components/Icon/IconExpenses.vue';
import IconMaintenance from '@/components/Icon/IconMaintenance.vue';
import IconProducts from '@/components/Icon/IconProducts.vue';
import IconSales from '@/components/Icon/IconSales.vue';
import IconSettings from '@/components/Icon/IconSettings.vue';
import IconVehicles from '@/components/Icon/IconVehicles.vue';
import { ROUTES } from '@/constants/routes';

export type SidebarBadgeKey = 'maintenanceAlertCount';

export interface SidebarNavItem {
  label: string;
  to: string;
  icon: Component;
  badgeKey?: SidebarBadgeKey;
}

export const SIDEBAR_MAIN_NAV: SidebarNavItem[] = [
  { label: 'Dashboard', to: ROUTES.DASHBOARD, icon: IconDashboard },
  { label: 'Customers', to: ROUTES.CUSTOMERS, icon: IconCustomers },
  { label: 'Sales', to: ROUTES.SALES, icon: IconSales },
  { label: 'Deliveries', to: ROUTES.DELIVERIES, icon: IconDeliveries },
  { label: 'Bookings', to: ROUTES.BOOKINGS, icon: IconBookings },
  { label: 'Products', to: ROUTES.PRODUCTS, icon: IconProducts },
  { label: 'Areas', to: ROUTES.AREAS, icon: IconAreas },
  { label: 'Employees', to: ROUTES.EMPLOYEES, icon: IconEmployees },
  { label: 'Maintenance', to: ROUTES.MAINTENANCE, icon: IconMaintenance, badgeKey: 'maintenanceAlertCount' },
  { label: 'Vehicles', to: ROUTES.VEHICLES, icon: IconVehicles },
  { label: 'Expenses', to: ROUTES.EXPENSES, icon: IconExpenses },
];

export const SIDEBAR_GENERAL_NAV: SidebarNavItem[] = [{ label: 'Settings', to: ROUTES.SETTINGS, icon: IconSettings }];
