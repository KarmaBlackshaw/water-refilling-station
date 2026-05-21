import { useRoute } from 'vue-router';
import type { SidebarNavItem } from '@/constants/sidebarNav';

export function useNavActive() {
  const route = useRoute();

  function isActive(to: string): boolean {
    const base = to.split('?')[0] ?? to;

    return route.path.startsWith(base);
  }

  function isChildActive(item: SidebarNavItem): boolean {
    if (!item.children) {
      return false;
    }

    return item.children.some((c) => {
      const parts = c.to.split('?');
      const path = parts[0] ?? c.to;
      const query = parts[1];

      if (route.path !== path) {
        return false;
      }

      if (!query) {
        return true;
      }

      const params = new URLSearchParams(query);

      for (const [k, v] of params) {
        if (route.query[k] !== v) {
          return false;
        }
      }

      return true;
    });
  }

  function isChildExact(to: string): boolean {
    return route.fullPath === to;
  }

  return { route, isActive, isChildActive, isChildExact };
}
