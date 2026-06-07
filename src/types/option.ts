export type Option<T = string | number> = {
  label: string;
  value: T;
  disabled?: boolean;
};
