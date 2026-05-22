import { ref, watch } from 'vue';

const STORAGE_KEY = 'wrs.sidebar.expanded';

function load(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (raw) {
      const parsed: unknown = JSON.parse(raw);

      if (Array.isArray(parsed)) {
        return new Set(parsed.filter((v): v is string => typeof v === 'string'));
      }
    }
  } catch {
    /* ignore */
  }

  return new Set();
}

const expanded = ref<Set<string>>(load());

watch(
  expanded,
  (v) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...v]));
    } catch {
      /* ignore */
    }
  },
  { deep: true },
);

export function useSidebarExpanded() {
  function isExpanded(label: string): boolean {
    return expanded.value.has(label);
  }

  function toggle(label: string): void {
    const next = new Set(expanded.value);

    if (next.has(label)) {
      next.delete(label);
    } else {
      next.add(label);
    }

    expanded.value = next;
  }

  return { expanded, isExpanded, toggle };
}
