import type { Option } from './option';

export type FilterSelectOption = Option<string>;

type FilterFieldBase = {
  label: string;
  disabled?: boolean;
};

export type FilterFieldSelect = FilterFieldBase & {
  field: 'select';
  key: string;
  options: FilterSelectOption[];
  placeholder?: string;
};

export type FilterFieldDate = FilterFieldBase & {
  field: 'date';
  key: string;
  placeholder?: string;
  minDate?: string;
  maxDate?: string;
};

export type FilterFieldInput = FilterFieldBase & {
  field: 'input';
  key: string;
  placeholder?: string;
};

export type FilterFieldDateRange = FilterFieldBase & {
  field: 'date-range';
  keyFrom: string;
  keyTo: string;
  placeholder?: string;
  minDate?: string;
  maxDate?: string;
};

export type FilterDefinition = FilterFieldSelect | FilterFieldDate | FilterFieldInput | FilterFieldDateRange;

export type FilterValues = Record<string, string>;

export type FilterPillValue = string | string[];

export function isFilterFieldSelect(def: FilterDefinition): def is FilterFieldSelect {
  return def.field === 'select';
}

export function isFilterFieldDate(def: FilterDefinition): def is FilterFieldDate {
  return def.field === 'date';
}

export function isFilterFieldInput(def: FilterDefinition): def is FilterFieldInput {
  return def.field === 'input';
}

export function isFilterFieldDateRange(def: FilterDefinition): def is FilterFieldDateRange {
  return def.field === 'date-range';
}
