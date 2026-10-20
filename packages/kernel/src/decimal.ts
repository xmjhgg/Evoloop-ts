import { requireThat } from './error.ts';

export function decimal(value: string): string {
  requireThat(/^-?(0|[1-9]\d*)(\.\d+)?$/.test(value) && value.length <= 80, 'INVALID_DECIMAL');
  const [whole = '', fraction = ''] = value.split('.');
  const normalized = whole + (fraction.replace(/0+$/, '') ? '.' + fraction.replace(/0+$/, '') : '');
  return normalized === '-0' ? '0' : normalized;
}
function parts(value: string) {
  const text = decimal(value);
  const [whole = '', fraction = ''] = text.replace('-', '').split('.');
  return { amount: BigInt(whole + fraction) * (text.startsWith('-') ? -1n : 1n), scale: fraction.length };
}
function format(value: bigint, scale: number): string {
  const digits = (value < 0n ? -value : value).toString().padStart(scale + 1, '0');
  return decimal((value < 0n ? '-' : '') + (scale ? digits.slice(0, -scale) + '.' + digits.slice(-scale) : digits));
}
export function add(a: string, b: string): string {
  const x = parts(a), y = parts(b), scale = Math.max(x.scale, y.scale);
  return format(x.amount * 10n ** BigInt(scale - x.scale) + y.amount * 10n ** BigInt(scale - y.scale), scale);
}
export function multiply(a: string, b: string, scale = 6): string {
  requireThat(Number.isInteger(scale) && scale >= 0 && scale <= 18, 'INVALID_SCALE');
  const x = parts(a), y = parts(b), amount = x.amount * y.amount, from = x.scale + y.scale;
  if (from <= scale) return format(amount * 10n ** BigInt(scale - from), scale);
  const divisor = 10n ** BigInt(from - scale), absolute = amount < 0n ? -amount : amount;
  return format((absolute / divisor + (absolute % divisor * 2n >= divisor ? 1n : 0n)) * (amount < 0n ? -1n : 1n), scale);
}
/** Decimal division, rounded half away from zero at an explicit decimal scale. */
export function divide(a: string, b: string, scale = 6): string {
  requireThat(Number.isInteger(scale) && scale >= 0 && scale <= 18, 'INVALID_SCALE');
  const x = parts(a), y = parts(b);
  requireThat(y.amount !== 0n, 'DIVISION_BY_ZERO');
  const numerator = x.amount * 10n ** BigInt(y.scale + scale), denominator = y.amount * 10n ** BigInt(x.scale);
  const absolute = numerator < 0n ? -numerator : numerator, divisor = denominator < 0n ? -denominator : denominator;
  const rounded = absolute / divisor + (absolute % divisor * 2n >= divisor ? 1n : 0n);
  return format(rounded * ((numerator < 0n) !== (denominator < 0n) ? -1n : 1n), scale);
}
export function subtract(a: string, b: string): string {
  const value = decimal(b);
  return add(a, value === '0' ? '0' : value.startsWith('-') ? value.slice(1) : '-' + value);
}
export function compare(a: string, b: string): number {
  const x = parts(a), y = parts(b), scale = Math.max(x.scale, y.scale);
  const delta = x.amount * 10n ** BigInt(scale - x.scale) - y.amount * 10n ** BigInt(scale - y.scale);
  return delta < 0n ? -1 : delta > 0n ? 1 : 0;
}
export function nonnegative(value: string): string {
  const normalized = decimal(value);
  requireThat(compare(normalized, '0') >= 0, 'INVALID_QUANTITY');
  return normalized;
}
