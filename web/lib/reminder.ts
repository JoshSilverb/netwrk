// Maps between UI frequency strings and backend { weeks, months } format

export const FREQUENCY_OPTIONS = [
  { value: 'weekly',    label: 'Weekly' },
  { value: 'biweekly',  label: 'Biweekly' },
  { value: 'monthly',   label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly',    label: 'Yearly' },
] as const;

export type FrequencyValue = (typeof FREQUENCY_OPTIONS)[number]['value'];

export function frequencyToReminderPeriod(freq: string): { weeks: number | null; months: number | null } {
  switch (freq) {
    case 'weekly':    return { weeks: 1,    months: null };
    case 'biweekly':  return { weeks: 2,    months: null };
    case 'monthly':   return { weeks: null, months: 1 };
    case 'quarterly': return { weeks: null, months: 3 };
    case 'yearly':    return { weeks: null, months: 12 };
    default:          return { weeks: null, months: null };
  }
}

export function reminderPeriodToFrequency(weeks: number | null, months: number | null): string {
  if (weeks === 1)   return 'Weekly';
  if (weeks === 2)   return 'Biweekly';
  if (months === 1)  return 'Monthly';
  if (months === 3)  return 'Quarterly';
  if (months === 12) return 'Yearly';
  return '—';
}
