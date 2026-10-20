import { add, canonical, compare, divide, nonnegative, requireThat } from '@evoloop/kernel';
import type { FoodLine, Nutrition } from './model.ts';
import { convertLabelValue, personalNutrient } from './label-conversion.ts';

export function validateNutrition(value: Nutrition): void {
  if (value.original) {
    const converted = convertLabelValue({ ...value.original, state: value.state, source: value.source }, value.unit);
    requireThat(canonical(converted) === canonical(value), 'NUTRITION_PROVENANCE_MISMATCH');
  }
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
    if (line.portion) {
      requireThat(compare(nonnegative(line.portion.referenceAmount), '0') > 0, 'REFERENCE_AMOUNT_REQUIRED');
      const factor = line.portion.consumedAmount === null ? null : divide(nonnegative(line.portion.consumedAmount), line.portion.referenceAmount, 18);
      requireThat(factor === line.personalFactor && line.portion.unit === line.portionUnit, 'PORTION_PROVENANCE_MISMATCH');
    }
    for (const key of ['energy', 'protein', 'carbohydrate', 'fat'] as const) {
      validateNutrition(line[key]);
      requireThat(line[key].unit === (key === 'energy' ? 'kcal' : 'g'), 'UNIT_MISMATCH');
    }
  }
}
export function nutrientTotal(lines: readonly FoodLine[], key: 'energy' | 'protein' | 'carbohydrate' | 'fat') {
  let known = '0', lower = '0', upper = '0', unknown = false, estimated = false, rangeUnknown = false, knownCount = 0;
  for (const line of lines) {
    const value = line[key];
    if (value.value === null || line.personalFactor === null) unknown = true;
    else {
      known = add(known, personalNutrient(line, value.value)!);
      lower = add(lower, personalNutrient(line, value.lower ?? value.value)!);
      upper = add(upper, personalNutrient(line, value.upper ?? value.value)!);
      knownCount++;
    }
    if (value.state === 'ESTIMATED') estimated = true;
    if (value.state === 'ESTIMATED' && value.lower === null) rangeUnknown = true;
  }
  return { total: lines.length && !unknown ? known : null, knownSubtotal: knownCount ? known : null,
    lower: lines.length && !unknown && !rangeUnknown ? lower : null, upper: lines.length && !unknown && !rangeUnknown ? upper : null,
    knownLower: knownCount && !rangeUnknown ? lower : null, knownUpper: knownCount && !rangeUnknown ? upper : null,
    unknown: !lines.length || unknown, estimated, unit: key === 'energy' ? 'kcal' : 'g',
    recordedLineCount: String(lines.length), knownLineCount: String(knownCount), unknownLineCount: String(lines.length - knownCount) };
}
