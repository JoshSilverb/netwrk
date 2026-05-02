export type FrequencyUnit = 'weeks' | 'months';

export function formatFrequency(weeks: number | null, months: number | null): string {
  if (weeks) return `Every ${weeks} ${weeks === 1 ? 'week' : 'weeks'}`;
  if (months) return `Every ${months} ${months === 1 ? 'month' : 'months'}`;
  return '—';
}
