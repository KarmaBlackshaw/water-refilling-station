<script setup lang="ts">
const authStore = useAuthStore();

const initials = computed(() => {
  const email = authStore.authUser?.email ?? '';

  return email.charAt(0).toUpperCase() || 'A';
});

const displayEmail = computed(() => authStore.authUser?.email ?? '');
const displayName = computed(() => authStore.profile?.full_name ?? displayEmail.value.split('@')[0] ?? 'Admin');
</script>

<template>
  <header class="flex h-[69px] shrink-0 items-center gap-3 border-b border-sparkling-silver bg-full-white px-4">
    <!-- Search bar -->
    <div class="flex h-8 max-w-[260px] flex-1 items-center gap-2 rounded-lg border border-sparkling-silver bg-bright-chrome px-3">
      <IconSearch :size="14" class="shrink-0 text-oslo" />
      <span class="flex-1 text-xs text-oslo">Search...</span>
      <kbd class="rounded bg-sparkling-silver px-1 py-0.5 text-[9px] text-oslo">⌘F</kbd>
    </div>

    <div class="flex-1" />

    <!-- Icon buttons -->
    <button
      type="button"
      class="flex h-7 w-7 items-center justify-center rounded-lg border border-sparkling-silver bg-bright-chrome text-independence hover:bg-hover transition-colors"
    >
      <IconMail :size="14" />
    </button>
    <button
      type="button"
      class="flex h-7 w-7 items-center justify-center rounded-lg border border-sparkling-silver bg-bright-chrome text-independence hover:bg-hover transition-colors"
    >
      <IconBell :size="14" />
    </button>

    <!-- Divider -->
    <div class="h-5 w-px bg-sparkling-silver" />

    <!-- Avatar + user info -->
    <div class="flex items-center gap-2">
      <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-turquoise-stone to-cerulean text-xs font-bold text-white">
        {{ initials }}
      </div>
      <div class="flex flex-col leading-tight">
        <span class="text-xs font-semibold text-casual-navy">{{ displayName }}</span>
        <span class="text-[10px] text-oslo">{{ displayEmail }}</span>
      </div>
    </div>
  </header>
</template>
