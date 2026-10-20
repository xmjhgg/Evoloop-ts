import { businessDate, requireThat } from '@evoloop/kernel';
import type { ExecutionContext, Transaction } from '../../application/ports/public.ts';
import type { PlanItem, Protection } from './model.ts';
import type { PlanningCollaborators } from '../ports/collaboration.ts';
import { validateNutritionReallocation } from './nutrition-reallocation.ts';

export function validatePublishableRange(
  tx: Transaction,
  context: ExecutionContext,
  ports: PlanningCollaborators,
  item: PlanItem,
  current: PlanItem | undefined,
): void {
  if (item.kind === 'NUTRITION_TOTAL' && item.businessDate === businessDate(context.now)) {
    validateNutritionReallocation(tx, context, ports, item, current);
    return;
  }
  requireThat(
    item.businessDate > businessDate(context.now) &&
      (!item.prescription.startAt || item.prescription.startAt > context.now),
    'PROTECTED_RANGE',
  );
  requireThat(
    !current ||
      current.disposition !== 'PLANNED' ||
      !current.prescription.startAt ||
      current.prescription.startAt > context.now,
    'PROTECTED_RANGE',
  );
  const kind = item.kind === 'NUTRITION_TOTAL' ? 'MEAL' : item.kind;
  requireThat(!ports.hasActual(tx, item.businessDate, kind), 'PROTECTED_RANGE');
  requireThat(!tx.store('planning').get<Protection>('guard', item.businessDate + '|' + kind), 'PROTECTED_RANGE');
}
