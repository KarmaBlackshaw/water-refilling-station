<script lang="ts">
export interface TableActionMenuItem {
  label: string;
  onClick: () => void;
  icon?: Component;
  danger?: boolean;
  hidden?: boolean;
  disabled?: boolean;
}
</script>

<script setup lang="ts">
import IconMoreVertical from '@/components/Icon/IconMoreVertical.vue';

const props = defineProps<{
  menu: ReadonlyArray<TableActionMenuItem>;
  loading?: boolean;
}>();

const { isVisible, hide, toggle, BUTTON_REF, POPPER_REF } = useFloat({ placement: 'bottom-end' });

const visibleMenu = computed(() => props.menu.filter((m) => !m.hidden));

function onClick(item: TableActionMenuItem) {
  if (item.disabled) {
    return;
  }

  hide();
  item.onClick();
}
</script>

<template>
  <div v-if="visibleMenu.length" class="relative flex items-center justify-end">
    <button
      :ref="BUTTON_REF"
      type="button"
      :disabled="loading"
      :class="[
        'inline-flex size-8 items-center justify-center rounded-md border border-transparent text-oslo transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-turquoise-stone',
        loading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-bright-chrome hover:text-casual-navy',
        isVisible ? 'bg-bright-chrome text-casual-navy' : '',
      ]"
      @click.stop="toggle"
    >
      <IconMoreVertical :size="18" />
    </button>

    <Teleport to="body">
      <div :ref="POPPER_REF" class="z-9999 min-w-40 select-none overflow-hidden rounded-md border border-sparkling-silver bg-full-white py-1 shadow-lg">
        <button
          v-for="(item, i) in visibleMenu"
          :key="i"
          type="button"
          :disabled="item.disabled"
          :class="[
            'flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium transition-colors',
            item.danger ? 'text-blaze-red hover:bg-blaze-red/10' : 'text-casual-navy hover:bg-bright-chrome',
            item.disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
          ]"
          @click.stop="onClick(item)"
        >
          <component :is="item.icon" v-if="item.icon" :size="16" class="flex-none" />
          <span class="truncate">{{ item.label }}</span>
        </button>
      </div>
    </Teleport>
  </div>
</template>
