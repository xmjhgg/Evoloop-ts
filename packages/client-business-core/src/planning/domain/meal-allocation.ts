import { add, compare, nonnegative, requireThat, subtract } from '@evoloop/kernel';
import type { NutritionTarget } from './model.ts';

export const nutrientKeys = ['energy', 'protein', 'carbohydrate', 'fat'] as const;
/** Checks arithmetic only. It does not invent a personal target or approve a health policy. */
export function mealAllocation(target: NutritionTarget) {
  const meals = target.meals ?? [];
  requireThat(new Set(meals.map((meal) => meal.mealCode)).size === meals.length, 'DUPLICATE_MEAL_ALLOCATION');
  const dimensions = nutrientKeys.map((key) => {
    if (target[key] !== null) nonnegative(target[key]);
    let allocated = '0';
    const unknownMeals: string[] = [];
    for (const meal of meals) {
      const value = meal[key];
      if (value === null) unknownMeals.push(meal.mealCode);
      else allocated = add(allocated, nonnegative(value));
    }
    requireThat(target[key] === null || compare(allocated, target[key]) <= 0, 'MEAL_ALLOCATION_EXCEEDS_TOTAL');
    const complete = meals.length > 0 && unknownMeals.length === 0 && target[key] !== null;
    requireThat(!complete || compare(allocated, target[key]!) === 0, 'MEAL_ALLOCATION_TOTAL_MISMATCH');
    return {
      nutrient: key,
      total: target[key],
      allocated,
      unallocated: target[key] === null ? null : subtract(target[key], allocated),
      unknownMeals,
      complete,
    };
  });
  return {
    status: dimensions.every((value) => value.complete) ? 'COMPLETE' : meals.length ? 'PARTIAL' : 'UNALLOCATED',
    dimensions,
  };
}
