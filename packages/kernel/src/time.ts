import { requireThat } from './error.ts';

export function businessDate(instant: string): string {
  requireThat(/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(instant), 'INVALID_INSTANT');
  requireThat(Number.isFinite(Date.parse(instant)), 'INVALID_INSTANT');
  requireThat(new Date(instant).toISOString() === instant, 'INVALID_INSTANT');
  return new Date(Date.parse(instant) + 480 * 60000).toISOString().slice(0, 10);
}
export function date(value: string): string {
  requireThat(/^\d{4}-\d\d-\d\d$/.test(value) && Number.isFinite(Date.parse(value)), 'INVALID_DATE');
  requireThat(new Date(value).toISOString().slice(0, 10) === value, 'INVALID_DATE');
  return value;
}
export function addDays(value: string, days: number): string {
  return new Date(Date.parse(date(value)) + days * 86400000).toISOString().slice(0, 10);
}
export function weekStart(value: string): string {
  return addDays(value, -((new Date(date(value)).getUTCDay() + 6) % 7));
}
export function nextVersion(value: string): string { return (BigInt(value) + 1n).toString(); }
