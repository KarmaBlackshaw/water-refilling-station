import IconBuilding from '@/components/Icon/IconBuilding.vue';
import { ROUTES } from '@/constants/routes';
import type { SidebarNavItem } from '@/constants/sidebarNav';

export const ADMIN_NAV: SidebarNavItem[] = [{ label: 'Clients', to: ROUTES.ADMIN_CLIENTS, icon: IconBuilding }];
