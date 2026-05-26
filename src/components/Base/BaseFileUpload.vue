<script setup lang="ts">
import { useDropZone, useFileDialog, useObjectUrl } from '@vueuse/core';

const file = defineModel<File | undefined>('file');
const remove = defineModel<boolean>('remove', { default: false });

const {
  accept = 'image/*',
  maxSizeMb = 5,
  label,
  helperText,
  existingUrl,
} = defineProps<{
  accept?: string;
  maxSizeMb?: number;
  label?: string;
  helperText?: string;
  existingUrl?: string;
}>();

const emit = defineEmits<{ error: [message: string] }>();

const pickedUrl = useObjectUrl(file);
const previewUrl = computed(() => {
  if (pickedUrl.value) {
    return pickedUrl.value;
  }

  if (remove.value) {
    return undefined;
  }

  return existingUrl;
});

const fallbackHelper = computed(() => helperText ?? `Max size: ${maxSizeMb}MB`);

function handle(f: File | null | undefined) {
  if (!f) {
    return;
  }

  const sizeMb = f.size / (1024 * 1024);

  if (sizeMb > maxSizeMb) {
    emit('error', `File too large (${sizeMb.toFixed(1)}MB). Max ${maxSizeMb}MB.`);
    return;
  }

  file.value = f;
  remove.value = false;
}

const { open, onChange } = useFileDialog({ accept, multiple: false });

onChange((files) => handle(files?.[0]));

const dropZoneEl = ref<HTMLDivElement | null>(null);
const { isOverDropZone } = useDropZone(dropZoneEl, {
  onDrop: (files) => handle(files?.[0]),
  dataTypes: accept === '*' ? undefined : [accept],
});

function clearFile() {
  file.value = undefined;
  remove.value = true;
}
</script>

<template>
  <div>
    <p v-if="label" class="mb-1 text-sm font-medium text-casual-navy">{{ label }}</p>

    <div
      ref="dropZoneEl"
      class="relative flex aspect-video w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed transition-colors"
      :class="isOverDropZone ? 'border-tampa bg-bright-chrome' : 'border-sparkling-silver bg-bright-chrome/50 hover:bg-bright-chrome'"
      role="button"
      tabindex="0"
      @click="open()"
      @keydown.enter.prevent="open()"
      @keydown.space.prevent="open()"
    >
      <img v-if="previewUrl" :src="previewUrl" alt="Preview" class="h-full w-full rounded-lg object-cover" />
      <template v-else>
        <div class="flex size-12 items-center justify-center rounded-full border border-sparkling-silver bg-white text-oslo">
          <IconPlus class="size-5" />
        </div>
        <p class="text-sm font-semibold text-casual-navy">Drop your image here or click to browse</p>
        <p class="text-xs text-oslo">{{ fallbackHelper }}</p>
      </template>
    </div>

    <div v-if="previewUrl" class="mt-2 flex gap-2">
      <BaseButton variant="independence" size="sm" @click.stop="open()">Replace</BaseButton>
      <BaseButton variant="independence" size="sm" class="text-blaze-red" @click.stop="clearFile">Remove</BaseButton>
    </div>
  </div>
</template>
