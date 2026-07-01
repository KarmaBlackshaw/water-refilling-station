import type { Option } from '@/types';

/** Weekday options for rest-day pickers. Values are 0=Sun..6=Sat to match users.rest_days. */
export const WEEKDAYS: Option<number>[] = [
  { label: 'Sunday', value: 0 },
  { label: 'Monday', value: 1 },
  { label: 'Tuesday', value: 2 },
  { label: 'Wednesday', value: 3 },
  { label: 'Thursday', value: 4 },
  { label: 'Friday', value: 5 },
  { label: 'Saturday', value: 6 },
];
