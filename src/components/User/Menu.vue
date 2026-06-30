<script setup lang="ts">
import type { Placement } from '@floating-ui/dom';
import { ROUTES } from '@/constants/routes';

defineOptions({ name: 'UserMenu' });

const {
  name,
  email,
  placement = 'bottom-end',
} = defineProps<{
  name: string;
  email: string;
  placement?: Placement;
}>();

const authStore = useAuthStore();
const router = useRouter();

const { BUTTON_REF, POPPER_REF, toggle, hide, isVisible } = useFloat({ placement });

const initials = computed(() => name.charAt(0).toUpperCase() || 'A');

async function handleLogout() {
  hide();
  await authStore.logout();
  router.push(ROUTES.LOGIN);
}
</script>

<template>
  <div @keydown.esc="hide">
    <button
      :ref="BUTTON_REF"
      type="button"
      class="flex w-full items-center gap-2 rounded-lg px-1.5 py-1 transition-colors hover:bg-hover"
      aria-haspopup="menu"
      :aria-expanded="isVisible"
      @click="toggle"
    >
      <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-tampa to-cerulean text-xs font-bold text-white">
        {{ initials }}
      </div>
      <div class="flex min-w-0 flex-1 flex-col items-start leading-tight">
        <span class="w-full truncate text-left text-xs font-semibold text-casual-navy">{{ name }}</span>
        <span class="w-full truncate text-left text-[10px] text-oslo">{{ email }}</span>
      </div>
      <IconChevronDown :size="14" class="shrink-0 text-oslo transition-transform" :class="isVisible ? 'rotate-180' : ''" />
    </button>

    <div :ref="POPPER_REF" role="menu" class="hidden z-50 w-56 rounded-md border border-sparkling-silver bg-full-white p-1.5 shadow-md">
      <div class="border-b border-sparkling-silver px-2.5 py-2">
        <p class="truncate text-xs font-semibold text-casual-navy">{{ name }}</p>
        <p class="truncate text-[10px] text-oslo">{{ email }}</p>
      </div>

      <button
        type="button"
        role="menuitem"
        class="mt-1 flex w-full items-center gap-2 rounded px-2.5 py-2 text-left text-xs font-medium text-blaze-red transition-colors hover:bg-hover"
        @click="handleLogout"
      >
        <IconLogout :size="14" />
        Log out
      </button>
    </div>
  </div>
</template>
