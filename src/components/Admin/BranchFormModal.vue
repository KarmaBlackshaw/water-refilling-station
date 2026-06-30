<script setup lang="ts">
defineOptions({ name: 'AdminBranchFormModal' });

const open = defineModel<boolean>('open', { required: true });

const { saving } = defineProps<{ saving?: boolean }>();

const emit = defineEmits<{ submit: [name: string] }>();

const name = ref('');

watch(
  () => open.value,
  (isOpen) => {
    if (isOpen) {
      name.value = '';
    }
  },
  { immediate: true },
);

function submit() {
  const trimmed = name.value.trim();

  if (trimmed) {
    emit('submit', trimmed);
  }
}
</script>

<template>
  <BaseModal v-model:open="open" title="Add Branch">
    <form id="branch-form" @submit.prevent="submit">
      <BaseInput v-model="name" label="Branch name" required placeholder="e.g. Cebu Branch" />
    </form>

    <template #footer>
      <BaseButton variant="independence" @click="open = false">Cancel</BaseButton>
      <BaseButton type="submit" form="branch-form" :loading="saving">Add branch</BaseButton>
    </template>
  </BaseModal>
</template>
