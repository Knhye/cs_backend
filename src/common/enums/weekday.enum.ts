export const WEEKDAY_VALUES = [
  'SUN',
  'MON',
  'TUE',
  'WED',
  'THU',
  'FRI',
  'SAT',
] as const;

export type Weekday = (typeof WEEKDAY_VALUES)[number];
