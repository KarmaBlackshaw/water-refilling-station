import { useRoute } from 'vue-router';

export function useNavActive() {
  const route = useRoute();

  function isActive(to: string): boolean {
    const base = to.split('?')[0] ?? to;

    return route.path.startsWith(base);
  }

  return { route, isActive };
}
