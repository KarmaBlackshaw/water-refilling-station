<script setup lang="ts">
import type { Size } from '@/types';
import IconClose from '@/components/Icon/IconClose.vue';

const open = defineModel<boolean>('open', { required: true });

const { size = 'md', closable = true } = defineProps<{
  title?: string;
  size?: Size;
  closable?: boolean;
}>();

const sizeClass = computed(() => {
  return {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl',
  }[size];
});

function handleClose() {
  if (closable) {
    open.value = false;
  }
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && closable) {
    open.value = false;
  }
}

onMounted(() => {
  document.addEventListener('keydown', onKeydown);
});

onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown);
});
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-150"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="open" class="fixed inset-0 z-40 bg-black/50" aria-hidden="true" @click="handleClose" />
    </Transition>

    <Transition
      enter-active-class="transition-all duration-200"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition-all duration-150"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-if="open"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="title ? 'modal-title' : undefined"
      >
        <div :class="['relative w-full bg-full-white rounded-xl border border-sparkling-silver shadow-lg overflow-hidden', sizeClass]" @click.stop>
          <!-- Header -->
          <div v-if="title || closable" class="flex items-center justify-between px-5 py-4 border-b border-sparkling-silver">
            <h2 v-if="title" id="modal-title" class="text-base font-semibold text-casual-navy">{{ title }}</h2>
            <button
              v-if="closable"
              class="ml-auto text-independence hover:text-casual-navy transition-colors focus:outline-none focus:ring-2 focus:ring-turquoise-stone rounded"
              aria-label="Close"
              @click="handleClose"
            >
              <IconClose class="size-5" />
            </button>
          </div>

          <!-- Body -->
          <div class="px-5 py-4">
            <slot />
          </div>

          <!-- Footer -->
          <div v-if="$slots.footer" class="px-5 py-4 border-t border-sparkling-silver flex justify-end gap-2">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
