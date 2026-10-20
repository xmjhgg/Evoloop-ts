import { compare, divide, multiply, nonnegative, requireThat } from '@evoloop/kernel';
import type { FoodLine, Nutrition } from './model.ts';

export interface LabelValue {
  readonly state: Nutrition['state'];
  readonly value: string | null;
  readonly lower: string | null;
  readonly upper: string | null;
  readonly unit: 'kcal' | 'kJ' | 'g';
  readonly source: string;
}
export interface LabelLine {
  readonly id: string;
  readonly name: string;
  readonly referenceAmount: string;
  readonly consumedAmount: string | null;
  readonly quantityUnit: 'g' | 'PORTION';
  readonly energy: LabelValue;
  readonly protein: LabelValue;
  readonly carbohydrate: LabelValue;
  readonly fat: LabelValue;
}
export function convertLabelValue(value: LabelValue, unit: Nutrition['unit']): Nutrition {
  requireThat(unit === 'kcal' ? value.unit === 'kcal' || value.unit === 'kJ' : value.unit === 'g', 'UNIT_MISMATCH');
  const convert = (amount: string | null) =>
    amount === null ? null : value.unit === 'kJ' ? divide(nonnegative(amount), '4.184') : nonnegative(amount);
  return {
    state: value.state,
    value: convert(value.value),
    lower: convert(value.lower),
    upper: convert(value.upper),
    unit,
    source: value.source,
    original: {
      unit: value.unit,
      value: value.value,
      lower: value.lower,
      upper: value.upper,
      conversionVersion: 'nutrition-units-v1',
    },
  };
}
export function foodLineFromLabel(input: LabelLine): FoodLine {
  requireThat(compare(nonnegative(input.referenceAmount), '0') > 0, 'REFERENCE_AMOUNT_REQUIRED');
  if (input.consumedAmount !== null) nonnegative(input.consumedAmount);
  return {
    id: input.id,
    name: input.name,
    portionUnit: input.quantityUnit,
    personalFactor: input.consumedAmount === null ? null : divide(input.consumedAmount, input.referenceAmount, 18),
    portion: {
      referenceAmount: input.referenceAmount,
      consumedAmount: input.consumedAmount,
      unit: input.quantityUnit,
      conversionVersion: 'nutrition-units-v1',
    },
    energy: convertLabelValue(input.energy, 'kcal'),
    protein: convertLabelValue(input.protein, 'g'),
    carbohydrate: convertLabelValue(input.carbohydrate, 'g'),
    fat: convertLabelValue(input.fat, 'g'),
  };
}
export function personalNutrient(line: FoodLine, value: string): string | null {
  if (line.portion)
    return line.portion.consumedAmount === null
      ? null
      : divide(multiply(value, line.portion.consumedAmount, 18), line.portion.referenceAmount);
  return line.personalFactor === null ? null : multiply(value, line.personalFactor);
}
