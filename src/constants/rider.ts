import type { Option } from '@/types';

/** Weekday options for rest-day pickers. Values are 0=Sun..6=Sat to match users.rest_days. */
export const WEEKDAYS: Option<number>[] = [
  { label: 'Sun', value: 0 },
  { label: 'Mon', value: 1 },
  { label: 'Tue', value: 2 },
  { label: 'Wed', value: 3 },
  { label: 'Thu', value: 4 },
  { label: 'Fri', value: 5 },
  { label: 'Sat', value: 6 },
];
