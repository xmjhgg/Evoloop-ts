import { requireThat } from '@evoloop/kernel';
import type { PlanItem } from './model.ts';

export function validateDraftSlots(items: readonly PlanItem[]): void {
  const slots = new Set<string>();
  for (const item of items.filter((value) => value.disposition === 'PLANNED')) {
    if (item.kind !== 'NUTRITION_TOTAL' && item.kind !== 'SLEEP') continue;
    const key = item.businessDate + '|' + item.kind;
    requireThat(!slots.has(key), 'DUPLICATE_PLAN_SLOT');
    slots.add(key);
  }
}
