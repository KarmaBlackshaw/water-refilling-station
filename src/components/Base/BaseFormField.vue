<script setup lang="ts">
const {
  label,
  error,
  helperText,
  required = false,
  id,
} = defineProps<{
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  id?: string;
}>();

const uid = useId();
const controlId = computed(() => id ?? `field-${uid}`);
const describedBy = computed(() => {
  if (error) {
    return `${controlId.value}-error`;
  }

  if (helperText) {
    return `${controlId.value}-helper`;
  }

  return undefined;
});
</script>

<template>
  <div class="flex flex-col gap-1">
    <label v-if="label" :for="controlId" class="text-xs font-medium text-oslo">
      {{ label }}
      <span v-if="required" class="text-blaze-red" aria-hidden="true"> *</span>
    </label>

    <slot :control-id="controlId" :described-by="describedBy" :has-error="!!error" />

    <p v-if="error" :id="`${controlId}-error`" class="text-xs text-blaze-red" role="alert">
      {{ error }}
    </p>
    <p v-else-if="helperText" :id="`${controlId}-helper`" class="text-xs text-independence">
      {{ helperText }}
    </p>
  </div>
</template>
