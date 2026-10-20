import { businessDate, compare, date, nonnegative, requireThat } from '@evoloop/kernel';
import type { PlanItem } from './model.ts';
import { mealAllocation } from './meal-allocation.ts';

export function validateItem(item: PlanItem): void {
  date(item.businessDate);
  requireThat(item.prescription.title.trim().length > 0, 'TITLE_REQUIRED');
  const prescription = item.prescription;
  if (prescription.startAt) {
    const startDay = businessDate(prescription.startAt);
    requireThat(startDay === item.businessDate || item.kind === 'SLEEP' && startDay < item.businessDate, 'PLAN_DATE_MISMATCH');
  }
  if (prescription.minutes !== null) requireThat(compare(nonnegative(prescription.minutes), '0') > 0, 'INVALID_QUANTITY');
  requireThat(new Set(prescription.actions.map(action => action.id)).size === prescription.actions.length, 'DUPLICATE_ACTION');
  for (const action of prescription.actions) {
    requireThat(action.name.trim() && /^[1-9]\d*$/.test(action.sets), 'INVALID_ACTION');
    requireThat(compare(nonnegative(action.quantity), '0') > 0, 'INVALID_ACTION');
    requireThat(action.unit !== 'REP' || /^[1-9]\d*$/.test(action.quantity), 'INVALID_ACTION');
    requireThat(/^(0|[1-9]\d*)$/.test(action.restSeconds), 'INVALID_ACTION');
  }
  if (prescription.learning?.quantity !== null && prescription.learning?.quantity !== undefined) {
    nonnegative(prescription.learning.quantity);
    requireThat(prescription.learning.unit, 'UNIT_REQUIRED');
  }
  if (prescription.nutrition) {
    for (const key of ['energy', 'protein', 'carbohydrate', 'fat'] as const) {
      const value = prescription.nutrition[key];
      if (value !== null) nonnegative(value);
    }
    mealAllocation(prescription.nutrition);
    for (const meal of prescription.nutrition.meals ?? []) {
      if (meal.startAt !== null) requireThat(businessDate(meal.startAt) === item.businessDate, 'PLAN_DATE_MISMATCH');
    }
  }
}
