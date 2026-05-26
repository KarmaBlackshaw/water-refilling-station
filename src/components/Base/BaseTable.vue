<script lang="ts">
export interface TableColumn<TRow = Record<string, unknown>> {
  key: string;
  label?: string;
  field?: keyof TRow & string;
  align?: 'left' | 'right' | 'center';
  class?: string;
  headerClass?: string;
  width?: string;
}
</script>

<script setup lang="ts" generic="TRow extends object">
import BaseSpinner from './BaseSpinner.vue';
import BaseEmptyState from './BaseEmptyState.vue';

const props = withDefaults(
  defineProps<{
    columns: TableColumn<TRow>[];
    data: TRow[] | null | undefined;
    loading?: boolean;
    rowKey?: keyof TRow | ((row: TRow, index: number) => string | number);
    emptyTitle?: string;
    emptyDescription?: string;
  }>(),
  {
    loading: false,
    emptyTitle: 'No data',
    emptyDescription: undefined,
  },
);

const rows = computed<TRow[]>(() => (props.data ?? []).filter((r): r is TRow => r != null));

defineSlots<{
  empty(): unknown;
  loading(): unknown;
  [key: `cell-${string}`]: (props: { row: TRow; value: unknown; index: number }) => unknown;
  [key: `header-${string}`]: (props: { column: TableColumn<TRow> }) => unknown;
}>();

function resolveKey(row: TRow, index: number): string | number {
  const rk = props.rowKey;

  if (typeof rk === 'function') {
    return rk(row, index);
  }

  if (rk === undefined || row == null) {
    return index;
  }

  const v = row[rk];

  if (typeof v === 'string' || typeof v === 'number') {
    return v;
  }

  return index;
}

function resolveValue(row: TRow, col: TableColumn<TRow>): unknown {
  if (row == null) {
    return undefined;
  }

  const field = (col.field ?? col.key) as keyof TRow;

  return row[field];
}

function alignClass(a?: TableColumn<TRow>['align']): string {
  if (a === 'right') {
    return 'text-right';
  }

  if (a === 'center') {
    return 'text-center';
  }

  return '';
}
</script>

<template>
  <div class="w-full overflow-x-auto border-t border-sparkling-silver">
    <table class="w-full text-sm text-left">
      <thead>
        <tr>
          <th
            v-for="col in columns"
            :key="col.key"
            :class="[
              'px-4 py-3 text-xs font-semibold text-oslo uppercase tracking-wide bg-bright-chrome border-b border-sparkling-silver',
              alignClass(col.align),
              col.headerClass,
            ]"
            :style="col.width ? { width: col.width } : undefined"
          >
            <slot :name="`header-${col.key}`" :column="col">{{ col.label }}</slot>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="loading">
          <td :colspan="columns.length" class="py-8 text-center">
            <slot name="loading">
              <BaseSpinner class="mx-auto" />
            </slot>
          </td>
        </tr>
        <tr v-else-if="rows.length === 0">
          <td :colspan="columns.length" class="border-b border-sparkling-silver">
            <slot name="empty">
              <BaseEmptyState :title="emptyTitle" :description="emptyDescription" />
            </slot>
          </td>
        </tr>
        <tr v-for="(row, index) in rows" v-else :key="resolveKey(row, index)" class="hover:bg-bright-chrome transition-colors">
          <td
            v-for="col in columns"
            :key="col.key"
            :class="['px-4 py-3 text-sm text-casual-navy border-b border-sparkling-silver', alignClass(col.align), col.class]"
          >
            <slot :name="`cell-${col.key}`" :row="row" :value="resolveValue(row, col)" :index="index">{{ resolveValue(row, col) ?? '' }}</slot>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
