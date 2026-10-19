import { add, compare, multiply, nonnegative, requireThat } from '@evoloop/kernel';
import type { FoodLine, Nutrition } from './model.ts';

export function validateNutrition(value: Nutrition): void {
  requireThat(value.state !== 'UNKNOWN' || value.value === null && value.lower === null && value.upper === null, 'UNKNOWN_HAS_VALUE');
  requireThat(value.state === 'UNKNOWN' || value.value !== null, 'NUTRITION_VALUE_REQUIRED');
  for (const field of [value.value, value.lower, value.upper]) if (field !== null) nonnegative(field);
  requireThat((value.lower === null) === (value.upper === null), 'INVALID_NUTRITION_RANGE');
  if (value.lower !== null && value.upper !== null) {
    requireThat(compare(value.lower, value.upper) <= 0 && (value.value === null || compare(value.value, value.lower) >= 0 && compare(value.value, value.upper) <= 0), 'INVALID_NUTRITION_RANGE');
  }
}
export function validateLines(lines: readonly FoodLine[], requirePortion: boolean): void {
  requireThat(new Set(lines.map(line => line.id)).size === lines.length, 'DUPLICATE_FOOD_LINE');
  for (const line of lines) {
    requireThat(line.name.trim() && line.portionUnit.trim(), 'FOOD_NAME_OR_UNIT_REQUIRED');
    if (requirePortion) requireThat(line.personalFactor !== null, 'PORTION_REQUIRED');
    if (line.personalFactor !== null) nonnegative(line.personalFactor);
    for (const key of ['energy', 'protein', 'carbohydrate', 'fat'] as const) {
      validateNutrition(line[key]);
      requireThat(line[key].unit === (key === 'energy' ? 'kcal' : 'g'), 'UNIT_MISMATCH');
    }
  }
}
export function nutrientTotal(lines: readonly FoodLine[], key: 'energy' | 'protein' | 'carbohydrate' | 'fat') {
  let known = '0', unknown = false, estimated = false;
  for (const line of lines) {
    const value = line[key];
    if (value.value === null || line.personalFactor === null) unknown = true;
    else known = add(known, multiply(value.value, line.personalFactor));
    if (value.state === 'ESTIMATED') estimated = true;
  }
  return { total: lines.length && !unknown ? known : null, knownSubtotal: known, unknown, estimated };
}
