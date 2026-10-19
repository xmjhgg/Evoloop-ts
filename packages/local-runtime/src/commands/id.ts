import { digest } from '@evoloop/kernel';

export function derivedId(seed: string, label: string): string {
  const hex = digest({ seed, label });
  return hex.slice(0, 8) + '-' + hex.slice(8, 12) + '-4' + hex.slice(13, 16) + '-a' + hex.slice(17, 20) + '-' + hex.slice(20, 32);
}
