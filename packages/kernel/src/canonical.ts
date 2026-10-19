import { sha256 } from '@noble/hashes/sha2.js';
import { utf8ToBytes } from '@noble/hashes/utils.js';
import { requireThat } from './error.ts';

export type Json = null | boolean | string | readonly Json[] | { readonly [key: string]: Json };

/** v1: sorted UTF-16 keys, original array order, no JSON numbers or unpaired surrogates. */
export function canonical(value: unknown): string {
  if (value === null) return 'null';
  if (typeof value === 'boolean') return String(value);
  if (typeof value === 'string') {
    requireThat(!/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/u.test(value), 'INVALID_UNICODE');
    return JSON.stringify(value);
  }
  requireThat(typeof value === 'object', 'CANONICAL_VALUE_INVALID');
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  requireThat(Object.getPrototypeOf(value) === Object.prototype, 'CANONICAL_OBJECT_INVALID');
  const object = value as Record<string, unknown>;
  return '{' + Object.keys(object).sort().map(key => canonical(key) + ':' + canonical(object[key])).join(',') + '}';
}
export function digest(value: unknown): string {
  return Array.from(sha256(utf8ToBytes(canonical(value))), byte => byte.toString(16).padStart(2, '0')).join('');
}
export function copy<T>(value: T): T { return JSON.parse(JSON.stringify(value)) as T; }
export function utf8Length(value: string): number {
  let length = 0;
  for (const character of value) {
    const code = character.codePointAt(0)!;
    length += code < 128 ? 1 : code < 2048 ? 2 : code < 65536 ? 3 : 4;
  }
  return length;
}
