import { canonical, requireThat } from '@evoloop/kernel';
import type { ExecutionContext, Transaction } from '../../application/ports/public.ts';
import type { PlanItem, Protection } from './model.ts';
import type { PlanningCollaborators } from '../ports/collaboration.ts';
import { mealAllocation, nutrientKeys } from './meal-allocation.ts';

export function validateNutritionReallocation(
  tx: Transaction,
  context: ExecutionContext,
  ports: PlanningCollaborators,
  item: PlanItem,
  current: PlanItem | undefined,
): void {
  const guard = tx.store('planning').get<Protection>('guard', item.businessDate + '|MEAL');
  const baseline = guard?.refs.find((ref) => ref.item.id === item.id)?.item;
  requireThat(
    current && baseline && item.disposition === 'PLANNED' && item.goalRevisionId === baseline.goalRevisionId,
    'PROTECTED_RANGE',
  );
  const { nutrition: _newNutrition, ...newPrescription } = item.prescription;
  const { nutrition: _oldNutrition, ...oldPrescription } = current.prescription;
  requireThat(canonical(newPrescription) === canonical(oldPrescription), 'PROTECTED_RANGE');
  const target = item.prescription.nutrition,
    old = current.prescription.nutrition,
    frozen = baseline.prescription.nutrition;
  requireThat(target && old && frozen && target.meals?.length && old.meals?.length, 'PROTECTED_RANGE');
  requireThat(
    nutrientKeys.every((key) => target[key] === frozen[key] && target[key] === old[key]),
    'PROTECTED_NUTRITION_TOTAL',
  );
  mealAllocation(target);
  for (const previous of old.meals) {
    const next = target.meals.find((meal) => meal.mealCode === previous.mealCode);
    const protectedMeal =
      ports.hasMealActual(tx, item.businessDate, previous.mealCode) ||
      previous.startAt === null ||
      previous.startAt <= context.now;
    requireThat(!protectedMeal || canonical(next ?? null) === canonical(previous), 'PROTECTED_MEAL');
  }
  for (const next of target.meals) {
    const previous = old.meals.find((meal) => meal.mealCode === next.mealCode);
    if (canonical(previous ?? null) === canonical(next)) continue;
    requireThat(
      next.startAt !== null && next.startAt > context.now && !ports.hasMealActual(tx, item.businessDate, next.mealCode),
      'PROTECTED_MEAL',
    );
  }
}
