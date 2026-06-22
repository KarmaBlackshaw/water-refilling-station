<script setup lang="ts">
const model = defineModel<string | number>({ required: true });

const { type } = defineProps<{
  label?: string;
  placeholder?: string;
  type?: string;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  required?: boolean;
  id?: string;
}>();

const isCurrency = computed(() => type === 'currency');
const nativeType = computed(() => (isCurrency.value ? 'number' : (type ?? 'text')));
</script>

<template>
  <BaseFormField :id="id" :label="label" :error="error" :helper-text="helperText" :required="required">
    <template #default="{ controlId, describedBy, hasError }">
      <div class="relative">
        <span v-if="isCurrency" class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-oslo" aria-hidden="true">₱</span>
        <input
          :id="controlId"
          v-model="model"
          :type="nativeType"
          :inputmode="isCurrency ? 'decimal' : undefined"
          :step="isCurrency ? '0.01' : undefined"
          :placeholder="placeholder"
          :disabled="disabled"
          :required="required"
          :aria-invalid="hasError"
          :aria-describedby="describedBy"
          :class="[
            'h-10 w-full rounded-md border bg-full-white text-sm text-casual-navy placeholder:text-oslo focus:outline-none focus:ring-2 focus:ring-tampa disabled:cursor-not-allowed disabled:opacity-50',
            isCurrency ? 'pl-7 pr-3' : 'px-3',
            hasError ? 'border-blaze-red' : 'border-sparkling-silver',
          ]"
        />
      </div>
    </template>
  </BaseFormField>
</template>
